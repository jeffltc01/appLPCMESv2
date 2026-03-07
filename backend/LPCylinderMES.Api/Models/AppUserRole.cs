namespace LPCylinderMES.Api.Models;

public partial class AppUserRole
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int RoleId { get; set; }
    public DateTime CreatedUtc { get; set; }
    public string CreatedBy { get; set; } = "system";

    public virtual AppUser User { get; set; } = null!;
    public virtual AppRole Role { get; set; } = null!;
}
