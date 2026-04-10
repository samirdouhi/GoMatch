namespace AuthService.Logging;

public static class LogSanitizer
{
    // Ne jamais logger un token complet → on garde juste la fin
    public static string TokenTail(string? token, int keep = 6)
    {
        if (string.IsNullOrWhiteSpace(token)) return "null";
        var t = token.Trim();
        return t.Length <= keep ? t : t[^keep..];
    }

    public static string NormalizeEmail(string? email)
        => (email ?? string.Empty).Trim().ToLowerInvariant();
}