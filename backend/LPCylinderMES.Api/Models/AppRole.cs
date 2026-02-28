namespace LPCylinderMES.Api.Models;

public partial class AppRole
{
    public int Id { get; set; }
    public string RoleName { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedUtc { get; set; }
    public DateTime UpdatedUtc { get; set; }

    public virtual ICollection<AppUserRole> UserRoles { get; set; } = new List<AppUserRole>();
}
