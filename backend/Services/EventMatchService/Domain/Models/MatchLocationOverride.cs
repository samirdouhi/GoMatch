namespace EventMatchService.Domain.Models;

public sealed class MatchLocationOverride
{
    public int MatchId { get; set; }
    public string City { get; set; } = string.Empty;
    public string StadiumName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public bool IsOfficialLocation { get; set; }
    public string LocationSource { get; set; } = "gomatch_override";

    public List<FanZone> FanZones { get; set; } = new();
}