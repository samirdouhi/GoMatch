using System.Security.Claims;
using AuthService.DTOs;

namespace AuthService.Services;

public interface IAuthService
{
    Task<(bool Success, int Code, string? Erreur, RegisterResponseDto? Data)>
        RegisterAsync(RegisterRequestDto request, CancellationToken ct);

    Task<(bool Success, int Code, string? Erreur, LoginResponseDto? Data)>
        LoginAsync(LoginRequestDto dto, CancellationToken ct);

    Task<(bool Success, int Code, string? Erreur, GoogleLoginResponseDto? Data)>
      GoogleLoginAsync(GoogleLoginRequestDto dto, CancellationToken ct);

    Task<(bool Success, int Code, string? Erreur, RefreshResponseDto? Data)>
        RefreshAsync(RefreshRequestDto dto, CancellationToken ct);

    Task<(bool Success, int Code, string? Erreur)>
        LogoutAsync(string refreshToken, CancellationToken ct);

    Task<(bool Success, int Code, string? Erreur, AuthMeResponseDto? Data)>
        GetMeAsync(ClaimsPrincipal user, CancellationToken ct);

    Task<(bool Success, int Code, string? Erreur)>
        ChangeEmailAsync(ClaimsPrincipal user, ChangeEmailRequestDto dto, CancellationToken ct);

    Task<(bool Success, int Code, string? Erreur)>
        ChangePasswordAsync(ClaimsPrincipal user, ChangePasswordRequestDto dto, CancellationToken ct);

    Task<(bool Success, int Code, string? Erreur)>
        GrantMerchantRoleAsync(Guid userId, CancellationToken ct);
}