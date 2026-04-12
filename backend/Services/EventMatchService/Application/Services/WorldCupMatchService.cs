using EventMatchService.Application.Mappers;
using EventMatchService.Domain.Models;
using EventMatchService.Infrastructure.Clients;
using EventMatchService.Infrastructure.Options;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace EventMatchService.Application.Services;

public sealed class WorldCupMatchService : IWorldCupMatchService
{
    private readonly IFootballDataClient _footballDataClient;
    private readonly FootballDataOptions _options;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<WorldCupMatchService> _logger;
    private readonly IMatchLocationEnricher _matchLocationEnricher;

    public WorldCupMatchService(
        IFootballDataClient footballDataClient,
        IOptions<FootballDataOptions> options,
        IMemoryCache memoryCache,
        ILogger<WorldCupMatchService> logger,
        IMatchLocationEnricher matchLocationEnricher)
    {
        _footballDataClient = footballDataClient;
        _options = options.Value;
        _memoryCache = memoryCache;
        _logger = logger;
        _matchLocationEnricher = matchLocationEnricher;
    }

    public async Task<IReadOnlyList<MatchItem>> GetWorldCupMatchesAsync(
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"worldcup_matches_{_options.SeasonYear}";

        var cachedMatches = await _memoryCache.GetOrCreateAsync<IReadOnlyList<MatchItem>>(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_options.CacheMinutes);

            _logger.LogInformation("Cache miss for key {CacheKey}", cacheKey);

            var response = await _footballDataClient.GetCompetitionMatchesAsync(
                _options.CompetitionCode,
                _options.SeasonYear,
                cancellationToken);

            var rawMatches = response.Matches
                .Select(match => MatchMapper.ToDomain(
                    match,
                    response.Competition,
                    _options.CompetitionCode))
                .OrderBy(match => match.UtcDate)
                .ToList();

            var enrichedMatches = _matchLocationEnricher.EnrichMany(rawMatches)
                .OrderBy(match => match.UtcDate)
                .ToList();

            return enrichedMatches;
        });

        return cachedMatches ?? Array.Empty<MatchItem>();
    }

    public async Task<IReadOnlyList<MatchItem>> GetWorldCupMatchesByStatusAsync(
        string status,
        CancellationToken cancellationToken = default)
    {
        var matches = await GetWorldCupMatchesAsync(cancellationToken);

        return matches
            .Where(match => string.Equals(
                match.Status,
                status,
                StringComparison.OrdinalIgnoreCase))
            .OrderBy(match => match.UtcDate)
            .ToList()
            .AsReadOnly();
    }

    public async Task<IReadOnlyList<MatchItem>> GetUpcomingWorldCupMatchesAsync(
        CancellationToken cancellationToken = default)
    {
        var matches = await GetWorldCupMatchesAsync(cancellationToken);

        return matches
            .Where(match => match.UtcDate > DateTime.UtcNow)
            .OrderBy(match => match.UtcDate)
            .ToList()
            .AsReadOnly();
    }

    public async Task<IReadOnlyList<MatchItem>> GetTodayWorldCupMatchesAsync(
        CancellationToken cancellationToken = default)
    {
        var matches = await GetWorldCupMatchesAsync(cancellationToken);
        var todayUtc = DateTime.UtcNow.Date;

        return matches
            .Where(match => match.UtcDate.Date == todayUtc)
            .OrderBy(match => match.UtcDate)
            .ToList()
            .AsReadOnly();
    }
}