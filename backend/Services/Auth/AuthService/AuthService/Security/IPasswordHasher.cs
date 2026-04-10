namespace AuthService.Security;

public interface IPasswordHasher
{
    string Hasher(string motDePasse);
    bool Verifier(string motDePasse, string motDePasseHash);
}
