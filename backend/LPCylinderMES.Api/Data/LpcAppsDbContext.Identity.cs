using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Data;

public partial class LpcAppsDbContext
{
    public virtual DbSet<AppUser> AppUsers { get; set; }
    public virtual DbSet<AppRole> AppRoles { get; set; }
    public virtual DbSet<AppUserRole> AppUserRoles { get; set; }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.ToTable("app_users");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.EmpNo).HasMaxLength(30).IsUnicode(false).HasColumnName("emp_no");
            entity.Property(e => e.DisplayName).HasMaxLength(120).IsUnicode(false).HasColumnName("display_name");
            entity.Property(e => e.Email).HasMaxLength(255).IsUnicode(false).HasColumnName("email");
            entity.Property(e => e.DefaultSiteId).HasColumnName("default_site_id");
            entity.Property(e => e.State).HasMaxLength(20).IsUnicode(false).HasColumnName("state");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedUtc).HasColumnType("datetime").HasColumnName("created_utc");
            entity.Property(e => e.UpdatedUtc).HasColumnType("datetime").HasColumnName("updated_utc");
            entity.HasIndex(e => e.EmpNo).IsUnique();

            entity.HasOne(e => e.DefaultSite).WithMany().HasForeignKey(e => e.DefaultSiteId);
        });

        modelBuilder.Entity<AppRole>(entity =>
        {
            entity.ToTable("app_roles");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RoleName).HasMaxLength(40).IsUnicode(false).HasColumnName("role_name");
            entity.Property(e => e.Description).HasMaxLength(240).IsUnicode(false).HasColumnName("description");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedUtc).HasColumnType("datetime").HasColumnName("created_utc");
            entity.Property(e => e.UpdatedUtc).HasColumnType("datetime").HasColumnName("updated_utc");
            entity.HasIndex(e => e.RoleName).IsUnique();
        });

        modelBuilder.Entity<AppUserRole>(entity =>
        {
            entity.ToTable("app_user_roles");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.SiteId).HasColumnName("site_id");
            entity.Property(e => e.CreatedUtc).HasColumnType("datetime").HasColumnName("created_utc");
            entity.Property(e => e.CreatedBy).HasMaxLength(30).IsUnicode(false).HasColumnName("created_by");
            entity.HasIndex(e => new { e.UserId, e.RoleId, e.SiteId }).IsUnique();

            entity.HasOne(e => e.User).WithMany(u => u.UserRoles).HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Role).WithMany(r => r.UserRoles).HasForeignKey(e => e.RoleId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Site).WithMany().HasForeignKey(e => e.SiteId).OnDelete(DeleteBehavior.SetNull);
        });
    }
}
