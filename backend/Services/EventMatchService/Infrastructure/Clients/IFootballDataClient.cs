using EventMatchService.Infrastructure.ExternalDtos;

namespace EventMatchService.Infrastructure.Clients;

public interface IFootballDataClient
{
    Task<FootballDataCompetitionMatchesResponse> GetCompetitionMatchesAsync(
        string competitionCode,
        int seasonYear,
        CancellationToken cancellationToken = default);
}