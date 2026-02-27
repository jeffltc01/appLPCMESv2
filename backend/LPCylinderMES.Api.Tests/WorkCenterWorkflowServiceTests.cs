using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Tests;

public class WorkCenterWorkflowServiceTests
{
    [Fact]
    public async Task ScanInAsync_WhenPreviousRequiredStepIncomplete_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ScanInAsync_WhenPreviousRequiredStepIncomplete_ThrowsConflict));
        SeedRouteWithTwoSteps(db, orderId: 500, lineId: 5001, routeId: 5100, firstStepState: "Pending", secondStepState: "Pending");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.ScanInAsync(500, 5001, 5102, new OperatorScanInDto("EMP001", null)));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenUsageRequiredWithoutUsage_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenUsageRequiredWithoutUsage_ThrowsConflict));
        SeedRouteWithTwoSteps(db, orderId: 600, lineId: 6001, routeId: 6100, firstStepState: "Completed", secondStepState: "InProgress", requiresUsageForSecond: true);
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CompleteStepAsync(600, 6001, 6102, new CompleteWorkCenterStepDto("EMP002", null)));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenChecklistBlockPolicyFails_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenChecklistBlockPolicyFails_ThrowsConflict));
        SeedRouteWithTwoSteps(
            db,
            orderId: 601,
            lineId: 6011,
            routeId: 6110,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            requiresChecklistForSecond: true,
            checklistFailurePolicyForSecond: "BlockCompletion");
        db.StepChecklistResults.Add(new StepChecklistResult
        {
            OrderLineRouteStepInstanceId = 6112,
            ChecklistTemplateItemId = 1,
            ItemLabel = "Leak test",
            IsRequiredItem = true,
            ResultStatus = "Fail",
            CompletedByEmpNo = "EMP001",
            CompletedUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CompleteStepAsync(601, 6011, 6112, new CompleteWorkCenterStepDto("EMP002", null)));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("blocks completion", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenChecklistOverridePolicyMissingOverride_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenChecklistOverridePolicyMissingOverride_ThrowsConflict));
        SeedRouteWithTwoSteps(
            db,
            orderId: 602,
            lineId: 6021,
            routeId: 6120,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            requiresChecklistForSecond: true,
            checklistFailurePolicyForSecond: "AllowWithSupervisorOverride");
        db.StepChecklistResults.Add(new StepChecklistResult
        {
            OrderLineRouteStepInstanceId = 6122,
            ChecklistTemplateItemId = 1,
            ItemLabel = "Leak test",
            IsRequiredItem = true,
            ResultStatus = "Fail",
            CompletedByEmpNo = "EMP001",
            CompletedUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CompleteStepAsync(602, 6021, 6122, new CompleteWorkCenterStepDto("EMP002", null)));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("supervisor override", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenChecklistOverridePolicyIncludesOverride_CompletesStep()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenChecklistOverridePolicyIncludesOverride_CompletesStep));
        SeedRouteWithTwoSteps(
            db,
            orderId: 603,
            lineId: 6031,
            routeId: 6130,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            requiresChecklistForSecond: true,
            checklistFailurePolicyForSecond: "AllowWithSupervisorOverride");
        db.StepChecklistResults.Add(new StepChecklistResult
        {
            OrderLineRouteStepInstanceId = 6132,
            ChecklistTemplateItemId = 1,
            ItemLabel = "Leak test",
            IsRequiredItem = true,
            ResultStatus = "Fail",
            CompletedByEmpNo = "EMP001",
            CompletedUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var response = await service.CompleteStepAsync(
            603,
            6031,
            6132,
            new CompleteWorkCenterStepDto(
                "EMP002",
                null,
                SupervisorOverrideEmpNo: "SUP001",
                SupervisorOverrideReason: "Allowed with review"));

        Assert.Equal(603, response.OrderId);
        var step = await db.OrderLineRouteStepInstances.FirstAsync(s => s.Id == 6132);
        Assert.Equal("Completed", step.State);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenAttachmentRequiredWithoutAttachment_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenAttachmentRequiredWithoutAttachment_ThrowsConflict));
        SeedRouteWithTwoSteps(db, orderId: 604, lineId: 6041, routeId: 6140, firstStepState: "Completed", secondStepState: "InProgress", requiresAttachmentForSecond: true);
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CompleteStepAsync(604, 6041, 6142, new CompleteWorkCenterStepDto("EMP002", null)));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("attachment", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenTrailerRequiredWithoutTrailer_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenTrailerRequiredWithoutTrailer_ThrowsConflict));
        SeedRouteWithTwoSteps(db, orderId: 605, lineId: 6051, routeId: 6150, firstStepState: "Completed", secondStepState: "InProgress", requiresTrailerForSecond: true);
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CompleteStepAsync(605, 6051, 6152, new CompleteWorkCenterStepDto("EMP002", null)));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("trailer", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenSerialMarkedBadWithoutScrapReason_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenSerialMarkedBadWithoutScrapReason_ThrowsConflict));
        SeedRouteWithTwoSteps(db, orderId: 606, lineId: 6061, routeId: 6160, firstStepState: "Completed", secondStepState: "InProgress", requiresSerialForSecond: true);
        db.StepSerialCaptures.Add(new StepSerialCapture
        {
            OrderLineRouteStepInstanceId = 6162,
            SalesOrderDetailId = 6061,
            SerialNo = "SN-1",
            Manufacturer = "MFG",
            ConditionStatus = "Bad",
            ScrapReasonId = null,
            RecordedByEmpNo = "EMP001",
            RecordedUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CompleteStepAsync(606, 6061, 6162, new CompleteWorkCenterStepDto("EMP002", null)));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("scrap reason", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenPackingSlipRequiredNotGenerated_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenPackingSlipRequiredNotGenerated_ThrowsConflict));
        SeedRouteWithTwoSteps(db, orderId: 607, lineId: 6071, routeId: 6170, firstStepState: "Completed", secondStepState: "InProgress", requiresPackingSlipForSecond: true);
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CompleteStepAsync(607, 6071, 6172, new CompleteWorkCenterStepDto("EMP002", null)));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("packing slip", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenBolRequiredNotGenerated_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenBolRequiredNotGenerated_ThrowsConflict));
        SeedRouteWithTwoSteps(db, orderId: 608, lineId: 6081, routeId: 6180, firstStepState: "Completed", secondStepState: "InProgress", requiresBolForSecond: true);
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CompleteStepAsync(608, 6081, 6182, new CompleteWorkCenterStepDto("EMP002", null)));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("bill of lading", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenSerialLoadVerificationRequiredWithoutFlag_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenSerialLoadVerificationRequiredWithoutFlag_ThrowsConflict));
        SeedRouteWithTwoSteps(
            db,
            orderId: 609,
            lineId: 6091,
            routeId: 6190,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            requiresSerialLoadVerificationForSecond: true,
            withLineSerials: new[] { "SER-1", "SER-2" });
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CompleteStepAsync(609, 6091, 6192, new CompleteWorkCenterStepDto("EMP002", null)));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("serial load verification", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenSerialLoadVerificationMismatchedSerials_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenSerialLoadVerificationMismatchedSerials_ThrowsConflict));
        SeedRouteWithTwoSteps(
            db,
            orderId: 610,
            lineId: 6101,
            routeId: 6200,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            requiresSerialLoadVerificationForSecond: true,
            withLineSerials: new[] { "SER-1", "SER-2" });
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CompleteStepAsync(
                610,
                6101,
                6202,
                new CompleteWorkCenterStepDto(
                    "EMP002",
                    null,
                    SerialLoadVerified: true,
                    VerifiedSerialNos: ["SER-1"])));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("must match expected", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task VerifySerialLoadAsync_WhenExpectedSerialsMatch_AllowsCompletionWithoutInlinePayload()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(VerifySerialLoadAsync_WhenExpectedSerialsMatch_AllowsCompletionWithoutInlinePayload));
        SeedRouteWithTwoSteps(
            db,
            orderId: 6101,
            lineId: 61011,
            routeId: 62010,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            requiresSerialLoadVerificationForSecond: true,
            withLineSerials: new[] { "SER-1", "SER-2" });
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.VerifySerialLoadAsync(
            6101,
            61011,
            62012,
            new VerifySerialLoadDto("EMP-LOAD", ["SER-1", "SER-2"], "Loaded trailer check"));

        await service.CompleteStepAsync(6101, 61011, 62012, new CompleteWorkCenterStepDto("EMP002", null));
        var step = await db.OrderLineRouteStepInstances.FirstAsync(s => s.Id == 62012);
        Assert.Equal("Completed", step.State);
    }

    [Fact]
    public async Task GeneratePackingSlipAsync_WhenRequired_GeneratesAndAllowsCompletion()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GeneratePackingSlipAsync_WhenRequired_GeneratesAndAllowsCompletion));
        SeedRouteWithTwoSteps(
            db,
            orderId: 6102,
            lineId: 61021,
            routeId: 62020,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            requiresPackingSlipForSecond: true);
        await db.SaveChangesAsync();

        var storage = new InMemoryAttachmentStorage();
        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService(), attachmentStorage: storage);
        await service.GeneratePackingSlipAsync(
            6102,
            61021,
            62022,
            new GenerateStepDocumentDto("EMP-DOC", false, "Generate packing slip"));
        await service.CompleteStepAsync(6102, 61021, 62022, new CompleteWorkCenterStepDto("EMP002", null));

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 6102);
        Assert.Equal("PS-SO-6102", order.PackingSlipNo);
        var attachment = await db.OrderAttachments.FirstAsync(a => a.OrderId == 6102 && a.Category == "PackingSlip");
        Assert.EndsWith(".txt", attachment.FileName, StringComparison.OrdinalIgnoreCase);
        var stored = await storage.OpenReadAsync(attachment.BlobPath);
        Assert.NotNull(stored);
    }

    [Fact]
    public async Task GenerateBolAsync_WhenRequired_GeneratesAndAllowsCompletion()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GenerateBolAsync_WhenRequired_GeneratesAndAllowsCompletion));
        SeedRouteWithTwoSteps(
            db,
            orderId: 6103,
            lineId: 61031,
            routeId: 62030,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            requiresBolForSecond: true);
        await db.SaveChangesAsync();

        var storage = new InMemoryAttachmentStorage();
        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService(), attachmentStorage: storage);
        await service.GenerateBolAsync(
            6103,
            61031,
            62032,
            new GenerateStepDocumentDto("EMP-DOC", false, "Generate BOL"));
        await service.CompleteStepAsync(6103, 61031, 62032, new CompleteWorkCenterStepDto("EMP002", null));

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 6103);
        Assert.Equal("BOL-SO-6103", order.BolNo);
        var attachment = await db.OrderAttachments.FirstAsync(a => a.OrderId == 6103 && a.Category == "BillOfLading");
        Assert.EndsWith(".txt", attachment.FileName, StringComparison.OrdinalIgnoreCase);
        var stored = await storage.OpenReadAsync(attachment.BlobPath);
        Assert.NotNull(stored);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenPaperOnlyBypassesElectronicRequirements_CompletesStep()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenPaperOnlyBypassesElectronicRequirements_CompletesStep));
        SeedRouteWithTwoSteps(
            db,
            orderId: 611,
            lineId: 6111,
            routeId: 6210,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            requiresUsageForSecond: true,
            requiresChecklistForSecond: true,
            dataCaptureModeForSecond: "PaperOnly");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.CompleteStepAsync(611, 6111, 6212, new CompleteWorkCenterStepDto("EMP002", null));

        var step = await db.OrderLineRouteStepInstances.FirstAsync(s => s.Id == 6212);
        Assert.Equal("Completed", step.State);
    }

    [Fact]
    public async Task CloseReworkAsync_ClearsOrderReworkOverlay()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CloseReworkAsync_ClearsOrderReworkOverlay));
        SeedRouteWithTwoSteps(db, orderId: 700, lineId: 7001, routeId: 7100, firstStepState: "Completed", secondStepState: "Blocked");
        await db.SaveChangesAsync();
        var order = await db.SalesOrders.FirstAsync(o => o.Id == 700);
        order.HoldOverlay = OrderStatusCatalog.ReworkOpen;
        order.HasOpenRework = true;
        order.ReworkBlockingInvoice = true;
        order.ReworkState = "VerificationPending";
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.CloseReworkAsync(700, 7001, 7102, new ReworkStateChangeDto("EMP003", "Closed verification"));

        var updated = await db.SalesOrders.FirstAsync(o => o.Id == 700);
        Assert.Null(updated.HoldOverlay);
        Assert.False(updated.HasOpenRework);
    }

    [Fact]
    public async Task ReworkAsync_RejectsInvalidLifecycleJump()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ReworkAsync_RejectsInvalidLifecycleJump));
        SeedRouteWithTwoSteps(db, orderId: 710, lineId: 7101, routeId: 7200, firstStepState: "Completed", secondStepState: "InProgress");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.StartReworkAsync(710, 7101, 7202, new ReworkStateChangeDto("EMP004", "skip approval")));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task ScanInAsync_UsesWorkflowServiceToWriteLifecycleAuditEvent()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ScanInAsync_UsesWorkflowServiceToWriteLifecycleAuditEvent));
        SeedRouteWithTwoSteps(db, orderId: 720, lineId: 7201, routeId: 7300, firstStepState: "Completed", secondStepState: "Pending");
        await db.SaveChangesAsync();
        var order = await db.SalesOrders.FirstAsync(o => o.Id == 720);
        order.OrderLifecycleStatus = OrderStatusCatalog.ReadyForProduction;
        order.OrderStatus = OrderStatusCatalog.Received;
        await db.SaveChangesAsync();

        var queryService = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(
                TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.Received)),
        };
        var workflowService = new OrderWorkflowService(db, queryService, new FakeOrderPolicyService());
        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService(), workflowService);

        await service.ScanInAsync(720, 7201, 7302, new OperatorScanInDto("EMP720", null));

        var refreshedOrder = await db.SalesOrders.FirstAsync(o => o.Id == 720);
        Assert.Equal(OrderStatusCatalog.InProduction, refreshedOrder.OrderLifecycleStatus);
        var lifecycleEvent = await db.OrderLifecycleEvents
            .OrderByDescending(e => e.Id)
            .FirstAsync(e => e.OrderId == 720 && e.ToLifecycleStatus == OrderStatusCatalog.InProduction);
        Assert.Equal("EMP720", lifecycleEvent.ActorEmpNo);
        Assert.Equal("ProductionStarted", lifecycleEvent.ReasonCode);
    }

    [Fact]
    public async Task CorrectDurationAsync_WhenManualMode_PersistsManualEntryFields()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CorrectDurationAsync_WhenManualMode_PersistsManualEntryFields));
        SeedRouteWithTwoSteps(
            db,
            orderId: 800,
            lineId: 8001,
            routeId: 8100,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            secondStepTimeCaptureMode: "Manual");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.CorrectDurationAsync(
            800,
            8001,
            8102,
            new CorrectStepDurationDto(12.5m, null, "Production", "EMP800", "manual entry", "UI"));

        var step = await db.OrderLineRouteStepInstances.FirstAsync(s => s.Id == 8102);
        Assert.Equal(12.5m, step.DurationMinutes);
        Assert.Equal(12.5m, step.ManualDurationMinutes);
        Assert.Null(step.ManualDurationReason);
        Assert.Equal("ManualEntry", step.TimeCaptureSource);
    }

    [Fact]
    public async Task CorrectDurationAsync_WhenManualMinutesInvalid_ThrowsBadRequest()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CorrectDurationAsync_WhenManualMinutesInvalid_ThrowsBadRequest));
        SeedRouteWithTwoSteps(
            db,
            orderId: 801,
            lineId: 8011,
            routeId: 8110,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            secondStepTimeCaptureMode: "Manual");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CorrectDurationAsync(801, 8011, 8112, new CorrectStepDurationDto(0m, null, "Production", "EMP801")));
        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task CorrectDurationAsync_WhenHybridMissingReason_ThrowsBadRequest()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CorrectDurationAsync_WhenHybridMissingReason_ThrowsBadRequest));
        SeedRouteWithTwoSteps(
            db,
            orderId: 802,
            lineId: 8021,
            routeId: 8120,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            secondStepTimeCaptureMode: "Hybrid");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CorrectDurationAsync(802, 8021, 8122, new CorrectStepDurationDto(9m, null, "Supervisor", "EMP802")));
        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task CorrectDurationAsync_WhenHybridByNonPrivilegedRole_ThrowsForbidden()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CorrectDurationAsync_WhenHybridByNonPrivilegedRole_ThrowsForbidden));
        SeedRouteWithTwoSteps(
            db,
            orderId: 803,
            lineId: 8031,
            routeId: 8130,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            secondStepTimeCaptureMode: "Hybrid");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CorrectDurationAsync(803, 8031, 8132, new CorrectStepDurationDto(9m, "reason", "Production", "EMP803")));
        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public async Task CorrectDurationAsync_WhenHybridBySupervisor_WritesActivityAndReturnsRouteFields()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CorrectDurationAsync_WhenHybridBySupervisor_WritesActivityAndReturnsRouteFields));
        SeedRouteWithTwoSteps(
            db,
            orderId: 804,
            lineId: 8041,
            routeId: 8140,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            secondStepTimeCaptureMode: "Hybrid");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var response = await service.CorrectDurationAsync(
            804,
            8041,
            8142,
            new CorrectStepDurationDto(17m, "Quality adjustment", "Supervisor", "SUP804"));

        var step = response.Routes.Single().Steps.Single(s => s.StepInstanceId == 8142);
        Assert.Equal(17m, step.DurationMinutes);
        Assert.Equal(17m, step.ManualDurationMinutes);
        Assert.Equal("Quality adjustment", step.ManualDurationReason);
        Assert.Equal("ManualOverride", step.TimeCaptureSource);
        Assert.Equal("Hybrid", step.TimeCaptureMode);

        var audit = await db.OperatorActivityLogs
            .OrderByDescending(a => a.Id)
            .FirstAsync(a => a.OrderLineRouteStepInstanceId == 8142);
        Assert.Equal("DurationCorrected", audit.ActionType);
        Assert.Equal("SUP804", audit.OperatorEmpNo);
    }

    private static void SeedRouteWithTwoSteps(
        LpcAppsDbContext db,
        int orderId,
        int lineId,
        long routeId,
        string firstStepState,
        string secondStepState,
        bool requiresUsageForSecond = false,
        bool requiresChecklistForSecond = false,
        string checklistFailurePolicyForSecond = "BlockCompletion",
        bool requiresAttachmentForSecond = false,
        bool requiresTrailerForSecond = false,
        bool requiresSerialForSecond = false,
        bool requiresSerialLoadVerificationForSecond = false,
        bool requiresPackingSlipForSecond = false,
        bool requiresBolForSecond = false,
        string secondStepTimeCaptureMode = "Automated",
        string dataCaptureModeForSecond = "ElectronicRequired",
        IEnumerable<string>? withLineSerials = null)
    {
        db.Sites.Add(new Site { Id = 1, Name = "Main", SiteCode = "MAIN" });
        db.Customers.Add(new Customer { Id = 1, Name = "Customer A" });
        db.Items.Add(new Item { Id = 1, ItemNo = "ITEM-1", ItemType = "Tank", RequiresSerialNumbers = 0 });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = orderId,
            SalesOrderNo = $"SO-{orderId}",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.Received,
            OrderLifecycleStatus = OrderStatusCatalog.InProduction,
            CustomerId = 1,
            SiteId = 1,
        });
        if (requiresTrailerForSecond)
        {
            var order = db.SalesOrders.Local.First(o => o.Id == orderId);
            order.TrailerNo = null;
        }
        db.SalesOrderDetails.Add(new SalesOrderDetail
        {
            Id = lineId,
            SalesOrderId = orderId,
            LineNo = 1,
            ItemId = 1,
            QuantityAsOrdered = 1,
            QuantityAsReceived = 1,
            SiteId = 1,
        });
        if (withLineSerials is not null)
        {
            foreach (var serial in withLineSerials)
            {
                db.SalesOrderDetailSns.Add(new SalesOrderDetailSn
                {
                    SalesOrderDetailId = lineId,
                    SerialNumber = serial,
                    Scrapped = false,
                    Status = "GOOD",
                });
            }
        }
        db.WorkCenters.Add(new WorkCenter
        {
            Id = 10,
            WorkCenterCode = "WC-10",
            WorkCenterName = "Prep",
            SiteId = 1,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.RouteTemplates.Add(new RouteTemplate
        {
            Id = 20,
            RouteTemplateCode = "RT-20",
            RouteTemplateName = "Route 20",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.OrderLineRouteInstances.Add(new OrderLineRouteInstance
        {
            Id = routeId,
            SalesOrderId = orderId,
            SalesOrderDetailId = lineId,
            RouteTemplateId = 20,
            State = "Active",
            StartedUtc = DateTime.UtcNow,
        });
        db.OrderLineRouteStepInstances.AddRange(
            new OrderLineRouteStepInstance
            {
                Id = routeId + 1,
                OrderLineRouteInstanceId = routeId,
                SalesOrderDetailId = lineId,
                StepSequence = 1,
                StepCode = "STEP-1",
                StepName = "First",
                WorkCenterId = 10,
                State = firstStepState,
                IsRequired = true,
            },
            new OrderLineRouteStepInstance
            {
                Id = routeId + 2,
                OrderLineRouteInstanceId = routeId,
                SalesOrderDetailId = lineId,
                StepSequence = 2,
                StepCode = "STEP-2",
                StepName = "Second",
                WorkCenterId = 10,
                State = secondStepState,
                IsRequired = true,
                RequiresUsageEntry = requiresUsageForSecond,
                RequiresChecklistCompletion = requiresChecklistForSecond,
                ChecklistFailurePolicy = checklistFailurePolicyForSecond,
                RequiresAttachment = requiresAttachmentForSecond,
                RequiresTrailerCapture = requiresTrailerForSecond,
                RequiresSerialCapture = requiresSerialForSecond,
                RequiresSerialLoadVerification = requiresSerialLoadVerificationForSecond,
                GeneratePackingSlipOnComplete = requiresPackingSlipForSecond,
                GenerateBolOnComplete = requiresBolForSecond,
                TimeCaptureMode = secondStepTimeCaptureMode,
                DataCaptureMode = dataCaptureModeForSecond,
            });
    }
}

internal sealed class InMemoryAttachmentStorage : IAttachmentStorage
{
    private readonly Dictionary<string, byte[]> _contentByPath = new(StringComparer.OrdinalIgnoreCase);

    public async Task UploadAsync(string blobPath, Stream content, string contentType, CancellationToken cancellationToken = default)
    {
        await using var memory = new MemoryStream();
        await content.CopyToAsync(memory, cancellationToken);
        _contentByPath[blobPath] = memory.ToArray();
    }

    public Task<Stream?> OpenReadAsync(string blobPath, CancellationToken cancellationToken = default)
    {
        if (_contentByPath.TryGetValue(blobPath, out var payload))
        {
            return Task.FromResult<Stream?>(new MemoryStream(payload, writable: false));
        }

        return Task.FromResult<Stream?>(null);
    }

    public Task DeleteIfExistsAsync(string blobPath, CancellationToken cancellationToken = default)
    {
        _contentByPath.Remove(blobPath);
        return Task.CompletedTask;
    }
}
