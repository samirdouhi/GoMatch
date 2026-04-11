using System.Text.Json.Serialization;

namespace EventMatchService.Infrastructure.ExternalDtos;

public sealed class FootballDataMatchDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("utcDate")]
    public string? UtcDate { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("stage")]
    public string? Stage { get; set; }

    [JsonPropertyName("matchday")]
    public int? Matchday { get; set; }

    [JsonPropertyName("homeTeam")]
    public FootballDataTeamDto? HomeTeam { get; set; }

    [JsonPropertyName("awayTeam")]
    public FootballDataTeamDto? AwayTeam { get; set; }

    [JsonPropertyName("score")]
    public FootballDataScoreDto? Score { get; set; }

    [JsonPropertyName("area")]
    public FootballDataAreaDto? Area { get; set; }
}