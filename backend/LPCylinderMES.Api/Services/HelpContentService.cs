using System.Text.Json;
using LPCylinderMES.Api.DTOs;
using Microsoft.Extensions.Options;

namespace LPCylinderMES.Api.Services;

public sealed class HelpContentService : IHelpContentService
{
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Office",
        "Transportation",
        "Receiving",
        "Production",
        "Supervisor",
        "Quality",
        "PlantManager",
        "Setup",
        "Admin",
        "ReadOnly",
        "Setup/Admin",
    };

    private readonly ILogger<HelpContentService> _logger;
    private readonly IReadOnlyList<HelpTopicDocument> _topics;

    public HelpContentService(
        IOptions<HelpContentOptions> options,
        IHostEnvironment environment,
        ILogger<HelpContentService> logger)
    {
        _logger = logger;
        _topics = LoadTopics(options.Value, environment);
    }

    public Task<IReadOnlyList<HelpTopicDto>> GetTopicsAsync(
        string route,
        IReadOnlyCollection<string> roles,
        string? context = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedRoute = NormalizeRoute(route);
        var normalizedContext = context?.Trim();
        var roleSet = NormalizeRoleSet(roles);

        _logger.LogInformation(
            "Help topics requested for route {Route} roles {Roles} context {Context}",
            normalizedRoute,
            roleSet.ToArray(),
            normalizedContext);

        var ordered = _topics
            .Select(topic => new
            {
                Topic = topic,
                RouteMatchScore = GetRouteMatchScore(topic, normalizedRoute),
            })
            .Where(entry => entry.RouteMatchScore >= 0)
            .Where(entry => IsAllowedForRoles(entry.Topic, roleSet))
            .Where(entry => MatchesContext(entry.Topic, normalizedContext))
            .OrderBy(entry => entry.RouteMatchScore)
            .ThenBy(entry => entry.Topic.Title, StringComparer.OrdinalIgnoreCase)
            .Select(entry => entry.Topic.ToDto())
            .ToList();

        return Task.FromResult<IReadOnlyList<HelpTopicDto>>(ordered);
    }

    public Task<HelpTopicDto?> GetTopicByIdAsync(
        string topicId,
        IReadOnlyCollection<string> roles,
        CancellationToken cancellationToken = default)
    {
        var roleSet = NormalizeRoleSet(roles);
        var topic = _topics.FirstOrDefault(
            candidate =>
                candidate.TopicId.Equals(topicId, StringComparison.OrdinalIgnoreCase) &&
                IsAllowedForRoles(candidate, roleSet));

        return Task.FromResult(topic?.ToDto());
    }

    private IReadOnlyList<HelpTopicDocument> LoadTopics(HelpContentOptions options, IHostEnvironment environment)
    {
        if (!string.Equals(options.SourceType, "File", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Unsupported HelpContent:SourceType '{options.SourceType}'.");
        }

        var basePath = ResolveBasePath(options.BasePath, environment.ContentRootPath);
        if (!Directory.Exists(basePath))
        {
            var message = $"Help topic source path '{basePath}' does not exist.";
            if (environment.IsProduction())
            {
                _logger.LogCritical("{Message}", message);
                return Array.Empty<HelpTopicDocument>();
            }

            throw new InvalidOperationException(message);
        }

        var topicFiles = Directory.GetFiles(basePath, "*.json", SearchOption.TopDirectoryOnly)
            .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var topics = new List<HelpTopicDocument>(topicFiles.Length);
        var validationErrors = new List<HelpValidationError>();
        var ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var topicFile in topicFiles)
        {
            HelpTopicDocument? parsed;
            try
            {
                var json = File.ReadAllText(topicFile);
                parsed = JsonSerializer.Deserialize<HelpTopicDocument>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                });
            }
            catch (Exception ex)
            {
                validationErrors.Add(new HelpValidationError(
                    "JsonParseError",
                    $"Unable to parse topic file '{topicFile}': {ex.Message}",
                    null));
                continue;
            }

            if (parsed is null)
            {
                validationErrors.Add(new HelpValidationError(
                    "NullTopicDocument",
                    $"Topic file '{topicFile}' did not deserialize to a topic object.",
                    null));
                continue;
            }

            ValidateTopic(topicFile, parsed, validationErrors);

            if (!string.IsNullOrWhiteSpace(parsed.TopicId) && !ids.Add(parsed.TopicId))
            {
                validationErrors.Add(new HelpValidationError(
                    "DuplicateTopicId",
                    $"Duplicate topicId '{parsed.TopicId}' in '{topicFile}'.",
                    parsed.TopicId));
            }

            topics.Add(parsed);
        }

        foreach (var topic in topics)
        {
            foreach (var relatedTopicId in topic.RelatedTopics ?? Enumerable.Empty<string>())
            {
                if (!ids.Contains(relatedTopicId))
                {
                    validationErrors.Add(new HelpValidationError(
                        "BrokenRelatedTopicReference",
                        $"Topic '{topic.TopicId}' references missing related topic '{relatedTopicId}'.",
                        topic.TopicId));
                }
            }
        }

        if (validationErrors.Count > 0)
        {
            foreach (var error in validationErrors)
            {
                _logger.LogError(
                    "Help topic validation failed {ValidationErrorCode} {TopicId} {Message}",
                    error.Code,
                    error.TopicId ?? "(unknown)",
                    error.Message);
            }

            if (!environment.IsProduction())
            {
                throw new InvalidOperationException(
                    $"Help topic validation failed with {validationErrors.Count} issue(s).");
            }
        }

        _logger.LogInformation("Loaded {TopicCount} help topic(s) from {BasePath}", topics.Count, basePath);
        return topics;
    }

    private static void ValidateTopic(
        string sourcePath,
        HelpTopicDocument topic,
        List<HelpValidationError> validationErrors)
    {
        if (string.IsNullOrWhiteSpace(topic.TopicId))
        {
            validationErrors.Add(new HelpValidationError("MissingTopicId", $"Missing topicId in '{sourcePath}'.", null));
        }

        if (string.IsNullOrWhiteSpace(topic.Title))
        {
            validationErrors.Add(new HelpValidationError("MissingTitle", $"Missing title for topic '{topic.TopicId}'.", topic.TopicId));
        }

        if (topic.AppliesToRoles is null || topic.AppliesToRoles.Count == 0)
        {
            validationErrors.Add(new HelpValidationError("MissingAppliesToRoles", $"Missing appliesToRoles for topic '{topic.TopicId}'.", topic.TopicId));
        }
        else
        {
            var invalidRoles = topic.AppliesToRoles.Where(role => !AllowedRoles.Contains(role)).ToArray();
            if (invalidRoles.Length > 0)
            {
                validationErrors.Add(new HelpValidationError(
                    "InvalidRoleName",
                    $"Topic '{topic.TopicId}' has invalid role(s): {string.Join(", ", invalidRoles)}.",
                    topic.TopicId));
            }
        }

        if (topic.AppliesToPages is null || topic.AppliesToPages.Count == 0)
        {
            validationErrors.Add(new HelpValidationError("MissingAppliesToPages", $"Missing appliesToPages for topic '{topic.TopicId}'.", topic.TopicId));
        }

        if (string.IsNullOrWhiteSpace(topic.Purpose))
        {
            validationErrors.Add(new HelpValidationError("MissingPurpose", $"Missing purpose for topic '{topic.TopicId}'.", topic.TopicId));
        }

        if (topic.StepByStepActions is null || topic.StepByStepActions.Count == 0)
        {
            validationErrors.Add(new HelpValidationError("MissingStepByStepActions", $"Missing stepByStepActions for topic '{topic.TopicId}'.", topic.TopicId));
        }

        if (topic.CommonErrorsAndRecovery is null || topic.CommonErrorsAndRecovery.Count == 0)
        {
            validationErrors.Add(new HelpValidationError("MissingCommonErrorsAndRecovery", $"Missing commonErrorsAndRecovery for topic '{topic.TopicId}'.", topic.TopicId));
        }

        if (string.IsNullOrWhiteSpace(topic.ExpectedResult))
        {
            validationErrors.Add(new HelpValidationError("MissingExpectedResult", $"Missing expectedResult for topic '{topic.TopicId}'.", topic.TopicId));
        }

        if (string.IsNullOrWhiteSpace(topic.ValidatedBy))
        {
            validationErrors.Add(new HelpValidationError("MissingValidatedBy", $"Missing validatedBy for topic '{topic.TopicId}'.", topic.TopicId));
        }

        if (!DateTime.TryParse(topic.LastValidatedOnUtc, out _))
        {
            validationErrors.Add(new HelpValidationError("InvalidTimestampFormat", $"Invalid lastValidatedOnUtc for topic '{topic.TopicId}'.", topic.TopicId));
        }
    }

    private static bool IsAllowedForRoles(HelpTopicDocument topic, HashSet<string> roleSet) =>
        topic.AppliesToRoles?.Any(roleSet.Contains) == true;

    private static bool MatchesContext(HelpTopicDocument topic, string? context)
    {
        if (string.IsNullOrWhiteSpace(context))
        {
            return true;
        }

        return topic.WhenToUse.Any(line => line.Contains(context, StringComparison.OrdinalIgnoreCase)) ||
               topic.StepByStepActions.Any(line => line.Contains(context, StringComparison.OrdinalIgnoreCase)) ||
               topic.AppliesToPages.Any(page => page.Contains(context, StringComparison.OrdinalIgnoreCase)) ||
               topic.Purpose.Contains(context, StringComparison.OrdinalIgnoreCase);
    }

    private static int GetRouteMatchScore(HelpTopicDocument topic, string normalizedRoute)
    {
        var scores = topic.AppliesToPages
            .Select(pattern => GetSinglePatternScore(pattern, normalizedRoute))
            .Where(score => score >= 0)
            .ToArray();

        return scores.Length == 0 ? -1 : scores.Min();
    }

    private static int GetSinglePatternScore(string pattern, string route)
    {
        var normalizedPattern = NormalizeRoute(pattern);
        if (normalizedPattern.Equals(route, StringComparison.OrdinalIgnoreCase))
        {
            return 0;
        }

        var patternSegments = normalizedPattern.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var routeSegments = route.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (patternSegments.Length != routeSegments.Length)
        {
            return -1;
        }

        var exactMatches = 0;
        for (var i = 0; i < patternSegments.Length; i++)
        {
            var patternSegment = patternSegments[i];
            var routeSegment = routeSegments[i];

            if (patternSegment.StartsWith(":", StringComparison.Ordinal))
            {
                continue;
            }

            if (!patternSegment.Equals(routeSegment, StringComparison.OrdinalIgnoreCase))
            {
                return -1;
            }

            exactMatches++;
        }

        return patternSegments.Length - exactMatches;
    }

    private static string ResolveBasePath(string configuredPath, string contentRootPath)
    {
        if (Path.IsPathRooted(configuredPath))
        {
            return configuredPath;
        }

        return Path.GetFullPath(Path.Combine(contentRootPath, configuredPath));
    }

    private static string NormalizeRoute(string route)
    {
        if (string.IsNullOrWhiteSpace(route))
        {
            return "/";
        }

        var routeWithoutQuery = route.Split('?', 2, StringSplitOptions.TrimEntries)[0].Trim();
        if (!routeWithoutQuery.StartsWith("/", StringComparison.Ordinal))
        {
            routeWithoutQuery = "/" + routeWithoutQuery;
        }

        return routeWithoutQuery.Length > 1
            ? routeWithoutQuery.TrimEnd('/')
            : routeWithoutQuery;
    }

    private static HashSet<string> NormalizeRoleSet(IReadOnlyCollection<string> roles)
    {
        var normalized = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var role in roles.Where(role => !string.IsNullOrWhiteSpace(role)))
        {
            normalized.Add(role.Trim());
        }

        if (normalized.Count == 0)
        {
            normalized.Add("Office");
        }

        return normalized;
    }

    private sealed record HelpValidationError(string Code, string Message, string? TopicId);

    private sealed class HelpTopicDocument
    {
        public string TopicId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public List<string> AppliesToRoles { get; set; } = [];
        public List<string> AppliesToPages { get; set; } = [];
        public string Purpose { get; set; } = string.Empty;
        public List<string> WhenToUse { get; set; } = [];
        public List<string> Prerequisites { get; set; } = [];
        public List<string> StepByStepActions { get; set; } = [];
        public string ExpectedResult { get; set; } = string.Empty;
        public List<HelpTopicErrorDocument> CommonErrorsAndRecovery { get; set; } = [];
        public List<string> RelatedTopics { get; set; } = [];
        public string LastValidatedOnUtc { get; set; } = string.Empty;
        public string ValidatedBy { get; set; } = string.Empty;
        public List<string>? ScreenshotsOrDiagrams { get; set; }
        public List<string>? KnownLimitations { get; set; }
        public string? EscalationPath { get; set; }
        public List<string>? ExternalReferenceLinks { get; set; }
        public List<string>? SiteScope { get; set; }
        public List<string>? FeatureFlags { get; set; }

        public HelpTopicDto ToDto() =>
            new(
                TopicId,
                Title,
                AppliesToRoles,
                AppliesToPages,
                Purpose,
                WhenToUse,
                Prerequisites,
                StepByStepActions,
                ExpectedResult,
                CommonErrorsAndRecovery.Select(error => error.ToDto()).ToList(),
                RelatedTopics,
                DateTime.Parse(LastValidatedOnUtc),
                ValidatedBy,
                ScreenshotsOrDiagrams,
                KnownLimitations,
                EscalationPath,
                ExternalReferenceLinks,
                SiteScope,
                FeatureFlags);
    }

    private sealed class HelpTopicErrorDocument
    {
        public string Error { get; set; } = string.Empty;
        public string? Cause { get; set; }
        public List<string> Recovery { get; set; } = [];

        public HelpTopicErrorDto ToDto() => new(Error, Cause, Recovery);
    }
}
