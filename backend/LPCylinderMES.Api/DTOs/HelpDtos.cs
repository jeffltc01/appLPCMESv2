namespace LPCylinderMES.Api.DTOs;

public record HelpTopicErrorDto(
    string Error,
    string? Cause,
    IReadOnlyList<string> Recovery);

public record HelpTopicDto(
    string TopicId,
    string Title,
    IReadOnlyList<string> AppliesToRoles,
    IReadOnlyList<string> AppliesToPages,
    string Purpose,
    IReadOnlyList<string> WhenToUse,
    IReadOnlyList<string> Prerequisites,
    IReadOnlyList<string> StepByStepActions,
    string ExpectedResult,
    IReadOnlyList<HelpTopicErrorDto> CommonErrorsAndRecovery,
    IReadOnlyList<string> RelatedTopics,
    DateTime LastValidatedOnUtc,
    string ValidatedBy,
    IReadOnlyList<string>? ScreenshotsOrDiagrams,
    IReadOnlyList<string>? KnownLimitations,
    string? EscalationPath,
    IReadOnlyList<string>? ExternalReferenceLinks,
    IReadOnlyList<string>? SiteScope,
    IReadOnlyList<string>? FeatureFlags);
