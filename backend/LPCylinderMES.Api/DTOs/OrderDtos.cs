namespace LPCylinderMES.Api.DTOs;

public record OrderDraftListDto(
    int Id,
    string SalesOrderNo,
    DateOnly OrderDate,
    string OrderStatus,
    int CustomerId,
    string CustomerName,
    int SiteId,
    string SiteName,
    string? CustomerPoNo,
    string? Contact,
    int LineCount,
    decimal TotalOrderedQuantity);

public record OrderDraftDetailDto(
    int Id,
    string SalesOrderNo,
    DateOnly OrderDate,
    string OrderStatus,
    DateOnly OrderCreatedDate,
    DateTime? ReadyForPickupDate,
    DateTime? PickupScheduledDate,
    DateTime? ReceivedDate,
    DateTime? ReadyToShipDate,
    DateTime? ReadyToInvoiceDate,
    int CustomerId,
    string CustomerName,
    int SiteId,
    string SiteName,
    string? CustomerPoNo,
    string? Contact,
    string? Phone,
    string? Comments,
    int? Priority,
    int? SalesPersonId,
    string? SalesPersonName,
    int? BillToAddressId,
    int? PickUpAddressId,
    int? ShipToAddressId,
    int? PickUpViaId,
    int? ShipToViaId,
    int? PaymentTermId,
    int? ReturnScrap,
    int? ReturnBrass,
    List<OrderLineDto> Lines);

public record OrderDraftCreateDto(
    int CustomerId,
    int SiteId,
    DateOnly? OrderDate,
    string? CustomerPoNo,
    string? Contact,
    string? Phone,
    string? Comments,
    int? Priority,
    int? SalesPersonId,
    int? BillToAddressId,
    int? PickUpAddressId,
    int? ShipToAddressId,
    int? PickUpViaId,
    int? ShipToViaId,
    int? PaymentTermId,
    int? ReturnScrap,
    int? ReturnBrass);

public record OrderDraftUpdateDto(
    int CustomerId,
    int SiteId,
    DateOnly OrderDate,
    string? CustomerPoNo,
    string? Contact,
    string? Phone,
    string? Comments,
    int? Priority,
    int? SalesPersonId,
    int? BillToAddressId,
    int? PickUpAddressId,
    int? ShipToAddressId,
    int? PickUpViaId,
    int? ShipToViaId,
    int? PaymentTermId,
    int? ReturnScrap,
    int? ReturnBrass);

public record OrderAdvanceStatusDto(string TargetStatus);

public record SubmitInvoiceDto(
    bool FinalReviewConfirmed,
    bool SendAttachmentEmail,
    List<int>? SelectedAttachmentIds,
    string? AttachmentRecipientSummary,
    string? AttachmentSkipReason,
    string? CorrelationId,
    string? SubmittedByEmpNo);

public record TransportBoardItemDto(
    int Id,
    string SalesOrderNo,
    string OrderStatus,
    string MovementType,
    DateOnly OrderDate,
    int CustomerId,
    string CustomerName,
    int SiteId,
    string SiteName,
    string? PickUpAddress,
    string? ShipToAddress,
    string? PickUpAddressStreet,
    string? ShipToAddressStreet,
    int LineCount,
    decimal TotalOrderedQuantity,
    string LineSummary,
    string? Contact,
    string? Phone,
    string? OrderComments,
    string? TrailerNo,
    string? Carrier,
    DateTime? DispatchDate,
    DateTime? ScheduledDate,
    string? TransportationStatus,
    string? TransportationNotes);

public record TransportBoardUpdateDto(
    int Id,
    string? TrailerNo,
    string? Carrier,
    DateTime? DispatchDate,
    DateTime? ScheduledDate,
    string? TransportationStatus,
    string? TransportationNotes);

public record ReceivingOrderListItemDto(
    int Id,
    string SalesOrderNo,
    string? IpadOrderNo,
    string CustomerName,
    string SiteName,
    string ReceivingMode,
    int? Priority,
    string? PickUpAddress,
    string? PickUpCity,
    string? PickUpState,
    string? PickUpPostalCode,
    string? PickUpCountry,
    string ItemsOrderedSummary,
    string? TrailerNo,
    DateTime? PickupScheduledDate,
    int LineCount,
    decimal TotalOrderedQuantity);

public record ProductionOrderListItemDto(
    int Id,
    string SalesOrderNo,
    string CustomerName,
    string SiteName,
    int? Priority,
    string ItemsOrderedSummary,
    DateTime? ReceivedDate,
    int LineCount,
    decimal TotalOrderedQuantity);

public record ReceivingOrderLineDto(
    int Id,
    decimal LineNo,
    int ItemId,
    string ItemNo,
    string ItemDescription,
    decimal QuantityAsOrdered,
    decimal QuantityAsReceived,
    bool IsReceived);

