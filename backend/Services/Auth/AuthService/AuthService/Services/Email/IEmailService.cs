using AuthService.DTOs;

namespace AuthService.Services.Email;

public interface IEmailService
{
    Task SendAsync(string to, string subject, string body);

    Task SendConfirmationEmailAsync(string to, string confirmationToken);
    Task SendEmailChangeConfirmationAsync(string to, string confirmationToken);
    Task SendResendConfirmationEmailAsync(string to, string confirmationToken);

    Task<(bool Success, int Code, string? Erreur)> ConfirmEmailAsync(
        string token,
        CancellationToken ct);

    Task<(bool Success, int Code, string? Erreur)> ResendConfirmationEmailAsync(
        ResendConfirmationEmailRequestDto dto,
        CancellationToken ct);

    // Validation profil commerçant
    Task SendMerchantApprovedEmailAsync(
        string to,
        string? fullName = null);

    Task SendMerchantRejectedEmailAsync(
        string to,
        string reason,
        string? fullName = null);

    Task SendMerchantSubmissionReceivedEmailAsync(
        string to,
        string? fullName = null);

    Task SendMerchantEmailVerificationAsync(
        string to,
        string token,
        string? fullName,
        CancellationToken ct);

    // Validation commerce
    Task SendCommerceSubmissionReceivedEmailAsync(
        string to,
        string? fullName = null);

    Task SendCommerceApprovedEmailAsync(
        string to,
        string? fullName = null);

    Task SendCommerceRejectedEmailAsync(
        string to,
        string reason,
        string? fullName = null);
}