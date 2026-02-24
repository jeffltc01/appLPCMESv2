namespace LPCylinderMES.Api.Services;

public static class OrderStatusCatalog
{
    public static readonly string[] WorkflowSteps =
    {
        "New",
        "Ready for Pickup",
        "Pickup Scheduled",
        "Received",
        "Ready to Ship",
        "Ready to Invoice",
    };

    public static readonly HashSet<string> ShipmentStatuses = new(StringComparer.Ordinal)
    {
        "Ready to Ship",
        "Ready to Invoice",
    };

    public static readonly HashSet<string> TransportBoardVisibleStatuses = new(StringComparer.Ordinal)
    {
        "Ready for Pickup",
        "Ready to Ship",
    };

    public static readonly HashSet<string> TransportEditableStatuses = new(StringComparer.Ordinal)
    {
        "Ready for Pickup",
        "Pickup Scheduled",
        "Ready to Ship",
        "Ready to Invoice",
    };
}

