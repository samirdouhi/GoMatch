using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using ProfileService.ErrorHandling.Exceptions;

namespace ProfileService.Security;

public sealed class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUser(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal User =>
        _httpContextAccessor.HttpContext?.User
        ?? throw new UnauthorizedException("Utilisateur non authentifié.");

    public bool IsAuthenticated =>
        User.Identity?.IsAuthenticated ?? false;

    public Guid UserId
    {
        get
        {
            var value =
                User.FindFirst(CustomClaimTypes.UserId)?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (string.IsNullOrWhiteSpace(value) || !Guid.TryParse(value, out var userId))
                throw new UnauthorizedException("Claim userId invalide ou manquant.");

            return userId;
        }
    }

    public string? Role =>
        User.FindFirst(CustomClaimTypes.Role)?.Value
        ?? User.FindFirst(ClaimTypes.Role)?.Value;

    public string? Email =>
        User.FindFirst(CustomClaimTypes.Email)?.Value
        ?? User.FindFirst(ClaimTypes.Email)?.Value
        ?? User.FindFirst(JwtRegisteredClaimNames.Email)?.Value;
}