namespace EventMatchService.Infrastructure.Options;

public sealed class FootballDataOptions
{
    public const string SectionName = "FootballData";

    public string BaseUrl { get; set; } = "https://api.football-data.org/v4/";
    public string ApiKey { get; set; } = string.Empty;
    public string CompetitionCode { get; set; } = "WC";
    public int SeasonYear { get; set; } = 2026;
    public int CacheMinutes { get; set; } = 5;
}