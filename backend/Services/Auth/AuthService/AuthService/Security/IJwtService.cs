using AuthService.Models;

namespace AuthService.Security
{
    public interface IJwtService
    {
        (string Token, DateTime ExpiresAtUtc) GenerateToken(User user);
    }
}
