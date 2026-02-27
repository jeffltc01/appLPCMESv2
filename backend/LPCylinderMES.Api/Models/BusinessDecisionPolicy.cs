namespace LPCylinderMES.Api.Models;

public partial class BusinessDecisionPolicy
{
    public int Id { get; set; }
    public int PolicyVersion { get; set; }
    public string DecisionKey { get; set; } = null!;
    public string ScopeType { get; set; } = "Global";
    public int? SiteId { get; set; }
    public int? CustomerId { get; set; }
    public string PolicyValue { get; set; } = null!;
    public bool IsActive { get; set; }
    public DateTime UpdatedUtc { get; set; }
    public string? UpdatedByEmpNo { get; set; }
    public string? Notes { get; set; }
}
