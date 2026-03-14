namespace LPCylinderMES.Api.Models;

public class ScheduleSettings
{
    public int Id { get; set; }

    public int ThroughputLookbackDays { get; set; } = 90;

    public DateTime UpdatedUtc { get; set; }

    public string? UpdatedByEmpNo { get; set; }
}
