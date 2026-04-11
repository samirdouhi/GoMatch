using System.Net;
using System.Net.Http.Json;
using EventMatchService.Common.Exceptions;
using EventMatchService.Infrastructure.ExternalDtos;
using Microsoft.AspNetCore.Http;

namespace EventMatchService.Infrastructure.Clients;

public sealed class FootballDataClient : IFootballDataClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<FootballDataClient> _logger;

    public FootballDataClient(HttpClient httpClient, ILogger<FootballDataClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<FootballDataCompetitionMatchesResponse> GetCompetitionMatchesAsync(
        string competitionCode,
        int seasonYear,
        CancellationToken cancellationToken = default)
    {
        var requestUri = $"competitions/{competitionCode}/matches?season={seasonYear}";

        _logger.LogInformation(
            "Calling football-data.org for competition {CompetitionCode}, season {SeasonYear}",
            competitionCode,
            seasonYear);

        using var response = await _httpClient.GetAsync(requestUri, cancellationToken);

        if (response.StatusCode == HttpStatusCode.TooManyRequests)
        {
            throw new ExternalApiException(
                "La limite de requêtes du provider externe a été atteinte.",
                StatusCodes.Status429TooManyRequests);
        }

        if (response.StatusCode == HttpStatusCode.Unauthorized)
        {
            throw new ExternalApiException(
                "Clé API invalide ou manquante.",
                StatusCodes.Status401Unauthorized);
        }

        if (!response.IsSuccessStatusCode)
        {
            var rawBody = await response.Content.ReadAsStringAsync(cancellationToken);

            _logger.LogError(
                "football-data.org returned status {StatusCode}. Body: {Body}",
                (int)response.StatusCode,
                rawBody);

            throw new ExternalApiException(
                "Erreur lors de l'appel à football-data.org.",
                (int)response.StatusCode);
        }

        var payload = await response.Content.ReadFromJsonAsync<FootballDataCompetitionMatchesResponse>(
            cancellationToken: cancellationToken);

        if (payload is null)
        {
            throw new ExternalApiException(
                "Réponse vide ou invalide reçue depuis l'API externe.",
                StatusCodes.Status502BadGateway);
        }

        return payload;
    }
}