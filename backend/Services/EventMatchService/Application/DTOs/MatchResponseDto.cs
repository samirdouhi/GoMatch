namespace EventMatchService.Application.DTOs;

public sealed class MatchResponseDto
{
    public int Id { get; set; }
    public string CompetitionCode { get; set; } = string.Empty;
    public string CompetitionName { get; set; } = string.Empty;

    public string HomeTeam { get; set; } = string.Empty;
    public string AwayTeam { get; set; } = string.Empty;

    public DateTime UtcDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Stage { get; set; } = string.Empty;
    public string MatchdayLabel { get; set; } = string.Empty;

    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }

    public string Venue { get; set; } = string.Empty;

    public string? City { get; set; }
    public string? StadiumName { get; set; }
    public string? Address { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public bool IsOfficialLocation { get; set; }
    public string LocationSource { get; set; } = "api";
    public bool IsExperienceMatch { get; set; }

    public List<FanZoneDto> FanZones { get; set; } = new();
}