namespace LPCylinderMES.Api.Models;

public partial class AppUser
{
    public int Id { get; set; }
    public string? EmpNo { get; set; }
    public string DisplayName { get; set; } = null!;
    public string? Email { get; set; }
    public int? DefaultSiteId { get; set; }
    public string State { get; set; } = "Active";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedUtc { get; set; }
    public DateTime UpdatedUtc { get; set; }

    public virtual Site? DefaultSite { get; set; }
    public virtual ICollection<AppUserRole> UserRoles { get; set; } = new List<AppUserRole>();
}
