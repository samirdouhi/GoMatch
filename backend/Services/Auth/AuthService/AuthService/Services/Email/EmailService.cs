using System.Net;
using System.Net.Mail;
using AuthService.Configuration;
using AuthService.DTOs;
using AuthService.Exceptions;
using AuthService.Logging;
using AuthService.Repositories;
using Microsoft.Extensions.Options;

namespace AuthService.Services.Email;

public sealed class EmailService : IEmailService
{
    private readonly SmtpOptions _smtp;
    private readonly IUserRepository _users;
  
    public EmailService(
        IOptions<SmtpOptions> smtp,
        IUserRepository users,
         IConfiguration configuration)
    {
        _smtp = smtp.Value;
        _users = users;
       
    }

    public async Task SendAsync(string to, string subject, string body)
    {
        if (string.IsNullOrWhiteSpace(to))
            throw new ValidationException("Le destinataire est obligatoire.", "AUTH.EMAIL_TO_REQUIRED");

        if (string.IsNullOrWhiteSpace(subject))
            throw new ValidationException("Le sujet est obligatoire.", "AUTH.EMAIL_SUBJECT_REQUIRED");

        if (string.IsNullOrWhiteSpace(body))
            throw new ValidationException("Le contenu de l'email est obligatoire.", "AUTH.EMAIL_BODY_REQUIRED");

        using var client = new SmtpClient(_smtp.Host, _smtp.Port)
        {
            Credentials = new NetworkCredential(_smtp.Username, _smtp.Password),
            EnableSsl = true
        };

        using var mail = new MailMessage(
            from: _smtp.From,
            to: to.Trim(),
            subject: subject,
            body: body)
        {
            IsBodyHtml = true
        };

        await client.SendMailAsync(mail);
    }

    public async Task SendConfirmationEmailAsync(string to, string confirmationToken)
    {
        if (string.IsNullOrWhiteSpace(confirmationToken))
            throw new ValidationException("Token de confirmation obligatoire.", "AUTH.TOKEN_REQUIRED");

        var confirmUrl = BuildFrontendConfirmUrl(confirmationToken);

        var subject = "Confirme ton email - GoMatch";
        var body = $"""
        <h2>Bienvenue sur GoMatch</h2>
        <p>Merci pour votre inscription.</p>
        <p>Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>
        <p><a href="{confirmUrl}">Confirmer mon email</a></p>
        <p>Ce lien expire dans 24 heures.</p>
        """;

        await SendAsync(to, subject, body);
    }

    public async Task SendEmailChangeConfirmationAsync(string to, string confirmationToken)
    {
        if (string.IsNullOrWhiteSpace(confirmationToken))
            throw new ValidationException("Token de confirmation obligatoire.", "AUTH.TOKEN_REQUIRED");

        var confirmUrl = BuildFrontendConfirmUrl(confirmationToken);

        var subject = "Confirme ton nouvel email - GoMatch";
        var body = $"""
        <h2>Changement d'adresse email</h2>
        <p>Veuillez confirmer votre nouvelle adresse email en cliquant ci-dessous :</p>
        <p><a href="{confirmUrl}">Confirmer mon email</a></p>
        <p>Ce lien expire dans 24 heures.</p>
        """;

        await SendAsync(to, subject, body);
    }

    public async Task SendResendConfirmationEmailAsync(string to, string confirmationToken)
    {
        if (string.IsNullOrWhiteSpace(confirmationToken))
            throw new ValidationException("Token de confirmation obligatoire.", "AUTH.TOKEN_REQUIRED");

        var confirmUrl = BuildFrontendConfirmUrl(confirmationToken);

        var subject = "Confirme ton email - GoMatch";
        var body = $"""
        <h2>Confirmation d'email</h2>
        <p>Nous avons généré un nouveau lien de confirmation pour votre compte.</p>
        <p>Cliquez sur le lien ci-dessous pour confirmer votre adresse email :</p>
        <p><a href="{confirmUrl}">Confirmer mon email</a></p>
        <p>Ce lien expire dans 24 heures.</p>
        """;

        await SendAsync(to, subject, body);
    }

    public async Task<(bool Success, int Code, string? Erreur)> ConfirmEmailAsync(
        string token,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ValidationException("Token obligatoire.", "AUTH.TOKEN_REQUIRED");

        var user = await _users.GetByEmailConfirmationTokenAsync(token.Trim(), ct);
        if (user is null)
            throw new NotFoundException("Token de confirmation invalide.", "AUTH.INVALID_CONFIRMATION_TOKEN");

        if (user.EmailConfirmed)
            return (true, StatusCodes.Status200OK, null);

        if (user.EmailConfirmationTokenExpiresAt is null || user.EmailConfirmationTokenExpiresAt <= DateTime.UtcNow)
            throw new ValidationException("Le token de confirmation a expiré.", "AUTH.CONFIRMATION_TOKEN_EXPIRED");

        user.EmailConfirmed = true;
        user.EmailConfirmationToken = null;
        user.EmailConfirmationTokenExpiresAt = null;

        await _users.SauvegarderAsync(ct);

        return (true, StatusCodes.Status200OK, null);
    }

