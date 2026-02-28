namespace LPCylinderMES.Api.Models;

public partial class FeatureFlagConfig
{
    public int Id { get; set; }
    public string FlagKey { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public string Category { get; set; } = null!;
    public int? SiteId { get; set; }
    public bool CurrentValue { get; set; }
    public DateTime? EffectiveFromUtc { get; set; }
    public string? RollbackPlan { get; set; }
    public string? LastReasonCode { get; set; }
    public string? LastChangeNote { get; set; }
    public DateTime LastChangedUtc { get; set; }
    public string LastChangedByEmpNo { get; set; } = "system";

    public virtual Site? Site { get; set; }
}
