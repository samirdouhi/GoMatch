namespace BusinessService.Services.External
{
    public interface IEmailNotificationClient
    {
        Task SendCommerceSubmissionReceivedAsync(
            string to,
            string? fullName,
            CancellationToken ct = default);

        Task SendCommerceApprovedAsync(
            string to,
            string? fullName,
            CancellationToken ct = default);

        Task SendCommerceRejectedAsync(
            string to,
            string reason,
            string? fullName,
            CancellationToken ct = default);
    }
}