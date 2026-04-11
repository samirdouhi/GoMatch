using EventMatchService.Application.DTOs;
using EventMatchService.Application.Mappers;
using EventMatchService.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace EventMatchService.Controllers;

[ApiController]
[Route("api/matches")]
public sealed class MatchesController : ControllerBase
{
    private readonly IWorldCupMatchService _worldCupMatchService;

    public MatchesController(IWorldCupMatchService worldCupMatchService)
    {
        _worldCupMatchService = worldCupMatchService;
    }

    [HttpGet("world-cup")]
    [ProducesResponseType(typeof(IEnumerable<MatchResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MatchResponseDto>>> GetWorldCupMatches(
        CancellationToken cancellationToken)
    {
        var matches = await _worldCupMatchService.GetWorldCupMatchesAsync(cancellationToken);
        return Ok(matches.Select(MatchMapper.ToResponse));
    }

    [HttpGet("world-cup/status/{status}")]
    [ProducesResponseType(typeof(IEnumerable<MatchResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MatchResponseDto>>> GetWorldCupMatchesByStatus(
        string status,
        CancellationToken cancellationToken)
    {
        var matches = await _worldCupMatchService.GetWorldCupMatchesByStatusAsync(
            status,
            cancellationToken);

        return Ok(matches.Select(MatchMapper.ToResponse));
    }

    [HttpGet("world-cup/upcoming")]
    [ProducesResponseType(typeof(IEnumerable<MatchResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MatchResponseDto>>> GetUpcomingWorldCupMatches(
        CancellationToken cancellationToken)
    {
        var matches = await _worldCupMatchService.GetUpcomingWorldCupMatchesAsync(cancellationToken);
        return Ok(matches.Select(MatchMapper.ToResponse));
    }

    [HttpGet("world-cup/today")]
    [ProducesResponseType(typeof(IEnumerable<MatchResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MatchResponseDto>>> GetTodayWorldCupMatches(
        CancellationToken cancellationToken)
    {
        var matches = await _worldCupMatchService.GetTodayWorldCupMatchesAsync(cancellationToken);
        return Ok(matches.Select(MatchMapper.ToResponse));
    }
}