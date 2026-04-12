using EventMatchService.Application.DTOs;
using EventMatchService.Domain.Models;
using EventMatchService.Infrastructure.ExternalDtos;

namespace EventMatchService.Application.Mappers;

public static class MatchMapper
{
    public static MatchItem ToDomain(
        FootballDataMatchDto dto,
        FootballDataCompetitionDto? competition,
        string fallbackCompetitionCode)
    {
        return new MatchItem
        {
            Id = dto.Id,
            CompetitionCode = competition?.Code ?? fallbackCompetitionCode,
            CompetitionName = competition?.Name ?? "World Cup",
            HomeTeam = dto.HomeTeam?.Name ?? "Unknown",
            AwayTeam = dto.AwayTeam?.Name ?? "Unknown",
            UtcDate = DateTime.TryParse(dto.UtcDate, out var parsedDate)
                ? parsedDate
                : DateTime.MinValue,
            Status = dto.Status ?? "UNKNOWN",
            Stage = dto.Stage ?? "UNKNOWN",
            MatchdayLabel = dto.Matchday.HasValue
                ? $"Matchday {dto.Matchday.Value}"
                : "N/A",
            HomeScore = dto.Score?.FullTime?.Home,
            AwayScore = dto.Score?.FullTime?.Away,

            // On garde ton comportement actuel pour ne rien casser
            Venue = dto.Area?.Name ?? string.Empty,

            City = null,
            StadiumName = null,
            Address = null,
            Latitude = null,
            Longitude = null,
            IsOfficialLocation = false,
            LocationSource = "api",
            IsExperienceMatch = false,
            FanZones = new List<FanZone>()
        };
    }

    public static MatchResponseDto ToResponse(MatchItem match)
    {
        return new MatchResponseDto
        {
            Id = match.Id,
            CompetitionCode = match.CompetitionCode,
            CompetitionName = match.CompetitionName,
            HomeTeam = match.HomeTeam,
            AwayTeam = match.AwayTeam,
            UtcDate = match.UtcDate,
            Status = match.Status,
            Stage = match.Stage,
            MatchdayLabel = match.MatchdayLabel,
            HomeScore = match.HomeScore,
            AwayScore = match.AwayScore,
            Venue = match.Venue,

            City = match.City,
            StadiumName = match.StadiumName,
            Address = match.Address,
            Latitude = match.Latitude,
            Longitude = match.Longitude,
            IsOfficialLocation = match.IsOfficialLocation,
            LocationSource = match.LocationSource,
            IsExperienceMatch = match.IsExperienceMatch,
            FanZones = match.FanZones
                .Select(fz => new FanZoneDto
                {
                    Name = fz.Name,
                    Address = fz.Address,
                    Latitude = fz.Latitude,
                    Longitude = fz.Longitude
                })
                .ToList()
        };
    }
}