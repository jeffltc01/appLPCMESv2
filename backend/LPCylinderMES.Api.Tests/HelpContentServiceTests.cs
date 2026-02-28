using LPCylinderMES.Api.Services;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace LPCylinderMES.Api.Tests;

public sealed class HelpContentServiceTests
{
    [Fact]
    public async Task GetTopicsAsync_FiltersByRouteAndRole()
    {
        using var fixture = new HelpTopicFixture();
        fixture.WriteTopic("order-list.json", """
        {
          "topicId": "order-list-overview",
          "title": "Order list",
          "appliesToRoles": ["Office", "ReadOnly"],
          "appliesToPages": ["/orders"],
          "purpose": "Order list purpose",
          "whenToUse": ["Find orders"],
          "prerequisites": ["Signed in"],
          "stepByStepActions": ["Search"],
          "expectedResult": "List appears",
          "commonErrorsAndRecovery": [{ "error": "Unable to load orders.", "recovery": ["Retry"] }],
          "relatedTopics": ["order-entry-overview"],
          "lastValidatedOnUtc": "2026-02-28T00:00:00Z",
          "validatedBy": "QA"
        }
        """);
        fixture.WriteTopic("order-entry.json", """
        {
          "topicId": "order-entry-overview",
          "title": "Order entry",
          "appliesToRoles": ["Office"],
          "appliesToPages": ["/orders/:orderId"],
          "purpose": "Order entry purpose",
          "whenToUse": ["Edit order"],
          "prerequisites": ["Signed in"],
          "stepByStepActions": ["Save"],
          "expectedResult": "Order saved",
          "commonErrorsAndRecovery": [{ "error": "Failed to save order.", "recovery": ["Retry"] }],
          "relatedTopics": ["order-list-overview"],
          "lastValidatedOnUtc": "2026-02-28T00:00:00Z",
          "validatedBy": "QA"
        }
        """);

        var service = fixture.CreateService();

        var listTopics = await service.GetTopicsAsync("/orders", ["ReadOnly"]);
        var detailTopics = await service.GetTopicsAsync("/orders/123", ["Office"]);

        Assert.Single(listTopics);
        Assert.Equal("order-list-overview", listTopics[0].TopicId);
        Assert.Single(detailTopics);
        Assert.Equal("order-entry-overview", detailTopics[0].TopicId);
    }

    [Fact]
    public void Constructor_Throws_OnInvalidRoleName()
    {
        using var fixture = new HelpTopicFixture();
        fixture.WriteTopic("invalid-role.json", """
        {
          "topicId": "invalid-role-topic",
          "title": "Invalid role topic",
          "appliesToRoles": ["UnknownRole"],
          "appliesToPages": ["/orders"],
          "purpose": "Purpose",
          "whenToUse": ["Use"],
          "prerequisites": ["Signed in"],
          "stepByStepActions": ["Action"],
          "expectedResult": "Done",
          "commonErrorsAndRecovery": [{ "error": "Error", "recovery": ["Recovery"] }],
          "relatedTopics": [],
          "lastValidatedOnUtc": "2026-02-28T00:00:00Z",
          "validatedBy": "QA"
        }
        """);

        Assert.Throws<InvalidOperationException>(() => fixture.CreateService());
    }

    [Fact]
    public async Task GetTopicByIdAsync_RespectsRoleVisibility()
    {
        using var fixture = new HelpTopicFixture();
        fixture.WriteTopic("office-only.json", """
        {
          "topicId": "office-only-topic",
          "title": "Office only topic",
          "appliesToRoles": ["Office"],
          "appliesToPages": ["/orders"],
          "purpose": "Purpose",
          "whenToUse": ["Use"],
          "prerequisites": ["Signed in"],
          "stepByStepActions": ["Action"],
          "expectedResult": "Done",
          "commonErrorsAndRecovery": [{ "error": "Error", "recovery": ["Recovery"] }],
          "relatedTopics": [],
          "lastValidatedOnUtc": "2026-02-28T00:00:00Z",
          "validatedBy": "QA"
        }
        """);

        var service = fixture.CreateService();

        var denied = await service.GetTopicByIdAsync("office-only-topic", ["ReadOnly"]);
        var allowed = await service.GetTopicByIdAsync("office-only-topic", ["Office"]);

        Assert.Null(denied);
        Assert.NotNull(allowed);
    }

    private sealed class HelpTopicFixture : IDisposable
    {
        private readonly string _directoryPath;

        public HelpTopicFixture()
        {
            _directoryPath = Path.Combine(Path.GetTempPath(), $"help-topic-tests-{Guid.NewGuid():N}");
            Directory.CreateDirectory(_directoryPath);
        }

        public void WriteTopic(string fileName, string content) =>
            File.WriteAllText(Path.Combine(_directoryPath, fileName), content);

        public HelpContentService CreateService()
        {
            var options = Options.Create(new HelpContentOptions
            {
                SourceType = "File",
                BasePath = _directoryPath,
                EnableSchemaValidation = true,
            });

            return new HelpContentService(
                options,
                new TestHostEnvironment { EnvironmentName = Environments.Development, ContentRootPath = _directoryPath },
                NullLogger<HelpContentService>.Instance);
        }

        public void Dispose()
        {
            if (Directory.Exists(_directoryPath))
            {
                Directory.Delete(_directoryPath, true);
            }
        }
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "Tests";
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
