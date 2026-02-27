namespace LPCylinderMES.Api.Models;

public partial class RouteTemplateAssignment
{
    public int Id { get; set; }
    public string AssignmentName { get; set; } = null!;
    public int Priority { get; set; } = 1000;
    public int RevisionNo { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    public int? CustomerId { get; set; }
    public int? SiteId { get; set; }
    public int? ItemId { get; set; }
    public string? ItemType { get; set; }
    public int RouteTemplateId { get; set; }
    public DateTime? EffectiveFromUtc { get; set; }
    public DateTime? EffectiveToUtc { get; set; }
    public DateTime CreatedUtc { get; set; }
    public DateTime UpdatedUtc { get; set; }

    public virtual Customer? Customer { get; set; }
    public virtual Item? Item { get; set; }
    public virtual Site? Site { get; set; }
    public virtual RouteTemplate RouteTemplate { get; set; } = null!;
}
