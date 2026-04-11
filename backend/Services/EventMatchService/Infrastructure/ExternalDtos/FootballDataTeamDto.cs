using System.Text.Json.Serialization;

namespace EventMatchService.Infrastructure.ExternalDtos;

public sealed class FootballDataTeamDto
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("shortName")]
    public string? ShortName { get; set; }

    [JsonPropertyName("tla")]
    public string? Tla { get; set; }

    [JsonPropertyName("crest")]
    public string? Crest { get; set; }
}