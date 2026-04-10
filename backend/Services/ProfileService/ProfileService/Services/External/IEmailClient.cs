namespace ProfileService.Services.External;

public interface IEmailClient
{
    Task SendMerchantApprovedEmailAsync(string to, string? fullName, CancellationToken ct);
    Task SendMerchantRejectedEmailAsync(string to, string reason, string? fullName, CancellationToken ct);
    Task SendMerchantSubmissionReceivedEmailAsync(
    string to,
    string? fullName,
    CancellationToken ct);
    Task SendMerchantEmailVerificationAsync(
    string to,
    string token,
    string? fullName,
    CancellationToken ct);
}