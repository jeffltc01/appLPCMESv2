using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;

namespace LPCylinderMES.Api.Tests;

public class SetupRoutingServiceTests
{
    [Fact]
    public async Task CreateRouteTemplateAsync_DuplicateStepSequence_ThrowsBadRequest()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CreateRouteTemplateAsync_DuplicateStepSequence_ThrowsBadRequest));
        SeedCommonLookups(db);
        db.WorkCenters.Add(new WorkCenter
        {
            Id = 100,
            WorkCenterCode = "WC-100",
            WorkCenterName = "Cut",
            SiteId = 1,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new SetupRoutingService(db);
        var dto = new RouteTemplateUpsertDto(
            "RT-100",
            "Template 100",
            null,
            true,
            1,
            [
                new RouteTemplateStepUpsertDto(1, "STEP-1", "Step 1", 100, true, "ElectronicRequired", "Automated", true, false, false, false, false, "BlockCompletion", true, false, false, false, false, false, false),
                new RouteTemplateStepUpsertDto(1, "STEP-2", "Step 2", 100, true, "ElectronicRequired", "Automated", true, false, false, false, false, "BlockCompletion", true, false, false, false, false, false, false),
            ]);

        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.CreateRouteTemplateAsync(dto));
        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task CreateAssignmentAsync_OverlappingWindow_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CreateAssignmentAsync_OverlappingWindow_ThrowsConflict));
        SeedCommonLookups(db);
        SeedTemplate(db, templateId: 200, workCenterId: 201);
        db.RouteTemplateAssignments.Add(new RouteTemplateAssignment
        {
            Id = 210,
            AssignmentName = "Base Assignment",
            Priority = 1,
            RevisionNo = 1,
            IsActive = true,
            CustomerId = 1,
            SiteId = 1,
            ItemId = 10,
            RouteTemplateId = 200,
            EffectiveFromUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            EffectiveToUtc = new DateTime(2026, 1, 31, 0, 0, 0, DateTimeKind.Utc),
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new SetupRoutingService(db);
        var dto = new RouteTemplateAssignmentUpsertDto(
            "Overlapping",
            1,
            2,
            true,
            1,
            1,
            10,
            null,
            200,
            new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 2, 10, 0, 0, 0, DateTimeKind.Utc));

        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.CreateAssignmentAsync(dto));
        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task SimulateRouteAsync_SameTier_PrefersLowerPriorityNumber()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(SimulateRouteAsync_SameTier_PrefersLowerPriorityNumber));
        SeedCommonLookups(db);
        SeedTemplate(db, templateId: 300, workCenterId: 301, templateCode: "RT-HIGH");
        SeedTemplate(db, templateId: 310, workCenterId: 311, templateCode: "RT-WIN");
        db.RouteTemplateAssignments.AddRange(
            new RouteTemplateAssignment
            {
                Id = 320,
                AssignmentName = "Exact lower precedence",
                Priority = 99,
                RevisionNo = 1,
                IsActive = true,
                CustomerId = 1,
                SiteId = 1,
                ItemId = 10,
                RouteTemplateId = 300,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            new RouteTemplateAssignment
            {
                Id = 321,
                AssignmentName = "Exact higher precedence",
                Priority = 1,
                RevisionNo = 1,
                IsActive = true,
                CustomerId = 1,
                SiteId = 1,
                ItemId = 10,
                RouteTemplateId = 310,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            });
        await db.SaveChangesAsync();

        var service = new SetupRoutingService(db);
        var result = await service.SimulateRouteAsync(new RouteRuleSimulationRequestDto(1, 1, 10));

        Assert.True(result.Matched);
        Assert.Equal(1, result.MatchTier);
        Assert.NotNull(result.Assignment);
        Assert.Equal(321, result.Assignment!.Id);
        Assert.Equal("RT-WIN", result.RouteTemplate?.RouteTemplateCode);
    }

    [Fact]
    public async Task DeleteWorkCenterAsync_WhenReferenced_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(DeleteWorkCenterAsync_WhenReferenced_ThrowsConflict));
        SeedCommonLookups(db);
        SeedTemplate(db, templateId: 400, workCenterId: 401);
        await db.SaveChangesAsync();

        var service = new SetupRoutingService(db);
        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.DeleteWorkCenterAsync(401));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task CreateWorkCenterAsync_InvalidTimeCaptureMode_ThrowsBadRequest()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CreateWorkCenterAsync_InvalidTimeCaptureMode_ThrowsBadRequest));
        SeedCommonLookups(db);
        await db.SaveChangesAsync();

        var service = new SetupRoutingService(db);
        var dto = new WorkCenterUpsertDto("WC-BAD", "Bad", 1, null, true, "MachineFeed", true);

        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.CreateWorkCenterAsync(dto));
        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    private static void SeedCommonLookups(LpcAppsDbContext db)
    {
        db.Sites.Add(new Site { Id = 1, Name = "Main", SiteCode = "MAIN" });
        db.Customers.Add(new Customer { Id = 1, Name = "Customer 1" });
        db.Items.Add(new Item
        {
            Id = 10,
            ItemNo = "TNK-10",
            ItemType = "Tank",
            RequiresSerialNumbers = 0,
        });
    }

    private static void SeedTemplate(
        LpcAppsDbContext db,
        int templateId,
        int workCenterId,
        string? templateCode = null)
    {
        db.WorkCenters.Add(new WorkCenter
        {
            Id = workCenterId,
            WorkCenterCode = $"WC-{workCenterId}",
            WorkCenterName = "Routing WC",
            SiteId = 1,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });

        db.RouteTemplates.Add(new RouteTemplate
        {
            Id = templateId,
            RouteTemplateCode = templateCode ?? $"RT-{templateId}",
            RouteTemplateName = "Routing Template",
            IsActive = true,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
            Steps =
            {
                new RouteTemplateStep
                {
                    Id = templateId + 1,
                    StepSequence = 1,
                    StepCode = "STEP-1",
                    StepName = "Prep",
                    WorkCenterId = workCenterId,
                    IsRequired = true,
                    DataCaptureMode = "ElectronicRequired",
                    TimeCaptureMode = "Automated",
                    RequiresScan = true,
                    ChecklistFailurePolicy = "BlockCompletion",
                },
            },
        });
    }
}
