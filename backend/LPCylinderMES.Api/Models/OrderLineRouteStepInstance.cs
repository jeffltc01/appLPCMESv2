namespace LPCylinderMES.Api.Models;

public partial class OrderLineRouteStepInstance
{
    public long Id { get; set; }
    public long OrderLineRouteInstanceId { get; set; }
    public int SalesOrderDetailId { get; set; }
    public int StepSequence { get; set; }
    public string StepCode { get; set; } = null!;
    public string StepName { get; set; } = null!;
    public int WorkCenterId { get; set; }
    public string State { get; set; } = "Pending";
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
    public DateTime? ScanInUtc { get; set; }
    public DateTime? ScanOutUtc { get; set; }
    public decimal? DurationMinutes { get; set; }
    public decimal? ManualDurationMinutes { get; set; }
    public string? ManualDurationReason { get; set; }
    public string TimeCaptureSource { get; set; } = "SystemScan";
    public string? StartedByEmpNo { get; set; }
    public string? CompletedByEmpNo { get; set; }
    public DateTime? CompletedUtc { get; set; }
    public string? BlockedReason { get; set; }
    public string? StepAdjustedBy { get; set; }
    public DateTime? StepAdjustedUtc { get; set; }
    public string? StepAdjustmentReason { get; set; }

    public virtual OrderLineRouteInstance OrderLineRouteInstance { get; set; } = null!;
    public virtual SalesOrderDetail SalesOrderDetail { get; set; } = null!;
    public virtual WorkCenter WorkCenter { get; set; } = null!;
    public virtual ICollection<OperatorActivityLog> ActivityLogs { get; set; } = new List<OperatorActivityLog>();
}
