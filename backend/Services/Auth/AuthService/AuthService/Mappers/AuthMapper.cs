// Mappers/AuthMapper.cs
using AuthService.DTOs;
using AuthService.Models;

namespace AuthService.Mappers;

public sealed class AuthMapper : IAuthMapper
{
    public User ToUser(string normalizedEmail, string passwordHash) => new()
    {
        Email = normalizedEmail,
        PasswordHash = passwordHash
    };

    public RegisterResponseDto ToRegisterResponse(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Roles = user.Roles.Select(r => r.ToString()).ToList()
    };

    public LoginResponseDto ToLoginResponse(string accessToken, DateTime expiresAtUtc, string refreshToken) => new()
    {
        AccessToken = accessToken,
        ExpiresAtUtc = expiresAtUtc,
        RefreshToken = refreshToken
    };

    public RefreshResponseDto ToRefreshResponse(string accessToken, DateTime expiresAtUtc, string refreshToken) => new()
    {
        AccessToken = accessToken,
        ExpiresAtUtc = expiresAtUtc,
        RefreshToken = refreshToken
    };
}
