using EventMatchService.Domain.Models;

namespace EventMatchService.Infrastructure.Data;

public interface IMatchLocationOverrideProvider
{
    MatchLocationOverride? GetByMatchId(int matchId);
    IReadOnlyList<MatchLocationOverride> GetAll();
}