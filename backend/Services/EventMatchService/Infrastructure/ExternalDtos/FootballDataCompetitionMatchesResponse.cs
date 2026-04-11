using System.Text.Json.Serialization;

namespace EventMatchService.Infrastructure.ExternalDtos;

public sealed class FootballDataCompetitionMatchesResponse
{
    [JsonPropertyName("competition")]
    public FootballDataCompetitionDto? Competition { get; set; }

    [JsonPropertyName("matches")]
    public List<FootballDataMatchDto> Matches { get; set; } = new();
}