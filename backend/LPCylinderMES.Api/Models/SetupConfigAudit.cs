namespace LPCylinderMES.Api.Models;

public partial class SetupConfigAudit
{
    public int Id { get; set; }
    public string ConfigType { get; set; } = null!;
    public string ConfigKey { get; set; } = null!;
    public string Action { get; set; } = null!;
    public int? SiteId { get; set; }
    public string ChangedByEmpNo { get; set; } = "system";
    public DateTime ChangedUtc { get; set; }
    public string? PreviousValue { get; set; }
    public string? NewValue { get; set; }
    public string ReasonCode { get; set; } = null!;
    public string? ChangeNote { get; set; }
    public string CorrelationId { get; set; } = null!;

    public virtual Site? Site { get; set; }
}
