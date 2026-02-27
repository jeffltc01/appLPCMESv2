using System;

namespace LPCylinderMES.Api.Models;

public class OrderLifecycleMigrationAudit
{
    public long Id { get; set; }

    public string MigrationBatchId { get; set; } = null!;

    public int OrderId { get; set; }

    public string LegacyStatus { get; set; } = null!;

    public string? PreviousLifecycleStatus { get; set; }

    public string ProposedLifecycleStatus { get; set; } = null!;

    public string RuleApplied { get; set; } = null!;

    public bool DryRun { get; set; }

    public bool WasUpdated { get; set; }

    public string? MigratedBy { get; set; }

    public DateTime ComputedUtc { get; set; }

    public DateTime? AppliedUtc { get; set; }

    public virtual SalesOrder Order { get; set; } = null!;
}
