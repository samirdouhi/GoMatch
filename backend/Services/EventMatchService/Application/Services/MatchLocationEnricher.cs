using EventMatchService.Domain.Models;
using EventMatchService.Infrastructure.Data;

namespace EventMatchService.Application.Services;

public sealed class MatchLocationEnricher : IMatchLocationEnricher
{
    private readonly IMatchLocationOverrideProvider _overrideProvider;

    public MatchLocationEnricher(IMatchLocationOverrideProvider overrideProvider)
    {
        _overrideProvider = overrideProvider;
    }

    public MatchItem Enrich(MatchItem match)
    {
        var overrideItem = _overrideProvider.GetByMatchId(match.Id);

        if (overrideItem is null)
        {
            match.IsExperienceMatch = false;
            match.LocationSource = "api";
            return match;
        }

        match.City = overrideItem.City;
        match.StadiumName = overrideItem.StadiumName;
        match.Address = overrideItem.Address;
        match.Latitude = overrideItem.Latitude;
        match.Longitude = overrideItem.Longitude;
        match.IsOfficialLocation = overrideItem.IsOfficialLocation;
        match.LocationSource = overrideItem.LocationSource;
        match.IsExperienceMatch = true;
        match.FanZones = overrideItem.FanZones;

        return match;
    }

    public IReadOnlyList<MatchItem> EnrichMany(IEnumerable<MatchItem> matches)
        => matches.Select(Enrich).ToList();
}