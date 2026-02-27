namespace LPCylinderMES.Api.Models;

public partial class RouteTemplate
{
    public int Id { get; set; }
    public string RouteTemplateCode { get; set; } = null!;
    public string RouteTemplateName { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int VersionNo { get; set; } = 1;
    public DateTime CreatedUtc { get; set; }
    public DateTime UpdatedUtc { get; set; }

    public virtual ICollection<RouteTemplateStep> Steps { get; set; } = new List<RouteTemplateStep>();
    public virtual ICollection<RouteTemplateAssignment> Assignments { get; set; } = new List<RouteTemplateAssignment>();
}
