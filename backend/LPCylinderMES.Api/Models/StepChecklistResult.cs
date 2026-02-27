namespace LPCylinderMES.Api.Models;

public partial class StepChecklistResult
{
    public long Id { get; set; }
    public long OrderLineRouteStepInstanceId { get; set; }
    public int ChecklistTemplateItemId { get; set; }
    public string ItemLabel { get; set; } = null!;
    public bool IsRequiredItem { get; set; } = true;
    public string ResultStatus { get; set; } = null!;
    public string? ResultNotes { get; set; }
    public string CompletedByEmpNo { get; set; } = null!;
    public DateTime CompletedUtc { get; set; }

    public virtual OrderLineRouteStepInstance OrderLineRouteStepInstance { get; set; } = null!;
}
