namespace LPCylinderMES.Api.Models;

public sealed class AppAuthSession
{
    public long Id { get; set; }
    public int UserId { get; set; }
    public string TokenHash { get; set; } = null!;
    public string AuthMethod { get; set; } = null!;
    public int? SiteId { get; set; }
    public int? WorkCenterId { get; set; }
    public DateTime CreatedUtc { get; set; }
    public DateTime ExpiresUtc { get; set; }
    public DateTime? RevokedUtc { get; set; }

    public AppUser User { get; set; } = null!;
    public Site? Site { get; set; }
    public WorkCenter? WorkCenter { get; set; }
}
