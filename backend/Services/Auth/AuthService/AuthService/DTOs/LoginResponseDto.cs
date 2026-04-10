public sealed class LoginResponseDto
{
    // ✅ JWT court (ex: 15 min) : utilisé pour appeler les endpoints protégés
    public string AccessToken { get; set; } = default!;

    // ✅ Date d’expiration du JWT (UTC) : le front sait quand il doit refresh
    public DateTime ExpiresAtUtc { get; set; }

    // ✅ Refresh token (longue durée, ex: 7 jours)
    // Le front l’utilise pour demander un nouveau JWT via POST /auth/refresh
    public string RefreshToken { get; set; } = default!;
   
}