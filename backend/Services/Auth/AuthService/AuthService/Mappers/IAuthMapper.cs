// Mappers/IAuthMapper.cs
using AuthService.DTOs;
using AuthService.Models;

namespace AuthService.Mappers;

public interface IAuthMapper
{
    User ToUser(string normalizedEmail, string passwordHash);

    RegisterResponseDto ToRegisterResponse(User user);

    // ✅ Login avec refresh token
    LoginResponseDto ToLoginResponse(string accessToken, DateTime expiresAtUtc, string refreshToken);

    // ✅ Refresh response (optionnel mais propre)
    RefreshResponseDto ToRefreshResponse(string accessToken, DateTime expiresAtUtc, string refreshToken);



}
