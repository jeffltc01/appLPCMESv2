namespace LPCylinderMES.Api.Models;

public static class ReceiptStatusCatalog
{
    public const string Unknown = "Unknown";
    public const string Received = "Received";
    public const string NotReceived = "NotReceived";

    public static readonly HashSet<string> Allowed = new(StringComparer.Ordinal)
    {
        Unknown,
        Received,
        NotReceived,
    };
}
