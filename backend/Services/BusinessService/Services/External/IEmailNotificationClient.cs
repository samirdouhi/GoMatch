namespace BusinessService.Services.External
{
    public interface IEmailNotificationClient
    {
        Task SendSubmissionReceivedAsync(string to, string? fullName, CancellationToken ct = default);
        Task SendApprovedAsync(string to, string? fullName, CancellationToken ct = default);
        Task SendRejectedAsync(string to, string reason, string? fullName, CancellationToken ct = default);
    }
}
