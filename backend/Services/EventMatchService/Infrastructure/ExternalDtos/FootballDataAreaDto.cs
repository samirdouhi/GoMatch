using System.Text.Json.Serialization;

namespace EventMatchService.Infrastructure.ExternalDtos;

public sealed class FootballDataAreaDto
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }
}