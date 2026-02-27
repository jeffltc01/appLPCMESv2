namespace LPCylinderMES.Api.Models;

public partial class BusinessDecisionSignoff
{
    public int Id { get; set; }
    public int PolicyVersion { get; set; }
    public string FunctionRole { get; set; } = null!;
    public bool IsApproved { get; set; }
    public string? ApprovedByEmpNo { get; set; }
    public DateTime? ApprovedUtc { get; set; }
    public string? Notes { get; set; }
}
