using System.Security.Cryptography;
using System.Text;
using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace LPCylinderMES.Api.Tests;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task GetOperatorPreLoginAsync_ReturnsAssignmentsAndPasswordFlag()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GetOperatorPreLoginAsync_ReturnsAssignmentsAndPasswordFlag));
        SeedOperatorContext(db, withPassword: false);
        await db.SaveChangesAsync();

        var service = new AuthService(db, BuildConfig(operatorHours: 8), new FakeMicrosoftTokenValidator());
        var response = await service.GetOperatorPreLoginAsync(new OperatorPreLoginRequestDto("emp001"));

        Assert.Equal("EMP001", response.EmpNo);
        Assert.False(response.PasswordRequired);
        Assert.NotEmpty(response.Assignments);
        Assert.Contains(response.Assignments, a => a.SiteId == 1 && a.WorkCenterId == 10);
    }

    [Fact]
    public async Task LoginOperatorAsync_WhenPasswordRequiredAndMissing_ThrowsUnauthorized()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(LoginOperatorAsync_WhenPasswordRequiredAndMissing_ThrowsUnauthorized));
        SeedOperatorContext(db, withPassword: true);
        await db.SaveChangesAsync();

        var service = new AuthService(db, BuildConfig(operatorHours: 8), new FakeMicrosoftTokenValidator());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.LoginOperatorAsync(new OperatorLoginRequestDto("EMP001", null, 1, 10)));

        Assert.Equal(StatusCodes.Status401Unauthorized, ex.StatusCode);
    }

    [Fact]
    public async Task LoginOperatorAsync_ValidCredentials_CreatesSession()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(LoginOperatorAsync_ValidCredentials_CreatesSession));
        SeedOperatorContext(db, withPassword: true);
        await db.SaveChangesAsync();

        var service = new AuthService(db, BuildConfig(operatorHours: 6), new FakeMicrosoftTokenValidator());
        var login = await service.LoginOperatorAsync(new OperatorLoginRequestDto("EMP001", "pw1234", 1, 10));
        var session = await service.GetSessionAsync(login.Token);

        Assert.Equal("EMP001", login.EmpNo);
        Assert.Equal("operator-id", login.AuthMethod);
        Assert.Equal(10, login.WorkCenterId);
        Assert.Equal(login.Token, session.Token);
        Assert.Equal("WC-10", session.WorkCenterCode);
    }

    [Fact]
    public async Task LoginMicrosoftAsync_MapsByEmailAndCreatesSession()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(LoginMicrosoftAsync_MapsByEmailAndCreatesSession));
        SeedOperatorContext(db, withPassword: false);
        await db.SaveChangesAsync();
        var user = await db.AppUsers.FirstAsync();
        user.Email = "operator.one@example.com";
        await db.SaveChangesAsync();

        var validator = new FakeMicrosoftTokenValidator
        {
            Result = new MicrosoftIdentityClaims("oid-1", "operator.one@example.com", null),
        };
        var service = new AuthService(db, BuildConfig(operatorHours: 8), validator);
        var login = await service.LoginMicrosoftAsync(new MicrosoftLoginRequestDto("fake-id-token"));

        Assert.Equal("microsoft-sso", login.AuthMethod);
        Assert.Equal("EMP001", login.EmpNo);
        Assert.Equal(1, login.SiteId);
        Assert.Null(login.WorkCenterId);
    }

    [Fact]
    public async Task GetOperatorPreLoginAsync_AllowsAdminRole()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GetOperatorPreLoginAsync_AllowsAdminRole));
        SeedOperatorContext(db, withPassword: false, roleName: "Admin");
        await db.SaveChangesAsync();

        var service = new AuthService(db, BuildConfig(operatorHours: 8), new FakeMicrosoftTokenValidator());
        var response = await service.GetOperatorPreLoginAsync(new OperatorPreLoginRequestDto("EMP001"));

        Assert.Equal("EMP001", response.EmpNo);
        Assert.NotEmpty(response.Assignments);
    }

    private static IConfiguration BuildConfig(int operatorHours)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Auth:OperatorSessionHours"] = operatorHours.ToString(),
            })
            .Build();
    }

    private static void SeedOperatorContext(LpcAppsDbContext db, bool withPassword, string roleName = "Production")
    {
        db.Sites.Add(new Site { Id = 1, Name = "Main Site", SiteCode = "MAIN" });
        db.WorkCenters.Add(new WorkCenter
        {
            Id = 10,
            WorkCenterCode = "WC-10",
            WorkCenterName = "Blast",
            SiteId = 1,
            IsActive = true,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.AppRoles.Add(new AppRole
        {
            Id = 100,
            RoleName = roleName,
            IsActive = true,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });

        db.AppUsers.Add(new AppUser
        {
            Id = 1,
            EmpNo = "EMP001",
            DisplayName = "Operator One",
            OperatorPasswordHash = withPassword ? HashPassword("pw1234") : null,
            DefaultSiteId = 1,
            State = "Active",
            IsActive = true,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });

        db.AppUserRoles.Add(new AppUserRole
        {
            Id = 200,
            UserId = 1,
            RoleId = 100,
            SiteId = 1,
            CreatedUtc = DateTime.UtcNow,
            CreatedBy = "test",
        });
    }

    private static string HashPassword(string password)
    {
        const int iterations = 100_000;
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            32);

        return $"v1.{iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    private sealed class FakeMicrosoftTokenValidator : IMicrosoftTokenValidator
    {
        public MicrosoftIdentityClaims Result { get; set; } = new("oid-1", null, null);

        public Task<MicrosoftIdentityClaims> ValidateIdTokenAsync(string idToken, CancellationToken cancellationToken = default) =>
            Task.FromResult(Result);
    }
}