public record ReceivingOrderDetailDto(
    int Id,
    string SalesOrderNo,
    string OrderStatus,
    string CustomerName,
    string? PickUpAddress,
    string? TrailerNo,
    string? OrderComments,
    DateTime? ReceivedDate,
    List<ReceivingOrderLineDto> Lines);

public record ProductionOrderDetailDto(
    int Id,
    string SalesOrderNo,
    string OrderStatus,
    string CustomerName,
    string? PickUpAddress,
    string? TrailerNo,
    string? OrderComments,
    DateTime? ReceivedDate,
    List<ProductionOrderLineDto> Lines);

public record ProductionSerialNumberDto(
    int Id,
    string SerialNo,
    string? Manufacturer,
    string? ManufacturingDate,
    string? TestDate,
    int? ScrapReasonId,
    string TestStatus,
    string? LidColor,
    string? LidSize);

public record ProductionOrderLineDto(
    int Id,
    decimal LineNo,
    int ItemId,
    string ItemNo,
    string ItemDescription,
    decimal QuantityAsOrdered,
    decimal QuantityAsReceived,
    decimal QuantityAsShipped,
    decimal QuantityAsScrapped,
    bool RequiresSerialNumbers,
    List<ProductionSerialNumberDto> SerialNumbers);

public record ProductionLineUpdateDto(
    int LineId,
    decimal QuantityAsShipped,
    decimal QuantityAsScrapped,
    List<ProductionSerialNumberUpsertDto>? SerialNumbers);

public record ProductionSerialNumberUpsertDto(
    int? Id,
    string SerialNo,
    string? Manufacturer,
    string? ManufacturingDate,
    string? TestDate,
    int? ScrapReasonId,
    string? LidColor,
    string? LidSize);

public record CompleteProductionDto(
    List<ProductionLineUpdateDto> Lines);

public record ReceivingLineUpdateDto(
    int LineId,
    bool IsReceived,
    decimal QuantityAsReceived);

public record ReceivingAddLineDto(
    int ItemId,
    decimal QuantityAsReceived);

public record CompleteReceivingDto(
    DateTime ReceivedDate,
    List<ReceivingLineUpdateDto> Lines,
    List<ReceivingAddLineDto>? AddedLines);

public record OrderAttachmentDto(
    int Id,
    int OrderId,
    string FileName,
    string ContentType,
    long SizeBytes,
    DateTime CreatedAtUtc);

public record OperatorScanInDto(string EmpNo, string? DeviceId);

public record OperatorScanOutDto(string EmpNo, string? DeviceId);

public record CompleteWorkCenterStepDto(string EmpNo, string? Notes);

public record StepMaterialUsageCreateDto(int PartItemId, decimal QuantityUsed, string? Uom, string RecordedByEmpNo);

public record StepScrapEntryCreateDto(decimal QuantityScrapped, int ScrapReasonId, string? Notes, string RecordedByEmpNo);

public record StepSerialCaptureCreateDto(
    string SerialNo,
    string Manufacturer,
    DateOnly? ManufactureDate,
    DateOnly? TestDate,
    int? LidColorId,
    int? LidSizeId,
    string ConditionStatus,
    int? ScrapReasonId,
    string RecordedByEmpNo);

public record StepChecklistResultCreateDto(
    int ChecklistTemplateItemId,
    string ItemLabel,
    bool IsRequiredItem,
    string ResultStatus,
    string? ResultNotes,
    string CompletedByEmpNo);

public record SupervisorRouteReviewDto(bool IsAdjusted, string? Notes, string ReviewerEmpNo);

public record SupervisorDecisionDto(string EmpNo, string? Notes);

public record ReworkRequestDto(string RequestedByEmpNo, string ReasonCode, string? Notes);

public record ReworkStateChangeDto(string EmpNo, string? Notes);

public record WorkCenterQueueItemDto(
    long StepInstanceId,
    int OrderId,
    int LineId,
    string SalesOrderNo,
    string StepCode,
    string StepName,
    int StepSequence,
    string StepState,
    DateTime? ScanInUtc);

public record RouteStepExecutionDto(
    long StepInstanceId,
    int StepSequence,
    string StepCode,
    string StepName,
    string State,
    DateTime? ScanInUtc,
    DateTime? ScanOutUtc,
    DateTime? CompletedUtc);

public record LineRouteExecutionDto(
    long RouteInstanceId,
    int LineId,
    string State,
    List<RouteStepExecutionDto> Steps);

public record OrderRouteExecutionDto(
    int OrderId,
    string? LifecycleStatus,
    bool HasOpenRework,
    List<LineRouteExecutionDto> Routes);
