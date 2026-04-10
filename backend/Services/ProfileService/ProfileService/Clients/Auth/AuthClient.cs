using System.Net.Http;
using Microsoft.Extensions.Configuration;

namespace ProfileService.Clients.Auth;

public sealed class AuthClient : IAuthClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public AuthClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<bool> GrantMerchantRoleAsync(Guid userId, CancellationToken ct)
    {
        var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/auth/users/{userId}/grant-merchant-role"
        );

        var apiKey = _configuration["InternalApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("InternalApiKey is not configured in ProfileService.");

        request.Headers.Add("X-Internal-Api-Key", apiKey);

        var response = await _httpClient.SendAsync(request, ct);

        return response.IsSuccessStatusCode;
    }
}