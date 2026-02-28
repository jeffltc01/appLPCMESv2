using LPCylinderMES.Api.DTOs;

namespace LPCylinderMES.Api.Services;

public interface IAuthService
{
    Task<OperatorPreLoginResponseDto> GetOperatorPreLoginAsync(OperatorPreLoginRequestDto dto, CancellationToken cancellationToken = default);
    Task<AuthSessionDto> LoginOperatorAsync(OperatorLoginRequestDto dto, CancellationToken cancellationToken = default);
    Task<AuthSessionDto> LoginMicrosoftAsync(MicrosoftLoginRequestDto dto, CancellationToken cancellationToken = default);
    Task<AuthSessionDto> GetSessionAsync(string token, CancellationToken cancellationToken = default);
    Task LogoutAsync(string token, CancellationToken cancellationToken = default);
}
