namespace LPCylinderMES.Api.Models;

public partial class OrderAttachment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string FileName { get; set; } = null!;
    public string BlobPath { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long SizeBytes { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    public virtual SalesOrder Order { get; set; } = null!;
}
