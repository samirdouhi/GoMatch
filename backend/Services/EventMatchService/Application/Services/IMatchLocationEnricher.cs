using EventMatchService.Domain.Models;

namespace EventMatchService.Application.Services;

public interface IMatchLocationEnricher
{
    MatchItem Enrich(MatchItem match);
    IReadOnlyList<MatchItem> EnrichMany(IEnumerable<MatchItem> matches);
}