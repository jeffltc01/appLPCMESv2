using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController(
    LpcAppsDbContext db,
    IOrderQueryService orderQueryService,
    IOrderKpiService orderKpiService,
    IOrderWorkflowService orderWorkflowService,
    IReceivingService receivingService,
    IProductionService productionService,
    IOrderAttachmentService orderAttachmentService,
    IWorkCenterWorkflowService workCenterWorkflowService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<OrderDraftListDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] int? customerId = null,
        [FromQuery] DateOnly? dateFrom = null,
        [FromQuery] DateOnly? dateTo = null)
    {
        var result = await orderQueryService.GetOrdersAsync(page, pageSize, search, status, customerId, dateFrom, dateTo);
        return Ok(result);
    }

    [HttpGet("transport-board")]
    public async Task<ActionResult<PaginatedResponse<TransportBoardItemDto>>> GetTransportBoard(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] string? movementType = null,
        [FromQuery] string? status = null,
        [FromQuery] int? siteId = null,
        [FromQuery] string? carrier = null)
    {
        var result = await orderQueryService.GetTransportBoardAsync(
            page, pageSize, search, movementType, status, siteId, carrier);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDraftDetailDto>> Get(int id)
    {
        var detail = await orderQueryService.GetOrderDetailAsync(id);
        if (detail is null)
            return NotFound();

        return Ok(detail);
    }

    [HttpPost]
    public async Task<ActionResult<OrderDraftDetailDto>> Create(OrderDraftCreateDto dto)
    {
        var customer = await db.Customers.FindAsync(dto.CustomerId);
        if (customer is null)
            return BadRequest(new { message = "Invalid customerId." });

        var siteExists = await db.Sites.AnyAsync(s => s.Id == dto.SiteId);
        if (!siteExists)
            return BadRequest(new { message = "Invalid siteId." });

        Contact? defaultOrderContact = null;
        if (customer.DefaultOrderContactId.HasValue)
        {
            defaultOrderContact = await db.Contacts.FirstOrDefaultAsync(c =>
                c.Id == customer.DefaultOrderContactId.Value &&
                c.CustomerId == customer.Id);
        }

        var defaultContactName = FormatContactName(defaultOrderContact);
        var defaultOfficePhone = defaultOrderContact?.OfficePhone;
        var resolvedDefaultShipToId = customer.DefaultShipToId ?? customer.DefaultPickUpId;
        var resolvedDefaultPickUpId = customer.DefaultPickUpId ?? customer.DefaultShipToId;

        var order = new SalesOrder
        {
            SalesOrderNo = await GenerateOrderNumber(),
            CustomerId = dto.CustomerId,
            SiteId = dto.SiteId,
            OrderDate = dto.OrderDate ?? DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            OrderLifecycleStatus = OrderStatusCatalog.Draft,
            CustomerPoNo = dto.CustomerPoNo,
            Contact = string.IsNullOrWhiteSpace(dto.Contact) ? defaultContactName : dto.Contact,
            Phone = string.IsNullOrWhiteSpace(dto.Phone) ? defaultOfficePhone : dto.Phone,
            Comments = dto.Comments,
            Priority = dto.Priority,
            SalesPersonId = dto.SalesPersonId ?? customer.DefaultSalesEmployeeId,
            BillToAddressId = dto.BillToAddressId ?? customer.DefaultBillToId,
            PickUpAddressId = dto.PickUpAddressId ?? resolvedDefaultPickUpId,
            ShipToAddressId = dto.ShipToAddressId ?? resolvedDefaultShipToId,
            PickUpViaId = dto.PickUpViaId ?? customer.DefaultShipViaId,
            ShipToViaId = dto.ShipToViaId ?? customer.DefaultShipViaId,
            PaymentTermId = dto.PaymentTermId ?? customer.DefaultPaymentTermId,
            ReturnScrap = dto.ReturnScrap ?? customer.DefaultReturnScrap,
            ReturnBrass = dto.ReturnBrass ?? customer.DefaultReturnBrass,
            StatusUpdatedUtc = DateTime.UtcNow,
            StatusOwnerRole = "Office",
        };

        db.SalesOrders.Add(order);
        await db.SaveChangesAsync();

        var detail = await orderQueryService.GetOrderDetailAsync(order.Id);
        return CreatedAtAction(nameof(Get), new { id = order.Id }, detail);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<OrderDraftDetailDto>> Update(int id, OrderDraftUpdateDto dto)
    {
        var order = await db.SalesOrders.FindAsync(id);
        if (order is null)
            return NotFound();

        if (order.OrderStatus != OrderStatusCatalog.New)
            return Conflict(new { message = $"Only orders in status '{OrderStatusCatalog.New}' can be edited in this sprint." });

        var customerExists = await db.Customers.AnyAsync(c => c.Id == dto.CustomerId);
        if (!customerExists)
            return BadRequest(new { message = "Invalid customerId." });

        var siteExists = await db.Sites.AnyAsync(s => s.Id == dto.SiteId);
        if (!siteExists)
            return BadRequest(new { message = "Invalid siteId." });

        order.CustomerId = dto.CustomerId;
        order.SiteId = dto.SiteId;
        order.OrderDate = dto.OrderDate;
        order.CustomerPoNo = dto.CustomerPoNo;
        order.Contact = dto.Contact;
        order.Phone = dto.Phone;
        order.Comments = dto.Comments;
        order.Priority = dto.Priority;
        order.SalesPersonId = dto.SalesPersonId;
        order.BillToAddressId = dto.BillToAddressId;
        order.PickUpAddressId = dto.PickUpAddressId;
        order.ShipToAddressId = dto.ShipToAddressId;
        order.PickUpViaId = dto.PickUpViaId;
        order.ShipToViaId = dto.ShipToViaId;
        order.PaymentTermId = dto.PaymentTermId;
        order.ReturnScrap = dto.ReturnScrap;
        order.ReturnBrass = dto.ReturnBrass;
        order.OrderStatus = OrderStatusCatalog.New;

        await db.SaveChangesAsync();

        var detail = await orderQueryService.GetOrderDetailAsync(id);
        return Ok(detail);
    }

    [HttpPost("{id:int}/advance-status")]
    public async Task<ActionResult<OrderDraftDetailDto>> AdvanceStatus(int id, OrderAdvanceStatusDto dto)
    {
        try
        {
            var detail = await orderWorkflowService.AdvanceStatusAsync(
                id,
                dto.TargetStatus,
                dto.ActingRole,
                dto.ReasonCode,
                dto.Note,
                dto.ActingEmpNo);
            return Ok(detail);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{id:int}/promise-commitment")]
    public async Task<ActionResult<OrderDraftDetailDto>> UpsertPromiseCommitment(int id, UpsertPromiseCommitmentDto dto)
    {
        try
        {
            return Ok(await orderWorkflowService.UpsertPromiseCommitmentAsync(id, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{id:int}/promise-miss-classification")]
    public async Task<ActionResult<OrderDraftDetailDto>> ClassifyPromiseMiss(int id, ClassifyPromiseMissDto dto)
    {
        try
        {
            return Ok(await orderWorkflowService.ClassifyPromiseMissAsync(id, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{id:int}/promise-notification")]
    public async Task<ActionResult<OrderDraftDetailDto>> RecordPromiseNotification(int id, RecordPromiseNotificationDto dto)
    {
        try
        {
            return Ok(await orderWorkflowService.RecordPromiseNotificationAsync(id, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("{id:int}/promise-history")]
    public async Task<ActionResult<List<OrderPromiseChangeEventDto>>> GetPromiseHistory(int id)
    {
        try
        {
            return Ok(await orderWorkflowService.GetPromiseHistoryAsync(id));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("kpi-summary")]
    public async Task<ActionResult<OrderKpiSummaryDto>> GetKpiSummary(
        [FromQuery] DateTime? fromUtc = null,
        [FromQuery] DateTime? toUtc = null,
        [FromQuery] int? siteId = null,
        CancellationToken cancellationToken = default)
    {
        return Ok(await orderKpiService.GetSummaryAsync(fromUtc, toUtc, siteId, cancellationToken));
    }

    [HttpGet("kpi-diagnostics")]
    public async Task<ActionResult<OrderKpiDiagnosticsDto>> GetKpiDiagnostics(
        [FromQuery] DateTime? fromUtc = null,
        [FromQuery] DateTime? toUtc = null,
        [FromQuery] int? siteId = null,
        [FromQuery] string? issueType = null,
        CancellationToken cancellationToken = default)
    {
        return Ok(await orderKpiService.GetDiagnosticsAsync(fromUtc, toUtc, siteId, issueType, cancellationToken));
    }

    [HttpPost("{id:int}/hold/clear")]
    public async Task<ActionResult<OrderDraftDetailDto>> ClearHold(int id, ClearHoldDto dto)
    {
        try
        {
            var detail = await orderWorkflowService.ClearHoldAsync(id, dto);
            return Ok(detail);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{id:int}/hold/apply")]
    public async Task<ActionResult<OrderDraftDetailDto>> ApplyHold(int id, ApplyHoldDto dto)
    {
        try
        {
            var detail = await orderWorkflowService.ApplyHoldAsync(id, dto);
            return Ok(detail);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{id:int}/erp-reconcile/failure")]
    public async Task<ActionResult<OrderDraftDetailDto>> MarkErpReconcileFailure(int id, ErpReconcileFailureDto dto)
    {
        var order = await db.SalesOrders.FindAsync(id);
        if (order is null)
        {
            return NotFound();
        }

        order.ErpReconcileStatus = "Failed";
        order.ErpReconcileNote = dto.ErrorMessage.Trim();
        order.InvoiceStagingResult = "Failed";
        order.InvoiceStagingError = dto.ErrorMessage.Trim();
        order.HoldOverlay = OrderStatusCatalog.ExceptionErpReconcile;
        order.StatusReasonCode = "ErpInvoiceCreationFailed";
        order.StatusOwnerRole = "Accounting";
        order.StatusUpdatedUtc = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(dto.CorrelationId))
        {
            order.InvoiceSubmissionCorrelationId = dto.CorrelationId.Trim();
        }

        await db.SaveChangesAsync();
        var detail = await orderQueryService.GetOrderDetailAsync(id);
        return Ok(detail);
    }

    [HttpPost("{id:int}/invoice/submit")]
    public async Task<ActionResult<OrderDraftDetailDto>> SubmitInvoice(int id, SubmitInvoiceDto dto)
    {
        try
        {
            var detail = await orderWorkflowService.SubmitInvoiceAsync(id, dto);
            return Ok(detail);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("migrate-lifecycle-statuses")]
    public async Task<ActionResult<OrderLifecycleMigrationResultDto>> MigrateLifecycleStatuses(
        [FromQuery] bool dryRun = false,
        [FromQuery] string? migratedBy = null,
        [FromQuery] string? migrationBatchId = null,
        [FromQuery] int batchSize = 500)
    {
        var result = await orderWorkflowService.BackfillLifecycleStatusesAsync(
            dryRun,
            migratedBy,
            migrationBatchId,
            batchSize);
        return Ok(result);
    }

    [HttpPut("transport-board")]
    public async Task<ActionResult<List<TransportBoardItemDto>>> UpdateTransportBoard(
        [FromBody] List<TransportBoardUpdateDto>? updates)
    {
        if (updates is null || updates.Count == 0)
            return BadRequest(new { message = "No updates were provided." });

        var updateIds = updates.Select(u => u.Id).Distinct().ToList();
        var orders = await db.SalesOrders
            .Where(o => updateIds.Contains(o.Id))
            .ToListAsync();

        if (orders.Count != updateIds.Count)
            return BadRequest(new { message = "One or more orders were not found." });

        var orderById = orders.ToDictionary(o => o.Id);
        foreach (var dto in updates)
        {
            var order = orderById[dto.Id];
            if (!OrderStatusCatalog.TransportEditableStatuses.Contains(order.OrderStatus))
            {
                return Conflict(new
                {
                    message = $"Order {order.SalesOrderNo} cannot be edited in status '{order.OrderStatus}'."
                });
            }

            order.TrailerNo = TrimToNull(dto.TrailerNo);
            order.Carrier = TrimToNull(dto.Carrier);
            order.DispatchDate = dto.DispatchDate;
            order.PickupScheduledDate = dto.ScheduledDate;
            order.TransportationStatus = TrimToNull(dto.TransportationStatus);
            order.TransportationNotes = TrimToNull(dto.TransportationNotes);
        }

        await db.SaveChangesAsync();

        var refreshed = await orderQueryService.GetTransportBoardAsync(
            1, updateIds.Count, null, null, null, null, null);
        var response = refreshed.Items.Where(i => updateIds.Contains(i.Id)).ToList();
        return Ok(response);
    }

    [HttpGet("statuses")]
    public async Task<ActionResult<List<string>>> GetStatuses()
    {
        return Ok(await orderQueryService.GetStatusesAsync());
    }

    [HttpGet("receiving")]
    public async Task<ActionResult<List<ReceivingOrderListItemDto>>> GetReceivingQueue()
    {
        return Ok(await orderQueryService.GetReceivingQueueAsync());
    }

    [HttpGet("production")]
    public async Task<ActionResult<List<ProductionOrderListItemDto>>> GetProductionQueue()
    {
        return Ok(await orderQueryService.GetProductionQueueAsync());
    }

    [HttpGet("{id:int}/receiving")]
    public async Task<ActionResult<ReceivingOrderDetailDto>> GetReceivingDetail(int id)
    {
        var detail = await orderQueryService.GetReceivingDetailAsync(id);
        if (detail is null)
            return NotFound();

        if (detail.OrderStatus != OrderStatusCatalog.PickupScheduled)
            return Conflict(new { message = $"Only orders in status '{OrderStatusCatalog.PickupScheduled}' can be received." });

        return Ok(detail);
    }

    [HttpGet("{id:int}/production")]
    public async Task<ActionResult<ProductionOrderDetailDto>> GetProductionDetail(int id)
    {
        var detail = await orderQueryService.GetProductionDetailAsync(id);
        if (detail is null)
            return NotFound();

        if (detail.OrderStatus != OrderStatusCatalog.Received)
            return Conflict(new { message = $"Only orders in status '{OrderStatusCatalog.Received}' can be viewed in Production." });

        return Ok(detail);
    }

    [HttpGet("{id:int}/attachments")]
    public async Task<ActionResult<List<OrderAttachmentDto>>> GetAttachments(int id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await orderAttachmentService.GetAttachmentsAsync(id, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{id:int}/attachments")]
    public async Task<ActionResult<OrderAttachmentDto>> UploadAttachment(
        int id,
        [FromForm] IFormFile? file,
        [FromForm] string? category,
        [FromForm] string? actingRole,
        [FromForm] string? actingEmpNo,
        CancellationToken cancellationToken)
    {
        try
        {
            var attachment = await orderAttachmentService.UploadAttachmentAsync(
                id,
                file,
                category,
                actingRole,
                actingEmpNo,
                cancellationToken);
            return CreatedAtAction(
                nameof(DownloadAttachment),
                new { id, attachmentId = attachment.Id },
                attachment);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("{id:int}/attachments/{attachmentId:int}")]
    public async Task<IActionResult> DownloadAttachment(
        int id,
        int attachmentId,
        [FromQuery] string? actingRole,
        [FromQuery] string? actingEmpNo,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await orderAttachmentService.DownloadAttachmentAsync(
                id,
                attachmentId,
                actingRole,
                actingEmpNo,
                cancellationToken);
            return File(result.Stream, result.ContentType, result.FileName);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPatch("{id:int}/attachments/{attachmentId:int}")]
    public async Task<ActionResult<OrderAttachmentDto>> UpdateAttachmentCategory(
        int id,
        int attachmentId,
        UpdateOrderAttachmentCategoryDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await orderAttachmentService.UpdateAttachmentCategoryAsync(id, attachmentId, dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpDelete("{id:int}/attachments/{attachmentId:int}")]
    public async Task<IActionResult> DeleteAttachment(
        int id,
        int attachmentId,
        [FromBody] DeleteOrderAttachmentDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            await orderAttachmentService.DeleteAttachmentAsync(id, attachmentId, dto, cancellationToken);
            return NoContent();
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{id:int}/receiving/complete")]
    public async Task<ActionResult<ReceivingOrderDetailDto>> CompleteReceiving(int id, CompleteReceivingDto dto)
    {
        try
        {
            var detail = await receivingService.CompleteReceivingAsync(id, dto);
            return Ok(detail);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{id:int}/production/complete")]
    public async Task<ActionResult<ProductionOrderDetailDto>> CompleteProduction(int id, CompleteProductionDto dto)
    {
        try
        {
            var detail = await productionService.CompleteProductionAsync(id, dto);
            return Ok(detail);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/scan-in")]
    public async Task<ActionResult<OrderRouteExecutionDto>> ScanIn(int orderId, int lineId, long stepId, OperatorScanInDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.ScanInAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/scan-out")]
    public async Task<ActionResult<OrderRouteExecutionDto>> ScanOut(int orderId, int lineId, long stepId, OperatorScanOutDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.ScanOutAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/usage")]
    public async Task<ActionResult<OrderRouteExecutionDto>> AddUsage(int orderId, int lineId, long stepId, StepMaterialUsageCreateDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.AddUsageAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/scrap")]
    public async Task<ActionResult<OrderRouteExecutionDto>> AddScrap(int orderId, int lineId, long stepId, StepScrapEntryCreateDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.AddScrapAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/serials")]
    public async Task<ActionResult<OrderRouteExecutionDto>> AddSerial(int orderId, int lineId, long stepId, StepSerialCaptureCreateDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.AddSerialAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/checklist")]
    public async Task<ActionResult<OrderRouteExecutionDto>> AddChecklist(int orderId, int lineId, long stepId, StepChecklistResultCreateDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.AddChecklistAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/duration-correction")]
    public async Task<ActionResult<OrderRouteExecutionDto>> CorrectStepDuration(int orderId, int lineId, long stepId, CorrectStepDurationDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.CorrectDurationAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/loading/trailer")]
    public async Task<ActionResult<OrderRouteExecutionDto>> CaptureTrailer(int orderId, int lineId, long stepId, CaptureTrailerDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.CaptureTrailerAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/loading/verify-serials")]
    public async Task<ActionResult<OrderRouteExecutionDto>> VerifySerialLoad(int orderId, int lineId, long stepId, VerifySerialLoadDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.VerifySerialLoadAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/loading/generate-packing-slip")]
    public async Task<ActionResult<OrderRouteExecutionDto>> GeneratePackingSlip(int orderId, int lineId, long stepId, GenerateStepDocumentDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.GeneratePackingSlipAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/loading/generate-bol")]
    public async Task<ActionResult<OrderRouteExecutionDto>> GenerateBol(int orderId, int lineId, long stepId, GenerateStepDocumentDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.GenerateBolAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/complete")]
    public async Task<ActionResult<OrderRouteExecutionDto>> CompleteWorkCenterStep(int orderId, int lineId, long stepId, CompleteWorkCenterStepDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.CompleteStepAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("workcenter/{workCenterId:int}/queue")]
    public async Task<ActionResult<List<WorkCenterQueueItemDto>>> GetWorkCenterQueue(int workCenterId)
    {
        return Ok(await workCenterWorkflowService.GetQueueAsync(workCenterId));
    }

    [HttpGet("/api/workcenter/{workCenterId:int}/queue")]
    public async Task<ActionResult<List<WorkCenterQueueItemDto>>> GetWorkCenterQueueAlias(int workCenterId)
    {
        return Ok(await workCenterWorkflowService.GetQueueAsync(workCenterId));
    }

    [HttpGet("{orderId:int}/route-execution")]
    public async Task<ActionResult<OrderRouteExecutionDto>> GetOrderRouteExecution(int orderId)
    {
        try
        {
            return Ok(await workCenterWorkflowService.GetOrderRouteExecutionAsync(orderId));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("{orderId:int}/workcenter/activity-log")]
    public async Task<ActionResult<List<OperatorActivityLogDto>>> GetOrderWorkCenterActivityLog(int orderId)
    {
        try
        {
            return Ok(await workCenterWorkflowService.GetOrderActivityLogAsync(orderId));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("{orderId:int}/lines/{lineId:int}/route-execution")]
    public async Task<ActionResult<OrderRouteExecutionDto>> GetLineRouteExecution(int orderId, int lineId)
    {
        try
        {
            return Ok(await workCenterWorkflowService.GetOrderRouteExecutionAsync(orderId, lineId));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("pending-supervisor-review")]
    public async Task<ActionResult<List<ProductionOrderListItemDto>>> GetPendingSupervisorReview()
    {
        var rows = await orderQueryService.GetProductionQueueAsync();
        return Ok(rows);
    }

    [HttpPost("{orderId:int}/supervisor/approve")]
    public async Task<ActionResult<OrderRouteExecutionDto>> SupervisorApprove(int orderId, SupervisorDecisionDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.ApproveOrderAsync(orderId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/supervisor/reject")]
    public async Task<ActionResult<OrderRouteExecutionDto>> SupervisorReject(int orderId, SupervisorDecisionDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.RejectOrderAsync(orderId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("pending-route-review")]
    public async Task<ActionResult<List<ProductionOrderListItemDto>>> GetPendingRouteReview()
    {
        var rows = await orderQueryService.GetProductionQueueAsync();
        return Ok(rows);
    }

    [HttpPost("{orderId:int}/route/validate")]
    public async Task<ActionResult<OrderRouteExecutionDto>> ValidateRoute(int orderId, SupervisorRouteReviewDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.ValidateRouteAsync(orderId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/route/adjust")]
    public async Task<ActionResult<OrderRouteExecutionDto>> AdjustRoute(int orderId, SupervisorRouteReviewDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.AdjustRouteAsync(orderId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/route/reopen")]
    public async Task<ActionResult<OrderRouteExecutionDto>> ReopenRoute(int orderId, SupervisorRouteReviewDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.ReopenRouteAsync(orderId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/rework/request")]
    public async Task<ActionResult<OrderRouteExecutionDto>> RequestRework(int orderId, int lineId, long stepId, ReworkRequestDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.RequestReworkAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/rework/approve")]
    public async Task<ActionResult<OrderRouteExecutionDto>> ApproveRework(int orderId, int lineId, long stepId, ReworkStateChangeDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.ApproveReworkAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/rework/start")]
    public async Task<ActionResult<OrderRouteExecutionDto>> StartRework(int orderId, int lineId, long stepId, ReworkStateChangeDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.StartReworkAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/rework/submit-verification")]
    public async Task<ActionResult<OrderRouteExecutionDto>> SubmitReworkVerification(int orderId, int lineId, long stepId, ReworkStateChangeDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.SubmitReworkVerificationAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/rework/close")]
    public async Task<ActionResult<OrderRouteExecutionDto>> CloseRework(int orderId, int lineId, long stepId, ReworkStateChangeDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.CloseReworkAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/rework/cancel")]
    public async Task<ActionResult<OrderRouteExecutionDto>> CancelRework(int orderId, int lineId, long stepId, ReworkStateChangeDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.CancelReworkAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{orderId:int}/lines/{lineId:int}/workcenter/{stepId:long}/rework/scrap")]
    public async Task<ActionResult<OrderRouteExecutionDto>> ScrapRework(int orderId, int lineId, long stepId, ReworkStateChangeDto dto)
    {
        try
        {
            return Ok(await workCenterWorkflowService.ScrapReworkAsync(orderId, lineId, stepId, dto));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    private async Task<string> GenerateOrderNumber()
    {
        for (var i = 0; i < 10; i++)
        {
            var candidate = $"NEW-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";
            var exists = await db.SalesOrders.AnyAsync(o => o.SalesOrderNo == candidate);
            if (!exists)
                return candidate;
        }

        throw new InvalidOperationException("Unable to generate a unique order number.");
    }

    private static string? TrimToNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return value.Trim();
    }

    private static string? FormatContactName(Contact? contact)
    {
        if (contact is null) return null;
        var fullName = $"{contact.FirstName} {contact.LastName}".Trim();
        return string.IsNullOrWhiteSpace(fullName) ? null : fullName;
    }
}

