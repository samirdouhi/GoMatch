using System.Text.RegularExpressions;

namespace AuthService.Security;

public sealed class PasswordPolicy
{
    // 1 minuscule, 1 majuscule, 1 chiffre, 1 spécial, min 8
    private static readonly Regex MotDePasseFort =
        new(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$",
            RegexOptions.Compiled);

    public bool EstValide(string motDePasse, out string? erreur)
    {
        if (string.IsNullOrWhiteSpace(motDePasse))
        {
            erreur = "Le mot de passe est obligatoire.";
            return false;
        }

        if (motDePasse.Length < 8)
        {
            erreur = "Le mot de passe doit contenir au moins 8 caractères.";
            return false;
        }

        if (!MotDePasseFort.IsMatch(motDePasse))
        {
            erreur = "Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial.";
            return false;
        }

        erreur = null;
        return true;
    }
}
