namespace LPCylinderMES.Api.Models;

public partial class StatusReasonCode
{
    public int Id { get; set; }
    public string OverlayType { get; set; } = null!;
    public string CodeName { get; set; } = null!;
    public DateTime UpdatedUtc { get; set; }
    public string? UpdatedByEmpNo { get; set; }
}
