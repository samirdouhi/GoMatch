using System.Net.Http.Json;

namespace ProfileService.Services.External;

public sealed class EmailClient : IEmailClient
{
    private readonly HttpClient _httpClient;

    public EmailClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task SendMerchantApprovedEmailAsync(string to, string? fullName, CancellationToken ct)
    {
        var response = await _httpClient.PostAsJsonAsync(
            "/email/merchant-approved",
            new
            {
                to,
                fullName
            },
            ct);

        response.EnsureSuccessStatusCode();
    }

    public async Task SendMerchantRejectedEmailAsync(string to, string reason, string? fullName, CancellationToken ct)
    {
        var response = await _httpClient.PostAsJsonAsync(
            "/email/merchant-rejected",
            new
            {
                to,
                reason,
                fullName
            },
            ct);

        response.EnsureSuccessStatusCode();
    }
    public async Task SendMerchantSubmissionReceivedEmailAsync(
    string to,
    string? fullName,
    CancellationToken ct)
    {
        var response = await _httpClient.PostAsJsonAsync(
            "/email/merchant-submission-received",
            new
            {
                to,
                fullName
            },
            ct);

        response.EnsureSuccessStatusCode();
    }
    public async Task SendMerchantEmailVerificationAsync(
    string to,
    string token,
    string? fullName,
    CancellationToken ct)
    {
        var response = await _httpClient.PostAsJsonAsync(
            "/email/merchant-email-verification",
            new
            {
                to,
                token,
                fullName
            },
            ct);

        response.EnsureSuccessStatusCode();
    }
}