using System.Text.Json.Serialization;

namespace EventMatchService.Infrastructure.ExternalDtos;

public sealed class FootballDataFullTimeScoreDto
{
    [JsonPropertyName("home")]
    public int? Home { get; set; }

    [JsonPropertyName("away")]
    public int? Away { get; set; }
}