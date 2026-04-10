using System.Security.Cryptography;

namespace AuthService.Security;

public static class RefreshTokenGenerator
{
    // 64 bytes => ~88 chars en Base64 (safe)
    public static string GenerateOpaqueToken(int bytes = 64)
        => Convert.ToBase64String(RandomNumberGenerator.GetBytes(bytes));
}
