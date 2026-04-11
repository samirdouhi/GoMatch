using System.Net.Http.Json;

namespace BusinessService.Services.External
{
    public sealed class EmailNotificationClient : IEmailNotificationClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<EmailNotificationClient> _logger;

        public EmailNotificationClient(
            HttpClient httpClient,
            ILogger<EmailNotificationClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task SendCommerceSubmissionReceivedAsync(
            string to,
            string? fullName,
            CancellationToken ct = default)
        {
            var response = await _httpClient.PostAsJsonAsync(
                "/email/commerce-submission-received",
                new { to, fullName },
                ct);

            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "commerce-submission-received failed for {Email}: {Status} - {Body}",
                    to,
                    response.StatusCode,
                    body);

                throw new InvalidOperationException(
                    $"Échec envoi email commerce-submission-received: {(int)response.StatusCode} - {body}");
            }

            _logger.LogInformation(
                "commerce-submission-received sent successfully to {Email}",
                to);
        }

        public async Task SendCommerceApprovedAsync(
            string to,
            string? fullName,
            CancellationToken ct = default)
        {
            var response = await _httpClient.PostAsJsonAsync(
                "/email/commerce-approved",
                new { to, fullName },
                ct);

            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "commerce-approved failed for {Email}: {Status} - {Body}",
                    to,
                    response.StatusCode,
                    body);

                throw new InvalidOperationException(
                    $"Échec envoi email commerce-approved: {(int)response.StatusCode} - {body}");
            }

            _logger.LogInformation(
                "commerce-approved sent successfully to {Email}",
                to);
        }

        public async Task SendCommerceRejectedAsync(
            string to,
            string reason,
            string? fullName,
            CancellationToken ct = default)
        {
            var response = await _httpClient.PostAsJsonAsync(
                "/email/commerce-rejected",
                new { to, reason, fullName },
                ct);

            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "commerce-rejected failed for {Email}: {Status} - {Body}",
                    to,
                    response.StatusCode,
                    body);

                throw new InvalidOperationException(
                    $"Échec envoi email commerce-rejected: {(int)response.StatusCode} - {body}");
            }

            _logger.LogInformation(
                "commerce-rejected sent successfully to {Email}",
                to);
        }
    }
}