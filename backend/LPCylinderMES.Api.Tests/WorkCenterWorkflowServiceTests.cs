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
            service.ScanInAsync(500, 5001, 5102, new OperatorScanInDto("EMP001", null, 10, "Production")));

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
            service.CompleteStepAsync(600, 6001, 6102, new CompleteWorkCenterStepDto("EMP002", null, ActingRole: "Production")));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task RecordProgressAsync_WhenBatchMode_UpdatesLineQuantities()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(RecordProgressAsync_WhenBatchMode_UpdatesLineQuantities));
        SeedRouteWithTwoSteps(db, orderId: 6060, lineId: 60601, routeId: 61600, firstStepState: "Completed", secondStepState: "InProgress");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var response = await service.RecordProgressAsync(
            6060,
            60601,
            61602,
            new RecordStepProgressDto(1m, 0m, "EMP6060", "batch progress", "Production"));

        var route = Assert.Single(response.Routes);
        Assert.Equal(1m, route.QuantityCompleted);
        Assert.Equal(0m, route.QuantityScrapped);
    }

    [Fact]
    public async Task RecordProgressAsync_WhenSingleUnitModeAndQuantityNotOne_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(RecordProgressAsync_WhenSingleUnitModeAndQuantityNotOne_ThrowsConflict));
        SeedRouteWithTwoSteps(db, orderId: 6061, lineId: 60611, routeId: 61610, firstStepState: "Completed", secondStepState: "InProgress");
        await db.SaveChangesAsync();
        var step = await db.OrderLineRouteStepInstances.FirstAsync(s => s.Id == 61612);
        step.ProcessingMode = "SingleUnit";
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.RecordProgressAsync(
                6061,
                60611,
                61612,
                new RecordStepProgressDto(2m, null, "EMP6061", "invalid qty", "Production")));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task AddUsageAsync_PersistsLotBatch()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AddUsageAsync_PersistsLotBatch));
        SeedRouteWithTwoSteps(db, orderId: 6062, lineId: 60621, routeId: 61620, firstStepState: "Completed", secondStepState: "InProgress");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.AddUsageAsync(
            6062,
            60621,
            61622,
            new StepMaterialUsageCreateDto(1, 2.5m, "LOT-6062", "KG", "EMP6062", "Production"));

        var usage = await db.StepMaterialUsages.SingleAsync(u => u.OrderLineRouteStepInstanceId == 61622);
        Assert.Equal("LOT-6062", usage.LotBatch);
    }

    [Fact]
    public async Task AddUsageAsync_WhenSameMaterialLotAndUom_AccumulatesExistingQuantity()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AddUsageAsync_WhenSameMaterialLotAndUom_AccumulatesExistingQuantity));
        SeedRouteWithTwoSteps(db, orderId: 6064, lineId: 60641, routeId: 61640, firstStepState: "Completed", secondStepState: "InProgress");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.AddUsageAsync(
            6064,
            60641,
            61642,
            new StepMaterialUsageCreateDto(1, 2m, "LOT-6064", "KG", "EMP6064", "Production"));
        await service.AddUsageAsync(
            6064,
            60641,
            61642,
            new StepMaterialUsageCreateDto(1, 1.5m, "lot-6064", "kg", "EMP6065", "Production"));

        var usages = await db.StepMaterialUsages
            .Where(u => u.OrderLineRouteStepInstanceId == 61642)
            .ToListAsync();
        var usage = Assert.Single(usages);
        Assert.Equal(3.5m, usage.QuantityUsed);
        Assert.Equal("EMP6065", usage.RecordedByEmpNo);
    }

    [Fact]
    public async Task UpdateUsageAsync_WhenUsageExists_PersistsEditedValues()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(UpdateUsageAsync_WhenUsageExists_PersistsEditedValues));
        SeedRouteWithTwoSteps(db, orderId: 6065, lineId: 60651, routeId: 61650, firstStepState: "Completed", secondStepState: "InProgress");
        db.StepMaterialUsages.Add(new StepMaterialUsage
        {
            Id = 70001,
            OrderLineRouteStepInstanceId = 61652,
            SalesOrderDetailId = 60651,
            PartItemId = 1,
            LotBatch = "OLD-LOT",
            QuantityUsed = 1m,
            Uom = "KG",
            RecordedByEmpNo = "EMP-OLD",
            RecordedUtc = DateTime.UtcNow.AddMinutes(-5),
        });
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.UpdateUsageAsync(
            6065,
            60651,
            61652,
            70001,
            new StepMaterialUsageUpdateDto(1, 6m, "NEW-LOT", "KG", "EMP-NEW", "Production"));

        var usage = await db.StepMaterialUsages.SingleAsync(u => u.Id == 70001);
        Assert.Equal(6m, usage.QuantityUsed);
        Assert.Equal("NEW-LOT", usage.LotBatch);
        Assert.Equal("EMP-NEW", usage.RecordedByEmpNo);
    }

    [Fact]
    public async Task DeleteUsageAsync_WhenUsageExists_RemovesRowFromStepUsage()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(DeleteUsageAsync_WhenUsageExists_RemovesRowFromStepUsage));
        SeedRouteWithTwoSteps(db, orderId: 6066, lineId: 60661, routeId: 61660, firstStepState: "Completed", secondStepState: "InProgress");
        db.StepMaterialUsages.Add(new StepMaterialUsage
        {
            Id = 70002,
            OrderLineRouteStepInstanceId = 61662,
            SalesOrderDetailId = 60661,
            PartItemId = 1,
            LotBatch = "LOT-DEL",
            QuantityUsed = 2m,
            Uom = "KG",
            RecordedByEmpNo = "EMP-DEL",
            RecordedUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.DeleteUsageAsync(
            6066,
            60661,
            61662,
            70002,
            new DeleteStepMaterialUsageDto("EMP-DEL", "Production"));

        var rows = await service.GetStepUsageAsync(6066, 60661, 61662);
        Assert.Empty(rows);
    }

    [Fact]
    public async Task GetStepUsageAsync_ReturnsSavedUsageRowsForStep()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GetStepUsageAsync_ReturnsSavedUsageRowsForStep));
        SeedRouteWithTwoSteps(db, orderId: 6063, lineId: 60631, routeId: 61630, firstStepState: "Completed", secondStepState: "InProgress");
        db.StepMaterialUsages.Add(new StepMaterialUsage
        {
            OrderLineRouteStepInstanceId = 61632,
            SalesOrderDetailId = 60631,
            PartItemId = 1,
            LotBatch = "LOT-6063",
            QuantityUsed = 3m,
            Uom = "KG",
            RecordedByEmpNo = "EMP6063",
            RecordedUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var rows = await service.GetStepUsageAsync(6063, 60631, 61632);

        var usage = Assert.Single(rows);
        Assert.Equal(1, usage.PartItemId);
        Assert.Equal("ITEM-1", usage.PartItemNo);
        Assert.Equal("LOT-6063", usage.LotBatch);
        Assert.Equal(3m, usage.QuantityUsed);
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
            service.CompleteStepAsync(601, 6011, 6112, new CompleteWorkCenterStepDto("EMP002", null, ActingRole: "Production")));

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
            service.CompleteStepAsync(602, 6021, 6122, new CompleteWorkCenterStepDto("EMP002", null, ActingRole: "Production")));

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
                SupervisorOverrideReason: "Allowed with review",
                SupervisorOverrideActingRole: "Supervisor",
                ActingRole: "Production"));

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
            service.CompleteStepAsync(604, 6041, 6142, new CompleteWorkCenterStepDto("EMP002", null, ActingRole: "Production")));

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
            service.CompleteStepAsync(605, 6051, 6152, new CompleteWorkCenterStepDto("EMP002", null, ActingRole: "Production")));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("trailer", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CaptureTrailerAsync_WhenValid_PersistsTrailerAndAllowsCompletion()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CaptureTrailerAsync_WhenValid_PersistsTrailerAndAllowsCompletion));
        SeedRouteWithTwoSteps(db, orderId: 6052, lineId: 60521, routeId: 61520, firstStepState: "Completed", secondStepState: "InProgress", requiresTrailerForSecond: true);
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.CaptureTrailerAsync(
            6052,
            60521,
            61522,
                new CaptureTrailerDto("EMP-TRAILER", "TRL-100", "Loaded to outbound trailer", "Production"));
        await service.CompleteStepAsync(6052, 60521, 61522, new CompleteWorkCenterStepDto("EMP002", null, ActingRole: "Production"));

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 6052);
        Assert.Equal("TRL-100", order.TrailerNo);
        var activity = await db.OperatorActivityLogs
            .OrderByDescending(a => a.Id)
            .FirstAsync(a =>
                a.OrderLineRouteStepInstanceId == 61522 &&
                a.ActionType == "CaptureTrailer");
        Assert.Equal("CaptureTrailer", activity.ActionType);
    }

    [Fact]
    public async Task CaptureTrailerAsync_WhenTrailerMissing_ThrowsBadRequest()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CaptureTrailerAsync_WhenTrailerMissing_ThrowsBadRequest));
        SeedRouteWithTwoSteps(db, orderId: 6053, lineId: 60531, routeId: 61530, firstStepState: "Completed", secondStepState: "InProgress", requiresTrailerForSecond: true);
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CaptureTrailerAsync(
                6053,
                60531,
                61532,
                new CaptureTrailerDto("EMP-TRAILER", " ", "missing", "Production")));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
        Assert.Contains("TrailerNo", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
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
            service.CompleteStepAsync(606, 6061, 6162, new CompleteWorkCenterStepDto("EMP002", null, ActingRole: "Production")));

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
            service.CompleteStepAsync(607, 6071, 6172, new CompleteWorkCenterStepDto("EMP002", null, ActingRole: "Production")));

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
            service.CompleteStepAsync(608, 6081, 6182, new CompleteWorkCenterStepDto("EMP002", null, ActingRole: "Production")));

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
            service.CompleteStepAsync(609, 6091, 6192, new CompleteWorkCenterStepDto("EMP002", null, ActingRole: "Production")));

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
                    VerifiedSerialNos: ["SER-1"],
                    ActingRole: "Production")));

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
            new VerifySerialLoadDto("EMP-LOAD", ["SER-1", "SER-2"], "Loaded trailer check", "Production"));

        await service.CompleteStepAsync(6101, 61011, 62012, new CompleteWorkCenterStepDto("EMP002", null, ActingRole: "Production"));
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
            new GenerateStepDocumentDto("EMP-DOC", false, "Generate packing slip", "Production"));
        await service.CompleteStepAsync(6102, 61021, 62022, new CompleteWorkCenterStepDto("EMP002", null, ActingRole: "Production"));

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 6102);
        Assert.Equal("PS-SO-6102", order.PackingSlipNo);
        Assert.NotNull(order.PackingSlipGeneratedUtc);
        Assert.False(string.IsNullOrWhiteSpace(order.PackingSlipDocumentUri));
        var attachment = await db.OrderAttachments.FirstAsync(a => a.OrderId == 6102 && a.Category == "PackingSlip");
        Assert.EndsWith(".pdf", attachment.FileName, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("application/pdf", attachment.ContentType);
        var stored = await storage.OpenReadAsync(attachment.BlobPath);
        Assert.NotNull(stored);
        using var reader = new BinaryReader(stored!);
        var header = reader.ReadBytes(4);
        Assert.Equal("%PDF", System.Text.Encoding.ASCII.GetString(header));
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
            new GenerateStepDocumentDto("EMP-DOC", false, "Generate BOL", "Production"));
        await service.CompleteStepAsync(6103, 61031, 62032, new CompleteWorkCenterStepDto("EMP002", null, ActingRole: "Production"));

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 6103);
        Assert.Equal("BOL-SO-6103", order.BolNo);
        Assert.NotNull(order.BolGeneratedUtc);
        Assert.False(string.IsNullOrWhiteSpace(order.BolDocumentUri));
        var attachment = await db.OrderAttachments.FirstAsync(a => a.OrderId == 6103 && a.Category == "BillOfLading");
        Assert.EndsWith(".pdf", attachment.FileName, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("application/pdf", attachment.ContentType);
        var stored = await storage.OpenReadAsync(attachment.BlobPath);
        Assert.NotNull(stored);
        using var reader = new BinaryReader(stored!);
        var header = reader.ReadBytes(4);
        Assert.Equal("%PDF", System.Text.Encoding.ASCII.GetString(header));
    }

    [Fact]
    public async Task GeneratePackingSlipAsync_WhenRegenerated_AppendsRevisionSuffix()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GeneratePackingSlipAsync_WhenRegenerated_AppendsRevisionSuffix));
        SeedRouteWithTwoSteps(
            db,
            orderId: 6104,
            lineId: 61041,
            routeId: 62040,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            requiresPackingSlipForSecond: true);
        await db.SaveChangesAsync();

        var storage = new InMemoryAttachmentStorage();
        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService(), attachmentStorage: storage);
        await service.GeneratePackingSlipAsync(6104, 61041, 62042, new GenerateStepDocumentDto("EMP-DOC", false, "First print", "Production"));
        await service.GeneratePackingSlipAsync(6104, 61041, 62042, new GenerateStepDocumentDto("EMP-DOC", true, "Regenerate", "Production"));

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 6104);
        Assert.Equal("PS-SO-6104-R1", order.PackingSlipNo);
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
        await service.CompleteStepAsync(611, 6111, 6212, new CompleteWorkCenterStepDto("EMP002", null, ActingRole: "Production"));

        var step = await db.OrderLineRouteStepInstances.FirstAsync(s => s.Id == 6212);
        Assert.Equal("Completed", step.State);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenManualTimeModePendingWithElapsedMinutes_CompletesWithoutScanIn()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenManualTimeModePendingWithElapsedMinutes_CompletesWithoutScanIn));
        SeedRouteWithTwoSteps(
            db,
            orderId: 612,
            lineId: 6121,
            routeId: 6220,
            firstStepState: "Completed",
            secondStepState: "Pending",
            secondStepTimeCaptureMode: "Manual");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.CompleteStepAsync(
            612,
            6121,
            6222,
            new CompleteWorkCenterStepDto(
                "EMP612",
                "Manual completion",
                ManualDurationMinutes: 18m,
                ActingRole: "Production"));

        var step = await db.OrderLineRouteStepInstances.FirstAsync(s => s.Id == 6222);
        Assert.Equal("Completed", step.State);
        Assert.Equal(18m, step.ManualDurationMinutes);
        Assert.Equal(18m, step.DurationMinutes);
        Assert.Equal("ManualEntry", step.TimeCaptureSource);
        Assert.Null(step.ScanInUtc);
        Assert.Null(step.ScanOutUtc);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenManualTimeModePendingWithoutElapsedMinutes_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenManualTimeModePendingWithoutElapsedMinutes_ThrowsConflict));
        SeedRouteWithTwoSteps(
            db,
            orderId: 613,
            lineId: 6131,
            routeId: 6230,
            firstStepState: "Completed",
            secondStepState: "Pending",
            secondStepTimeCaptureMode: "Manual");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CompleteStepAsync(613, 6131, 6232, new CompleteWorkCenterStepDto("EMP613", null, ActingRole: "Production")));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("elapsed duration", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
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
        await service.CloseReworkAsync(700, 7001, 7102, new ReworkStateChangeDto("EMP003", "Closed verification", "Supervisor", "VerifiedAndClosed"));

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
            service.StartReworkAsync(710, 7101, 7202, new ReworkStateChangeDto("EMP004", "skip approval", "Production")));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task GetOrderRouteExecutionAndQueueAsync_ReturnsStepRequirementFlagsAndLineContext()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GetOrderRouteExecutionAndQueueAsync_ReturnsStepRequirementFlagsAndLineContext));
        SeedRouteWithTwoSteps(
            db,
            orderId: 900,
            lineId: 9001,
            routeId: 9100,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            requiresUsageForSecond: true,
            requiresScrapForSecond: true,
            requiresChecklistForSecond: true,
            requiresTrailerForSecond: true,
            requiresSerialForSecond: true,
            requiresSerialLoadVerificationForSecond: true,
            requiresPackingSlipForSecond: true,
            requiresBolForSecond: true,
            blockedReasonForSecond: "Awaiting checklist verification");
        await db.SaveChangesAsync();

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 900);
        order.Priority = 2;
        order.PromisedDateUtc = DateTime.UtcNow.Date.AddDays(5);
        order.Comments = "Order note";

        var line = await db.SalesOrderDetails.FirstAsync(l => l.Id == 9001);
        line.QuantityAsReceived = 6;
        line.QuantityAsShipped = 3;
        line.QuantityAsScrapped = 1;
        line.Notes = "Line note";
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var queue = await service.GetQueueAsync(10);
        var route = await service.GetOrderRouteExecutionAsync(900, 9001);

        var queueItem = Assert.Single(queue);
        Assert.Equal("Customer A", queueItem.CustomerName);
        Assert.Equal("ITEM-1", queueItem.ItemNo);
        Assert.Equal("Line note", queueItem.LineNotes);
        Assert.Equal("Order note", queueItem.OrderComments);
        Assert.Equal(2, queueItem.Priority);
        Assert.NotNull(queueItem.PromisedDateUtc);

        var routeLine = Assert.Single(route.Routes);
        Assert.Equal(1, routeLine.QuantityScrapped);
        Assert.Equal(3, routeLine.QuantityCompleted);
        Assert.Equal(6, routeLine.QuantityReceived);
        Assert.Equal(1, routeLine.QuantityOrdered);

        var step = routeLine.Steps.Single(s => s.StepSequence == 2);
        Assert.True(step.RequiresUsageEntry);
        Assert.True(step.RequiresScrapEntry);
        Assert.True(step.RequiresChecklistCompletion);
        Assert.True(step.RequiresTrailerCapture);
        Assert.True(step.RequiresSerialCapture);
        Assert.True(step.RequiresSerialLoadVerification);
        Assert.True(step.GeneratePackingSlipOnComplete);
        Assert.True(step.GenerateBolOnComplete);
        Assert.Equal("Awaiting checklist verification", step.BlockedReason);
        Assert.Equal("ElectronicRequired", step.DataCaptureMode);
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

        await service.ScanInAsync(720, 7201, 7302, new OperatorScanInDto("EMP720", null, 10, "Production"));

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

    [Fact]
    public async Task ScanInAsync_WhenRoleForbidden_ThrowsForbidden()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ScanInAsync_WhenRoleForbidden_ThrowsForbidden));
        SeedRouteWithTwoSteps(db, orderId: 820, lineId: 8201, routeId: 8300, firstStepState: "Completed", secondStepState: "Pending");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.ScanInAsync(820, 8201, 8302, new OperatorScanInDto("EMP820", null, 10, "Quality")));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public async Task ScanInAsync_WhenOperatorAtWrongWorkCenter_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ScanInAsync_WhenOperatorAtWrongWorkCenter_ThrowsConflict));
        SeedRouteWithTwoSteps(db, orderId: 920, lineId: 9201, routeId: 9300, firstStepState: "Completed", secondStepState: "Pending");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.ScanInAsync(920, 9201, 9302, new OperatorScanInDto("EMP920", null, 99, "Production")));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("Wrong work center", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ScanOutAsync_WhenOperatorAtWrongWorkCenter_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ScanOutAsync_WhenOperatorAtWrongWorkCenter_ThrowsConflict));
        SeedRouteWithTwoSteps(db, orderId: 921, lineId: 9211, routeId: 9310, firstStepState: "Completed", secondStepState: "InProgress");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.ScanOutAsync(921, 9211, 9312, new OperatorScanOutDto("EMP921", null, 99, "Production")));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("Wrong work center", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AdjustRouteAsync_WhenRoleForbidden_ThrowsForbidden()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdjustRouteAsync_WhenRoleForbidden_ThrowsForbidden));
        SeedRouteWithTwoSteps(db, orderId: 821, lineId: 8211, routeId: 8310, firstStepState: "Completed", secondStepState: "Pending");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.AdjustRouteAsync(821, new SupervisorRouteReviewDto(true, "Need reroute", "EMP821", "Production")));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public async Task AdjustRouteAsync_WhenExecutionStartedWithoutFormalReopen_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdjustRouteAsync_WhenExecutionStartedWithoutFormalReopen_ThrowsConflict));
        SeedRouteWithTwoSteps(db, orderId: 8230, lineId: 82301, routeId: 83300, firstStepState: "Completed", secondStepState: "Pending");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.AdjustRouteAsync(
                8230,
                new SupervisorRouteReviewDto(
                    true,
                    "Post-start correction without reopen",
                    "SUP8230",
                    "Supervisor",
                    [new RouteStepAdjustmentDto(83302, null, 1, null, null, null, null, null, "try resequence")])));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("formal reopen", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AdjustRouteAsync_WhenExecutionStartedAfterFormalReopen_AllowsAdjustment()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdjustRouteAsync_WhenExecutionStartedAfterFormalReopen_AllowsAdjustment));
        SeedRouteWithTwoSteps(db, orderId: 8231, lineId: 82311, routeId: 83310, firstStepState: "Completed", secondStepState: "Pending");
        db.WorkCenters.Add(new WorkCenter
        {
            Id = 11,
            WorkCenterCode = "WC-11",
            WorkCenterName = "Final",
            SiteId = 1,
            IsActive = true,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.ReopenRouteAsync(
            8231,
            new SupervisorRouteReviewDto(
                false,
                "Formal reopen approved for post-start correction",
                "SUP8231",
                "Supervisor"));

        await service.AdjustRouteAsync(
            8231,
            new SupervisorRouteReviewDto(
                true,
                "Apply post-start correction",
                "SUP8231",
                "Supervisor",
                [new RouteStepAdjustmentDto(83312, null, 2, 11, null, null, null, null, "move work center")]));

        var step = await db.OrderLineRouteStepInstances.FirstAsync(s => s.Id == 83312);
        var route = await db.OrderLineRouteInstances.FirstAsync(r => r.Id == 83310);
        Assert.Equal(11, step.WorkCenterId);
        Assert.Equal("SUP8231", step.StepAdjustedBy);
        Assert.Equal("Adjusted", route.RouteReviewState);
    }

    [Fact]
    public async Task AdjustRouteAsync_WhenStepSequenceAndWorkCenterChanged_PersistsStepAdjustments()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdjustRouteAsync_WhenStepSequenceAndWorkCenterChanged_PersistsStepAdjustments));
        SeedRouteWithTwoSteps(db, orderId: 824, lineId: 8241, routeId: 8340, firstStepState: "Pending", secondStepState: "Pending");
        db.WorkCenters.Add(new WorkCenter
        {
            Id = 11,
            WorkCenterCode = "WC-11",
            WorkCenterName = "Final",
            SiteId = 1,
            IsActive = true,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.AdjustRouteAsync(
            824,
            new SupervisorRouteReviewDto(
                true,
                "Route balancing",
                "SUP824",
                "Supervisor",
                [
                    new RouteStepAdjustmentDto(8341, null, 2, null, null, null, null, null, "Reorder first"),
                    new RouteStepAdjustmentDto(8342, null, 1, 11, null, null, null, null, "Move and reorder second"),
                ]));

        var firstStep = await db.OrderLineRouteStepInstances.FirstAsync(s => s.Id == 8341);
        var secondStep = await db.OrderLineRouteStepInstances.FirstAsync(s => s.Id == 8342);
        Assert.Equal(2, firstStep.StepSequence);
        Assert.Equal(1, secondStep.StepSequence);
        Assert.Equal(11, secondStep.WorkCenterId);
        Assert.Equal("SUP824", secondStep.StepAdjustedBy);
        Assert.NotNull(secondStep.StepAdjustedUtc);
        Assert.Equal("Move and reorder second", secondStep.StepAdjustmentReason);
    }

    [Fact]
    public async Task AdjustRouteAsync_WhenRemovingRequiredStep_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdjustRouteAsync_WhenRemovingRequiredStep_ThrowsConflict));
        SeedRouteWithTwoSteps(db, orderId: 825, lineId: 8251, routeId: 8350, firstStepState: "Pending", secondStepState: "Pending");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.AdjustRouteAsync(
                825,
                new SupervisorRouteReviewDto(
                    true,
                    "Try remove protected step",
                    "SUP825",
                    "Supervisor",
                    [new RouteStepAdjustmentDto(8351, null, null, null, null, null, null, true, "remove")]))
        );

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Contains("protected", ex.PublicMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AdjustRouteAsync_WhenAddingStep_PersistsNewStepAndMetadata()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdjustRouteAsync_WhenAddingStep_PersistsNewStepAndMetadata));
        SeedRouteWithTwoSteps(db, orderId: 826, lineId: 8261, routeId: 8360, firstStepState: "Pending", secondStepState: "Pending");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.AdjustRouteAsync(
            826,
            new SupervisorRouteReviewDto(
                true,
                "Add optional verification step",
                "SUP826",
                "Supervisor",
                [new RouteStepAdjustmentDto(null, 8261, 3, 10, "VERIFY", "Verification", false, false, "Added optional")]));

        var added = await db.OrderLineRouteStepInstances
            .OrderByDescending(s => s.Id)
            .FirstAsync(s => s.OrderLineRouteInstanceId == 8360 && s.StepCode == "VERIFY");
        Assert.Equal("Verification", added.StepName);
        Assert.Equal(3, added.StepSequence);
        Assert.Equal("Pending", added.State);
        Assert.False(added.IsRequired);
        Assert.Equal("SUP826", added.StepAdjustedBy);
        Assert.NotNull(added.StepAdjustedUtc);
        Assert.Equal("Added optional", added.StepAdjustmentReason);
    }

    [Fact]
    public async Task AdjustRouteAsync_WhenRemovingOptionalStep_MarksSkippedAndWritesAdjustmentMetadata()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdjustRouteAsync_WhenRemovingOptionalStep_MarksSkippedAndWritesAdjustmentMetadata));
        SeedRouteWithTwoSteps(db, orderId: 827, lineId: 8271, routeId: 8370, firstStepState: "Pending", secondStepState: "Pending");
        await db.SaveChangesAsync();
        var optionalStep = await db.OrderLineRouteStepInstances.FirstAsync(s => s.Id == 8372);
        optionalStep.IsRequired = false;
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.AdjustRouteAsync(
            827,
            new SupervisorRouteReviewDto(
                true,
                "Remove optional second step",
                "SUP827",
                "Supervisor",
                [new RouteStepAdjustmentDto(8372, null, null, null, null, null, null, true, "No longer needed")]));

        var removed = await db.OrderLineRouteStepInstances.FirstAsync(s => s.Id == 8372);
        Assert.Equal("Skipped", removed.State);
        Assert.Equal("RouteAdjustedRemoved", removed.BlockedReason);
        Assert.Equal("SUP827", removed.StepAdjustedBy);
        Assert.NotNull(removed.StepAdjustedUtc);
        Assert.Equal("No longer needed", removed.StepAdjustmentReason);
    }

    [Fact]
    public async Task ApproveOrderAsync_WhenRoleForbidden_ThrowsForbidden()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ApproveOrderAsync_WhenRoleForbidden_ThrowsForbidden));
        SeedRouteWithTwoSteps(db, orderId: 822, lineId: 8221, routeId: 8320, firstStepState: "Completed", secondStepState: "Pending");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.ApproveOrderAsync(822, new SupervisorDecisionDto("EMP822", "approve", "Production")));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenSupervisorGateRequired_SetsRoutePendingSupervisorReviewAndLifecyclePendingApproval()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenSupervisorGateRequired_SetsRoutePendingSupervisorReviewAndLifecyclePendingApproval));
        SeedRouteWithTwoSteps(
            db,
            orderId: 8240,
            lineId: 82401,
            routeId: 83400,
            firstStepState: "Completed",
            secondStepState: "InProgress",
            supervisorApprovalRequiredForRoute: true);
        await db.SaveChangesAsync();

        var queryService = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(
                TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.ReadyToShip)),
        };
        var workflowService = new OrderWorkflowService(db, queryService, new FakeOrderPolicyService());
        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService(), workflowService);

        await service.CompleteStepAsync(8240, 82401, 83402, new CompleteWorkCenterStepDto("EMP8240", "complete", ActingRole: "Production"));

        var route = await db.OrderLineRouteInstances.FirstAsync(r => r.Id == 83400);
        var order = await db.SalesOrders.FirstAsync(o => o.Id == 8240);
        Assert.Equal("PendingSupervisorReview", route.State);
        Assert.Null(route.CompletedUtc);
        Assert.Equal(OrderStatusCatalog.ProductionCompletePendingApproval, order.OrderLifecycleStatus);
        Assert.NotNull(order.PendingSupervisorReviewUtc);
    }

    [Fact]
    public async Task ApproveOrderAsync_WhenPendingSupervisorReviewRoutes_ApprovesRoutesAndAdvancesLifecycle()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ApproveOrderAsync_WhenPendingSupervisorReviewRoutes_ApprovesRoutesAndAdvancesLifecycle));
        SeedRouteWithTwoSteps(
            db,
            orderId: 8241,
            lineId: 82411,
            routeId: 83410,
            firstStepState: "Completed",
            secondStepState: "Completed",
            supervisorApprovalRequiredForRoute: true);
        await db.SaveChangesAsync();

        var route = await db.OrderLineRouteInstances.FirstAsync(r => r.Id == 83410);
        var order = await db.SalesOrders.FirstAsync(o => o.Id == 8241);
        route.State = "PendingSupervisorReview";
        order.OrderLifecycleStatus = OrderStatusCatalog.ProductionCompletePendingApproval;
        order.OrderStatus = OrderStatusCatalog.ReadyToShip;
        order.PendingSupervisorReviewUtc = DateTime.UtcNow.AddMinutes(-10);
        await db.SaveChangesAsync();

        var queryService = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(
                TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.ReadyToShip)),
        };
        var workflowService = new OrderWorkflowService(db, queryService, new FakeOrderPolicyService());
        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService(), workflowService);

        await service.ApproveOrderAsync(8241, new SupervisorDecisionDto("SUP8241", "approved", "Supervisor"));

        var refreshedRoute = await db.OrderLineRouteInstances.FirstAsync(r => r.Id == 83410);
        var refreshedOrder = await db.SalesOrders.FirstAsync(o => o.Id == 8241);
        Assert.Equal("Completed", refreshedRoute.State);
        Assert.Equal("SUP8241", refreshedRoute.SupervisorApprovedBy);
        Assert.NotNull(refreshedRoute.SupervisorApprovedUtc);
        Assert.Equal(OrderStatusCatalog.ProductionComplete, refreshedOrder.OrderLifecycleStatus);
        Assert.Equal("SUP8241", refreshedOrder.SupervisorReviewedBy);
        Assert.NotNull(refreshedOrder.SupervisorReviewedUtc);
    }

    [Fact]
    public async Task RejectOrderAsync_WhenPendingSupervisorReviewRoutes_ReopensRouteAndMovesLifecycleBackToInProduction()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(RejectOrderAsync_WhenPendingSupervisorReviewRoutes_ReopensRouteAndMovesLifecycleBackToInProduction));
        SeedRouteWithTwoSteps(
            db,
            orderId: 8242,
            lineId: 82421,
            routeId: 83420,
            firstStepState: "Completed",
            secondStepState: "Completed",
            supervisorApprovalRequiredForRoute: true);
        await db.SaveChangesAsync();

        var route = await db.OrderLineRouteInstances.FirstAsync(r => r.Id == 83420);
        var order = await db.SalesOrders.FirstAsync(o => o.Id == 8242);
        route.State = "PendingSupervisorReview";
        route.CompletedUtc = DateTime.UtcNow.AddMinutes(-5);
        order.OrderLifecycleStatus = OrderStatusCatalog.ProductionCompletePendingApproval;
        order.OrderStatus = OrderStatusCatalog.ReadyToShip;
        order.PendingSupervisorReviewUtc = DateTime.UtcNow.AddMinutes(-10);
        await db.SaveChangesAsync();

        var queryService = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(
                TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.Received)),
        };
        var workflowService = new OrderWorkflowService(db, queryService, new FakeOrderPolicyService());
        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService(), workflowService);

        await service.RejectOrderAsync(8242, new SupervisorDecisionDto("SUP8242", "rejected", "Supervisor"));

        var refreshedRoute = await db.OrderLineRouteInstances.FirstAsync(r => r.Id == 83420);
        var refreshedOrder = await db.SalesOrders.FirstAsync(o => o.Id == 8242);
        Assert.Equal("Active", refreshedRoute.State);
        Assert.Null(refreshedRoute.CompletedUtc);
        Assert.Null(refreshedRoute.SupervisorApprovedBy);
        Assert.Null(refreshedRoute.SupervisorApprovedUtc);
        Assert.Equal(OrderStatusCatalog.InProduction, refreshedOrder.OrderLifecycleStatus);
        Assert.Equal("SUP8242", refreshedOrder.SupervisorReviewedBy);
        Assert.NotNull(refreshedOrder.SupervisorReviewedUtc);
    }

    [Fact]
    public async Task ApproveReworkAsync_WhenElevatedReasonMissing_ThrowsBadRequest()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ApproveReworkAsync_WhenElevatedReasonMissing_ThrowsBadRequest));
        SeedRouteWithTwoSteps(db, orderId: 823, lineId: 8231, routeId: 8330, firstStepState: "Completed", secondStepState: "InProgress");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.RequestReworkAsync(823, 8231, 8332, new ReworkRequestDto("EMP823", "Defect", "request", "Production"));
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.ApproveReworkAsync(823, 8231, 8332, new ReworkStateChangeDto("SUP823", "approve", "Supervisor")));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    private static void SeedRouteWithTwoSteps(
        LpcAppsDbContext db,
        int orderId,
        int lineId,
        long routeId,
        string firstStepState,
        string secondStepState,
        bool requiresUsageForSecond = false,
        bool requiresScrapForSecond = false,
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
        string? blockedReasonForSecond = null,
        IEnumerable<string>? withLineSerials = null,
        bool supervisorApprovalRequiredForRoute = false)
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
            SupervisorApprovalRequired = supervisorApprovalRequiredForRoute,
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
                RequiresScrapEntry = requiresScrapForSecond,
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
                BlockedReason = blockedReasonForSecond,
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
