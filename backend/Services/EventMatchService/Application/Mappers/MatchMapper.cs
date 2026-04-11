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
            HomeCrest = dto.HomeTeam?.Crest ?? string.Empty,
            AwayCrest = dto.AwayTeam?.Crest ?? string.Empty,
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
            Venue = dto.Area?.Name ?? string.Empty
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
            HomeCrest = match.HomeCrest,
            AwayCrest = match.AwayCrest,
            UtcDate = match.UtcDate,
            Status = match.Status,
            Stage = match.Stage,
            MatchdayLabel = match.MatchdayLabel,
            HomeScore = match.HomeScore,
            AwayScore = match.AwayScore,
            Venue = match.Venue
        };
    }
}