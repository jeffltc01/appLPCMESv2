using System.Security.Cryptography;
using System.Text;
using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public sealed class AuthService(
    LpcAppsDbContext db,
    IConfiguration configuration,
    IMicrosoftTokenValidator microsoftTokenValidator) : IAuthService
{
    private static readonly string[] AllowedOperatorRoles = ["Admin", "Production", "Supervisor", "PlantManager", "Quality"];

    public async Task<OperatorPreLoginResponseDto> GetOperatorPreLoginAsync(OperatorPreLoginRequestDto dto, CancellationToken cancellationToken = default)
    {
        var normalizedEmpNo = NormalizeEmpNo(dto.EmpNo);
        var user = await LoadOperatorUserByEmpNoAsync(normalizedEmpNo, cancellationToken);
        var assignments = await BuildAssignmentsAsync(user, cancellationToken);

        return new OperatorPreLoginResponseDto(
            user.EmpNo!,
            user.DisplayName,
            !string.IsNullOrWhiteSpace(user.OperatorPasswordHash),
            assignments);
    }

    public async Task<AuthSessionDto> LoginOperatorAsync(OperatorLoginRequestDto dto, CancellationToken cancellationToken = default)
    {
        var normalizedEmpNo = NormalizeEmpNo(dto.EmpNo);
        var user = await LoadOperatorUserByEmpNoAsync(normalizedEmpNo, cancellationToken);
        var assignments = await BuildAssignmentsAsync(user, cancellationToken);

        if (!assignments.Any(a => a.SiteId == dto.SiteId && a.WorkCenterId == dto.WorkCenterId))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "The selected site/work center is not assigned to this operator.");
        }

        if (!string.IsNullOrWhiteSpace(user.OperatorPasswordHash))
        {
            if (string.IsNullOrWhiteSpace(dto.Password) || !OperatorPasswordHasher.Verify(dto.Password, user.OperatorPasswordHash))
            {
                throw new ServiceException(StatusCodes.Status401Unauthorized, "Invalid employee number or password.");
            }
        }

        await RevokeExpiredSessionsAsync(cancellationToken);

        var token = CreateSessionToken();
        var now = DateTime.UtcNow;
        var sessionHours = Math.Max(1, configuration.GetValue<int?>("Auth:OperatorSessionHours") ?? 8);
        var expiresUtc = now.AddHours(sessionHours);
        var tokenHash = Sha256(token);

        await CreateSessionAsync(
            userId: user.Id,
            tokenHash: tokenHash,
            authMethod: "operator-id",
            siteId: dto.SiteId,
            workCenterId: dto.WorkCenterId,
            expiresUtc: expiresUtc,
            cancellationToken: cancellationToken);

        return await BuildSessionDtoAsync(token, tokenHash, cancellationToken);
    }

    public async Task<AuthSessionDto> LoginMicrosoftAsync(MicrosoftLoginRequestDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.IdToken))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "IdToken is required.");
        }

        var claims = await microsoftTokenValidator.ValidateIdTokenAsync(dto.IdToken, cancellationToken);

        var user = await ResolveMicrosoftUserAsync(claims, cancellationToken);
        if (user is null || !user.IsActive || !string.Equals(user.State, "Active", StringComparison.OrdinalIgnoreCase))
        {
            throw new ServiceException(StatusCodes.Status401Unauthorized, "Unable to map Microsoft identity to an active app user.");
        }

        await RevokeExpiredSessionsAsync(cancellationToken);

        var token = CreateSessionToken();
        var now = DateTime.UtcNow;
        var sessionHours = Math.Max(1, configuration.GetValue<int?>("Auth:MicrosoftSessionHours") ?? 12);
        var expiresUtc = now.AddHours(sessionHours);
        var tokenHash = Sha256(token);

        await CreateSessionAsync(
            userId: user.Id,
            tokenHash: tokenHash,
            authMethod: "microsoft-sso",
            siteId: user.DefaultSiteId,
            workCenterId: null,
            expiresUtc: expiresUtc,
            cancellationToken: cancellationToken);

        return await BuildSessionDtoAsync(token, tokenHash, cancellationToken);
    }

    public async Task<AuthSessionDto> GetSessionAsync(string token, CancellationToken cancellationToken = default)
    {
        await RevokeExpiredSessionsAsync(cancellationToken);
        return await BuildSessionDtoAsync(token, Sha256(token), cancellationToken);
    }

    public async Task LogoutAsync(string token, CancellationToken cancellationToken = default)
    {
        var tokenHash = Sha256(token);
        var session = await db.AppAuthSessions.FirstOrDefaultAsync(s => s.TokenHash == tokenHash, cancellationToken);
        if (session is null)
        {
            return;
        }

        session.RevokedUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<AuthSessionDto> BuildSessionDtoAsync(string token, string tokenHash, CancellationToken cancellationToken)
    {
        var session = await db.AppAuthSessions
            .AsNoTracking()
            .Include(s => s.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .Include(s => s.Site)
            .Include(s => s.WorkCenter)
            .FirstOrDefaultAsync(s => s.TokenHash == tokenHash, cancellationToken);

        if (session is null || session.RevokedUtc.HasValue || session.ExpiresUtc <= DateTime.UtcNow)
        {
            throw new ServiceException(StatusCodes.Status401Unauthorized, "Session is invalid or expired.");
        }

        var user = session.User;
        if (!user.IsActive || !string.Equals(user.State, "Active", StringComparison.OrdinalIgnoreCase))
        {
            throw new ServiceException(StatusCodes.Status403Forbidden, "User is inactive or locked.");
        }

        var roles = user.UserRoles
            .Select(ur => ur.Role.RoleName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(r => r)
            .ToList();

        return new AuthSessionDto(
            token,
            session.ExpiresUtc,
            session.AuthMethod,
            user.Id,
            user.EmpNo ?? string.Empty,
            user.DisplayName,
            session.SiteId,
            session.Site?.Name,
            session.WorkCenterId,
            session.WorkCenter?.WorkCenterCode,
            session.WorkCenter?.WorkCenterName,
            roles);
    }

    private async Task<AppUser> LoadOperatorUserByEmpNoAsync(string normalizedEmpNo, CancellationToken cancellationToken)
    {
        var user = await db.AppUsers
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.EmpNo != null && u.EmpNo.ToUpper() == normalizedEmpNo, cancellationToken);

        if (user is null || !user.IsActive || !string.Equals(user.State, "Active", StringComparison.OrdinalIgnoreCase))
        {
            throw new ServiceException(StatusCodes.Status401Unauthorized, "Invalid employee number or password.");
        }

        var hasOperatorRole = user.UserRoles.Any(ur => AllowedOperatorRoles.Contains(ur.Role.RoleName));
        if (!hasOperatorRole)
        {
            throw new ServiceException(StatusCodes.Status403Forbidden, "User does not have operator permissions.");
        }

        return user;
    }

    private async Task<List<OperatorAssignmentDto>> BuildAssignmentsAsync(AppUser user, CancellationToken cancellationToken)
    {
        var siteIds = user.UserRoles
            .Where(ur => ur.SiteId.HasValue)
            .Select(ur => ur.SiteId!.Value)
            .Distinct()
            .ToList();

        if (siteIds.Count == 0 && user.DefaultSiteId.HasValue)
        {
            siteIds.Add(user.DefaultSiteId.Value);
        }

        if (siteIds.Count == 0)
        {
            throw new ServiceException(StatusCodes.Status403Forbidden, "Operator has no assigned site access.");
        }

        var workCenters = await db.WorkCenters
            .AsNoTracking()
            .Include(w => w.Site)
            .Where(w => w.IsActive && siteIds.Contains(w.SiteId))
            .OrderBy(w => w.SiteId)
            .ThenBy(w => w.WorkCenterCode)
            .ToListAsync(cancellationToken);

        if (workCenters.Count == 0)
        {
            throw new ServiceException(StatusCodes.Status403Forbidden, "Operator has no active work center assignments.");
        }

        return workCenters
            .Select(w => new OperatorAssignmentDto(
                w.SiteId,
                w.Site?.Name ?? $"Site {w.SiteId}",
                w.Id,
                w.WorkCenterCode,
                w.WorkCenterName))
            .ToList();
    }

    private async Task RevokeExpiredSessionsAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var expiredSessions = await db.AppAuthSessions
            .Where(s => !s.RevokedUtc.HasValue && s.ExpiresUtc <= now)
            .ToListAsync(cancellationToken);

        if (expiredSessions.Count == 0)
        {
            return;
        }

        foreach (var session in expiredSessions)
        {
            session.RevokedUtc = now;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task CreateSessionAsync(
        int userId,
        string tokenHash,
        string authMethod,
        int? siteId,
        int? workCenterId,
        DateTime expiresUtc,
        CancellationToken cancellationToken)
    {
        var session = new AppAuthSession
        {
            UserId = userId,
            TokenHash = tokenHash,
            AuthMethod = authMethod,
            SiteId = siteId,
            WorkCenterId = workCenterId,
            CreatedUtc = DateTime.UtcNow,
            ExpiresUtc = expiresUtc,
        };

        db.AppAuthSessions.Add(session);
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<AppUser?> ResolveMicrosoftUserAsync(MicrosoftIdentityClaims claims, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(claims.Email))
        {
            var email = claims.Email.Trim();
            var byEmail = await db.AppUsers
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(
                    u => u.Email != null && u.Email.ToUpper() == email.ToUpper(),
                    cancellationToken);
            if (byEmail is not null)
            {
                return byEmail;
            }
        }

        if (!string.IsNullOrWhiteSpace(claims.EmpNo))
        {
            var normalizedEmpNo = NormalizeEmpNo(claims.EmpNo);
            var byEmpNo = await db.AppUsers
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(
                    u => u.EmpNo != null && u.EmpNo.ToUpper() == normalizedEmpNo,
                    cancellationToken);
            if (byEmpNo is not null)
            {
                return byEmpNo;
            }
        }

        return null;
    }

    private static string NormalizeEmpNo(string? rawEmpNo)
    {
        if (string.IsNullOrWhiteSpace(rawEmpNo))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "Employee number is required.");
        }

        var normalized = rawEmpNo.Trim().ToUpperInvariant();
        if (normalized.Length > 20 || normalized.Any(ch => !char.IsLetterOrDigit(ch)))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "Employee number must be 1-20 alphanumeric characters.");
        }

        return normalized;
    }

    private static string CreateSessionToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToHexString(bytes);
    }

    private static string Sha256(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }
}
