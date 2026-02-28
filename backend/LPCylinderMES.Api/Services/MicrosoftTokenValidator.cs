using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace LPCylinderMES.Api.Services;

public sealed class MicrosoftAuthOptions
{
    public string? Authority { get; set; }
    public string? ClientId { get; set; }
}

public sealed record MicrosoftIdentityClaims(
    string SubjectId,
    string? Email,
    string? EmpNo);

public interface IMicrosoftTokenValidator
{
    Task<MicrosoftIdentityClaims> ValidateIdTokenAsync(string idToken, CancellationToken cancellationToken = default);
}

public sealed class MicrosoftTokenValidator(IOptions<MicrosoftAuthOptions> options) : IMicrosoftTokenValidator
{
    private readonly JwtSecurityTokenHandler _tokenHandler = new();

    public async Task<MicrosoftIdentityClaims> ValidateIdTokenAsync(string idToken, CancellationToken cancellationToken = default)
    {
        var authority = options.Value.Authority?.Trim();
        var clientId = options.Value.ClientId?.Trim();
        if (string.IsNullOrWhiteSpace(authority) || string.IsNullOrWhiteSpace(clientId))
        {
            throw new ServiceException(StatusCodes.Status503ServiceUnavailable, "Microsoft SSO is not configured.");
        }

        var metadataEndpoint = authority.TrimEnd('/') + "/v2.0/.well-known/openid-configuration";
        var configManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            metadataEndpoint,
            new OpenIdConnectConfigurationRetriever());
        var oidcConfig = await configManager.GetConfigurationAsync(cancellationToken);

        var parameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKeys = oidcConfig.SigningKeys,
            ValidateIssuer = true,
            ValidIssuers = [oidcConfig.Issuer],
            ValidateAudience = true,
            ValidAudience = clientId,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2),
        };

        _tokenHandler.ValidateToken(idToken, parameters, out var validatedToken);
        var jwt = (JwtSecurityToken)validatedToken;

        var subjectId = FirstClaim(jwt, "oid") ?? FirstClaim(jwt, "sub");
        if (string.IsNullOrWhiteSpace(subjectId))
        {
            throw new ServiceException(StatusCodes.Status401Unauthorized, "Microsoft token missing subject identifier.");
        }

        var email = FirstClaim(jwt, "email")
            ?? FirstClaim(jwt, "preferred_username")
            ?? FirstClaim(jwt, "upn");
        var empNo = FirstClaim(jwt, "employeeid") ?? FirstClaim(jwt, "extension_employeeid");

        return new MicrosoftIdentityClaims(subjectId, email, empNo);
    }

    private static string? FirstClaim(JwtSecurityToken jwt, string claimType) =>
        jwt.Claims.FirstOrDefault(c => string.Equals(c.Type, claimType, StringComparison.OrdinalIgnoreCase))?.Value;
}
