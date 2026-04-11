using System.Text.Json.Serialization;

namespace EventMatchService.Infrastructure.ExternalDtos;

public sealed class FootballDataScoreDto
{
    [JsonPropertyName("fullTime")]
    public FootballDataFullTimeScoreDto? FullTime { get; set; }
}