    public async Task<(bool Success, int Code, string? Erreur)> ResendConfirmationEmailAsync(
        ResendConfirmationEmailRequestDto dto,
        CancellationToken ct)
    {
        if (dto is null)
            throw new ValidationException("Requête invalide.", "AUTH.INVALID_REQUEST");

        var email = LogSanitizer.NormalizeEmail(dto.Email);

        if (string.IsNullOrWhiteSpace(email))
            throw new ValidationException("Email obligatoire.", "AUTH.EMAIL_REQUIRED");

        var user = await _users.GetByEmailAsync(email, ct);
        if (user is null)
            throw new NotFoundException("Aucun compte trouvé avec cet email.", "AUTH.USER_NOT_FOUND");

        if (user.EmailConfirmed)
            throw new ConflictException("Cet email est déjà confirmé.", "AUTH.EMAIL_ALREADY_CONFIRMED");

        user.EmailConfirmationToken = Guid.NewGuid().ToString("N");
        user.EmailConfirmationTokenExpiresAt = DateTime.UtcNow.AddHours(24);

        await _users.SauvegarderAsync(ct);

        await SendResendConfirmationEmailAsync(
            user.Email,
            user.EmailConfirmationToken!);

        return (true, StatusCodes.Status200OK, null);
    }

    public async Task SendMerchantApprovedEmailAsync(string to, string? fullName = null)
    {
        var greeting = BuildGreeting(fullName);

        var subject = "Votre demande commerçant a été acceptée - GoMatch";
        var body = $"""
        <h2>Demande commerçant acceptée</h2>
        <p>Bonjour {greeting},</p>
        <p>Votre demande de compte commerçant a été acceptée.</p>
        <p>Vous pouvez maintenant accéder aux fonctionnalités commerçant sur GoMatch.</p>
        <p>Bienvenue sur la plateforme.</p>
        """;

        await SendAsync(to, subject, body);
    }

    public async Task SendMerchantRejectedEmailAsync(string to, string reason, string? fullName = null)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new ValidationException("La raison du rejet est obligatoire.", "AUTH.REJECTION_REASON_REQUIRED");

        var greeting = BuildGreeting(fullName);
        var safeReason = WebUtility.HtmlEncode(reason.Trim());

        var subject = "Votre demande commerçant a été refusée - GoMatch";
        var body = $"""
        <h2>Demande commerçant refusée</h2>
        <p>Bonjour {greeting},</p>
        <p>Votre demande de compte commerçant a été refusée.</p>
        <p><strong>Raison :</strong> {safeReason}</p>
        <p>Vous pouvez corriger votre demande puis soumettre une nouvelle demande.</p>
        """;

        await SendAsync(to, subject, body);
    }

    private static string BuildFrontendConfirmUrl(string confirmationToken)
    {
        var encodedToken = Uri.EscapeDataString(confirmationToken);
        return $"http://localhost:3000/confirm-email?token={encodedToken}";
    }

    private static string BuildGreeting(string? fullName)
    {
        return string.IsNullOrWhiteSpace(fullName)
            ? "Monsieur / Madame"
            : WebUtility.HtmlEncode(fullName.Trim());
    }

    public async Task SendMerchantSubmissionReceivedEmailAsync(
    string to,
    string? fullName = null)
    {
        var safeName = string.IsNullOrWhiteSpace(fullName) ? "cher utilisateur" : fullName.Trim();

        var subject = "Demande commerçant reçue - GoMatch";

        var body = $@"
        <div style='font-family:Arial,sans-serif;line-height:1.6;color:#111'>
            <h2 style='color:#f59e0b;'>Demande reçue</h2>

            <p>Bonjour {safeName},</p>

            <p>
                Nous confirmons la bonne réception de votre demande de compte commerçant sur <strong>GoMatch</strong>.
            </p>

            <p>
                Votre dossier est actuellement en cours d’examen par notre équipe.
                Vous recevrez une réponse de notre support dans un délai maximum de <strong>24 heures</strong>.
            </p>

            <p>
                Nous vous informerons par email dès que votre demande sera traitée.
            </p>

            <p>Merci pour votre confiance.</p>

            <p><strong>L’équipe GoMatch</strong></p>
        </div>";

        await SendAsync(to, subject, body);
    }
    public async Task SendMerchantEmailVerificationAsync(
    string to,
    string token,
    string? fullName,
    CancellationToken ct)
    {
        var safeName = string.IsNullOrWhiteSpace(fullName)
            ? "cher utilisateur"
            : fullName.Trim();

        var confirmationUrl =
     $"http://localhost:3000/merchant/confirm-email?token={Uri.EscapeDataString(token)}";

        var subject = "Vérifiez votre email professionnel - GoMatch";

        var body = $@"
        <div style='font-family:Arial,sans-serif;line-height:1.6;color:#111'>
            <h2 style='color:#f59e0b;'>Vérification de votre email professionnel</h2>

            <p>Bonjour {safeName},</p>

            <p>
                Avant d’envoyer votre demande commerçant à notre équipe, nous devons vérifier votre adresse email professionnelle.
            </p>

            <p>
                Cliquez sur le bouton ci-dessous pour confirmer votre adresse :
            </p>

            <p style='margin:24px 0;'>
                <a href='{confirmationUrl}'
                   style='background:#f59e0b;color:#111;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;'>
                    Confirmer mon email professionnel
                </a>
            </p>

            <p>
                Ce lien expire dans 24 heures.
            </p>

            <p><strong>L’équipe GoMatch</strong></p>
        </div>";

        await SendAsync(to, subject, body);
    }
}