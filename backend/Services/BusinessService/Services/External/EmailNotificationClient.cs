using System.Net.Http.Json;

namespace BusinessService.Services.External
{
    public sealed class EmailNotificationClient : IEmailNotificationClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<EmailNotificationClient> _logger;

        public EmailNotificationClient(HttpClient httpClient, ILogger<EmailNotificationClient> logger)
        {
            _httpClient = httpClient;
            _logger     = logger;
        }

        public async Task SendSubmissionReceivedAsync(string to, string? fullName, CancellationToken ct = default)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync(
                    "/email/merchant-submission-received",
                    new { to, fullName },
                    ct);

                if (!response.IsSuccessStatusCode)
                    _logger.LogWarning("Email submission-received failed for {Email}: {Status}", to, response.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send submission-received email to {Email}", to);
            }
        }

        public async Task SendApprovedAsync(string to, string? fullName, CancellationToken ct = default)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync(
                    "/email/merchant-approved",
                    new { to, fullName },
                    ct);

                if (!response.IsSuccessStatusCode)
                    _logger.LogWarning("Email merchant-approved failed for {Email}: {Status}", to, response.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send approved email to {Email}", to);
            }
        }

        public async Task SendRejectedAsync(string to, string reason, string? fullName, CancellationToken ct = default)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync(
                    "/email/merchant-rejected",
                    new { to, reason, fullName },
                    ct);

                if (!response.IsSuccessStatusCode)
                    _logger.LogWarning("Email merchant-rejected failed for {Email}: {Status}", to, response.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send rejected email to {Email}", to);
            }
        }
    }
}
