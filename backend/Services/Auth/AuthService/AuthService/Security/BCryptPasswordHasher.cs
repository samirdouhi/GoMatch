namespace AuthService.Security;

public sealed class BCryptPasswordHasher : IPasswordHasher
{
    public string Hasher(string motDePasse)
    {
        // BCrypt génère automatiquement un salt et retourne une chaîne hashée.
        return BCrypt.Net.BCrypt.HashPassword(motDePasse);
    }

    public bool Verifier(string motDePasse, string motDePasseHash)
    {
        return BCrypt.Net.BCrypt.Verify(motDePasse, motDePasseHash);
    }
}
