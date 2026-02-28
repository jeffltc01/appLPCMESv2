using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;

namespace LPCylinderMES.Api.Tests;

public class SetupRoutingServiceTests
{
    [Fact]
    public async Task CreateProductionLineAsync_ValidPayload_CreatesRecord()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CreateProductionLineAsync_ValidPayload_CreatesRecord));
        var service = new SetupRoutingService(db);

        var created = await service.CreateProductionLineAsync(new ProductionLineUpsertDto(
            "PL-REFURB",
            "Refurb",
            ["OrderProduct", "OrderReceiving"]));

        Assert.Equal("PL-REFURB", created.Code);
        Assert.Equal("Refurb", created.Name);
        Assert.Contains("OrderProduct", created.ShowWhere);
        Assert.Contains("OrderReceiving", created.ShowWhere);
    }

    [Fact]
    public async Task CreateProductionLineAsync_WithoutShowWhere_ThrowsBadRequest()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CreateProductionLineAsync_WithoutShowWhere_ThrowsBadRequest));
        var service = new SetupRoutingService(db);

        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.CreateProductionLineAsync(
            new ProductionLineUpsertDto("PL-EMPTY", "Empty", [])));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task DeleteProductionLineAsync_WhenReferencedByItem_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(DeleteProductionLineAsync_WhenReferencedByItem_ThrowsConflict));
        db.ProductionLines.Add(new ProductionLine
        {
            Id = 1,
            Code = "PL-USED",
            Name = "Used",
            ShowWhereMask = 15,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.Items.Add(new Item
        {
            Id = 10,
            ItemNo = "IT-10",
            ItemType = "Tank",
            ProductLine = "PL-USED",
            RequiresSerialNumbers = 0,
        });
        await db.SaveChangesAsync();

        var service = new SetupRoutingService(db);
        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.DeleteProductionLineAsync(1));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

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
                new RouteTemplateStepUpsertDto(1, "STEP-1", "Step 1", 100, true, "ElectronicRequired", "Automated", true, false, false, false, false, null, "BlockCompletion", true, false, false, false, false, false, false, true, null),
                new RouteTemplateStepUpsertDto(1, "STEP-2", "Step 2", 100, true, "ElectronicRequired", "Automated", true, false, false, false, false, null, "BlockCompletion", true, false, false, false, false, false, false, true, null),
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
            null,
            null,
            null,
            null,
            200,
            null,
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

    [Fact]
    public async Task CreateRoleAsync_DuplicateName_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CreateRoleAsync_DuplicateName_ThrowsConflict));
        db.AppRoles.Add(new AppRole
        {
            Id = 1,
            RoleName = "Admin",
            IsActive = true,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new SetupRoutingService(db);
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CreateRoleAsync(new AppRoleUpsertDto("Admin", null, true)));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task CreateUserAsync_WithRoleAssignments_CreatesUserWithRoles()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CreateUserAsync_WithRoleAssignments_CreatesUserWithRoles));
        SeedCommonLookups(db);
        db.AppRoles.AddRange(
            new AppRole { Id = 1000, RoleName = "Admin", IsActive = true, CreatedUtc = DateTime.UtcNow, UpdatedUtc = DateTime.UtcNow },
            new AppRole { Id = 1001, RoleName = "Setup", IsActive = true, CreatedUtc = DateTime.UtcNow, UpdatedUtc = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var service = new SetupRoutingService(db);
        var created = await service.CreateUserAsync(new AppUserUpsertDto(
            "EMP100",
            "Test User",
            "test.user@example.com",
            1,
            "Active",
            true,
            [
                new AppUserRoleAssignmentUpsertDto(1000, null),
                new AppUserRoleAssignmentUpsertDto(1001, 1),
            ]));

        Assert.Equal("EMP100", created.EmpNo);
        Assert.Equal("Test User", created.DisplayName);
        Assert.Equal(2, created.Roles.Count);
        Assert.Contains(created.Roles, r => r.RoleName == "Admin" && r.SiteId is null);
        Assert.Contains(created.Roles, r => r.RoleName == "Setup" && r.SiteId == 1);
    }

    [Fact]
    public async Task DeleteRoleAsync_WhenAssignedToUser_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(DeleteRoleAsync_WhenAssignedToUser_ThrowsConflict));
        SeedCommonLookups(db);
        db.AppRoles.Add(new AppRole { Id = 11, RoleName = "Admin", IsActive = true, CreatedUtc = DateTime.UtcNow, UpdatedUtc = DateTime.UtcNow });
        db.AppUsers.Add(new AppUser
        {
            Id = 21,
            EmpNo = "EMP-21",
            DisplayName = "Assigned User",
            State = "Active",
            IsActive = true,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.AppUserRoles.Add(new AppUserRole
        {
            Id = 31,
            UserId = 21,
            RoleId = 11,
            CreatedUtc = DateTime.UtcNow,
            CreatedBy = "test",
        });
        await db.SaveChangesAsync();

        var service = new SetupRoutingService(db);
        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.DeleteRoleAsync(11));
        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
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
