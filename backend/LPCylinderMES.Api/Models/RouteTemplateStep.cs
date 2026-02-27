namespace LPCylinderMES.Api.Models;

public partial class RouteTemplateStep
{
    public int Id { get; set; }
    public int RouteTemplateId { get; set; }
    public int StepSequence { get; set; }
    public string StepCode { get; set; } = null!;
    public string StepName { get; set; } = null!;
    public int WorkCenterId { get; set; }
    public bool IsRequired { get; set; } = true;
    public string DataCaptureMode { get; set; } = "ElectronicRequired";
    public string TimeCaptureMode { get; set; } = "Automated";
    public bool RequiresScan { get; set; } = true;
    public bool RequiresUsageEntry { get; set; }
    public bool RequiresScrapEntry { get; set; }
    public bool RequiresSerialCapture { get; set; }
    public bool RequiresChecklistCompletion { get; set; }
    public int? ChecklistTemplateId { get; set; }
    public string ChecklistFailurePolicy { get; set; } = "BlockCompletion";
    public bool RequireScrapReasonWhenBad { get; set; } = true;
    public bool RequiresTrailerCapture { get; set; }
    public bool RequiresSerialLoadVerification { get; set; }
    public bool GeneratePackingSlipOnComplete { get; set; }
    public bool GenerateBolOnComplete { get; set; }
    public bool RequiresAttachment { get; set; }
    public bool RequiresSupervisorApproval { get; set; }
    public bool AutoQueueNextStep { get; set; } = true;
    public int? SlaMinutes { get; set; }

    public virtual RouteTemplate RouteTemplate { get; set; } = null!;
    public virtual WorkCenter WorkCenter { get; set; } = null!;
}
