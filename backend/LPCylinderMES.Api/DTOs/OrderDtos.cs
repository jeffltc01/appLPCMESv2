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
    string CustomerName,
    string? PickUpAddress,
    string? TrailerNo,
    DateTime? PickupScheduledDate,
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
    DateTime? ReceivedDate,
    List<ReceivingOrderLineDto> Lines);

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
