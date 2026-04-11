using EventMatchService.Domain.Models;

namespace EventMatchService.Application.Services;

public interface IWorldCupMatchService
{
    Task<IReadOnlyList<MatchItem>> GetWorldCupMatchesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MatchItem>> GetWorldCupMatchesByStatusAsync(string status, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MatchItem>> GetUpcomingWorldCupMatchesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MatchItem>> GetTodayWorldCupMatchesAsync(CancellationToken cancellationToken = default);
}