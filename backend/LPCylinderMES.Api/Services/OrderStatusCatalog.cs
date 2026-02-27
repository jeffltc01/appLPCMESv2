namespace LPCylinderMES.Api.Services;

public static class OrderStatusCatalog
{
    // Legacy status keys retained for compatibility with existing UI and APIs.
    public const string New = "New";
    public const string ReadyForPickup = "Ready for Pickup";
    public const string PickupScheduled = "Pickup Scheduled";
    public const string Received = "Received";
    public const string ReadyToShip = "Ready to Ship";
    public const string ReadyToInvoice = "Ready to Invoice";

    // Order-to-cash lifecycle status keys from SPEC_ORDER_TO_CASH_STATUS_FLOW.
    public const string Draft = "Draft";
    public const string PendingOrderEntryValidation = "PendingOrderEntryValidation";
    public const string InboundLogisticsPlanned = "InboundLogisticsPlanned";
    public const string InboundInTransit = "InboundInTransit";
    public const string ReceivedPendingReconciliation = "ReceivedPendingReconciliation";
    public const string ReadyForProduction = "ReadyForProduction";
    public const string InProduction = "InProduction";
    public const string ProductionCompletePendingApproval = "ProductionCompletePendingApproval";
    public const string ProductionComplete = "ProductionComplete";
    public const string OutboundLogisticsPlanned = "OutboundLogisticsPlanned";
    public const string DispatchedOrPickupReleased = "DispatchedOrPickupReleased";
    public const string InvoiceReady = "InvoiceReady";
    public const string Invoiced = "Invoiced";

    // Hold/exception overlays from SPEC_ORDER_TO_CASH_STATUS_FLOW.
    public const string OnHoldCustomer = "OnHoldCustomer";
    public const string OnHoldQuality = "OnHoldQuality";
    public const string OnHoldLogistics = "OnHoldLogistics";
    public const string ExceptionQuantityMismatch = "ExceptionQuantityMismatch";
    public const string ExceptionDocumentation = "ExceptionDocumentation";
    public const string Cancelled = "Cancelled";
    public const string ReworkOpen = "ReworkOpen";

    public sealed record StatusMetadata(
        string Key,
        string DisplayLabel,
        string ActorHint);

    public static readonly StatusMetadata[] WorkflowStatusMetadata =
    {
        new(New, "Needs Order Info", "Office: gather missing order details."),
        new(ReadyForPickup, "Awaiting Pickup Scheduling", "Transportation: schedule trailer pickup."),
        new(PickupScheduled, "Pickup Scheduled / Awaiting Arrival", "Receiving: wait for tanks to arrive."),
        new(Received, "At Plant / Ready for Production", "Production: schedule and complete refurbishment."),
        new(ReadyToShip, "Awaiting Delivery Scheduling", "Transportation: schedule outbound delivery."),
        new(ReadyToInvoice, "Ready for Invoicing", "Office: produce invoice and close order."),
    };

    public static readonly IReadOnlyDictionary<string, StatusMetadata> MetadataByKey =
        WorkflowStatusMetadata.ToDictionary(s => s.Key, StringComparer.Ordinal);

    public static readonly string[] WorkflowSteps =
    {
        New,
        ReadyForPickup,
        PickupScheduled,
        Received,
        ReadyToShip,
        ReadyToInvoice,
    };

    public static readonly string[] LifecycleWorkflowSteps =
    {
        Draft,
        PendingOrderEntryValidation,
        InboundLogisticsPlanned,
        InboundInTransit,
        ReceivedPendingReconciliation,
        ReadyForProduction,
        InProduction,
        ProductionCompletePendingApproval,
        ProductionComplete,
        OutboundLogisticsPlanned,
        DispatchedOrPickupReleased,
        InvoiceReady,
        Invoiced,
    };

    public static readonly HashSet<string> LifecycleStatuses = new(StringComparer.Ordinal)
    {
        Draft,
        PendingOrderEntryValidation,
        InboundLogisticsPlanned,
        InboundInTransit,
        ReceivedPendingReconciliation,
        ReadyForProduction,
        InProduction,
        ProductionCompletePendingApproval,
        ProductionComplete,
        OutboundLogisticsPlanned,
        DispatchedOrPickupReleased,
        InvoiceReady,
        Invoiced,
    };

    public static readonly HashSet<string> HoldOverlays = new(StringComparer.Ordinal)
    {
        OnHoldCustomer,
        OnHoldQuality,
        OnHoldLogistics,
        ExceptionQuantityMismatch,
        ExceptionDocumentation,
        Cancelled,
        ReworkOpen,
    };

    public static readonly HashSet<string> ShipmentStatuses = new(StringComparer.Ordinal)
    {
        ReadyToShip,
        ReadyToInvoice,
    };

    public static readonly HashSet<string> TransportBoardVisibleStatuses = new(StringComparer.Ordinal)
    {
        ReadyForPickup,
        ReadyToShip,
    };

    public static readonly HashSet<string> TransportEditableStatuses = new(StringComparer.Ordinal)
    {
        ReadyForPickup,
        PickupScheduled,
        ReadyToShip,
        ReadyToInvoice,
    };

    public static bool IsLifecycleStatus(string status) =>
        LifecycleStatuses.Contains(status);

    public static string MapLegacyToLifecycle(string legacyStatus) => legacyStatus switch
    {
        New => Draft,
        ReadyForPickup => InboundLogisticsPlanned,
        PickupScheduled => InboundInTransit,
        Received => ReceivedPendingReconciliation,
        ReadyToShip => ProductionComplete,
        ReadyToInvoice => InvoiceReady,
        _ => Draft,
    };

    public static string MapLifecycleToLegacy(string lifecycleStatus) => lifecycleStatus switch
    {
        Draft => New,
        PendingOrderEntryValidation => New,
        InboundLogisticsPlanned => ReadyForPickup,
        InboundInTransit => PickupScheduled,
        ReceivedPendingReconciliation => Received,
        ReadyForProduction => Received,
        InProduction => Received,
        ProductionCompletePendingApproval => ReadyToShip,
        ProductionComplete => ReadyToShip,
        OutboundLogisticsPlanned => ReadyToShip,
        DispatchedOrPickupReleased => ReadyToInvoice,
        InvoiceReady => ReadyToInvoice,
        Invoiced => ReadyToInvoice,
        _ => New,
    };
}

