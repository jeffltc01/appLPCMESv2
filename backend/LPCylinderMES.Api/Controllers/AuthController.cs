using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("operator/prelogin")]
    public async Task<ActionResult<OperatorPreLoginResponseDto>> OperatorPreLogin(
        OperatorPreLoginRequestDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await authService.GetOperatorPreLoginAsync(dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("operator/login")]
    public async Task<ActionResult<AuthSessionDto>> OperatorLogin(
        OperatorLoginRequestDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await authService.LoginOperatorAsync(dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("microsoft/login")]
    public async Task<ActionResult<AuthSessionDto>> MicrosoftLogin(
        MicrosoftLoginRequestDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await authService.LoginMicrosoftAsync(dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("session")]
    public async Task<ActionResult<AuthSessionDto>> GetSession(CancellationToken cancellationToken)
    {
        try
        {
            var token = ExtractBearerToken();
            return Ok(await authService.GetSessionAsync(token, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("logout")]
    public async Task<ActionResult> Logout(CancellationToken cancellationToken)
    {
        try
        {
            var token = ExtractBearerToken();
            await authService.LogoutAsync(token, cancellationToken);
            return NoContent();
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    private string ExtractBearerToken()
    {
        var header = Request.Headers.Authorization.ToString();
        const string prefix = "Bearer ";
        if (string.IsNullOrWhiteSpace(header) || !header.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new ServiceException(StatusCodes.Status401Unauthorized, "Missing bearer token.");
        }

        var token = header[prefix.Length..].Trim();
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new ServiceException(StatusCodes.Status401Unauthorized, "Missing bearer token.");
        }

        return token;
    }
}
