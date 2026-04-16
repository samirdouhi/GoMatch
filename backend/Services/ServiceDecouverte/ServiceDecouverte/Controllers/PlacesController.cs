using Microsoft.AspNetCore.Mvc;
using ServiceDecouverte.Dtos;
using ServiceDecouverte.Services;

namespace ServiceDecouverte.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlacesController : ControllerBase
{
    private readonly IPlaceService _placeService;

    public PlacesController(IPlaceService placeService)
    {
        _placeService = placeService;
    }

    [HttpGet]
    public async Task<ActionResult<List<PlaceReadDto>>> GetAll()
    {
        var places = await _placeService.GetAllAsync();
        return Ok(places);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PlaceReadDto>> GetById(Guid id)
    {
        var place = await _placeService.GetByIdAsync(id);

        if (place is null)
            return NotFound(new { message = "Place introuvable." });

        return Ok(place);
    }

    [HttpPost]
    public async Task<ActionResult<PlaceReadDto>> Create([FromBody] PlaceCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nom))
            return BadRequest(new { message = "Le nom est obligatoire." });

        if (string.IsNullOrWhiteSpace(dto.Type))
            return BadRequest(new { message = "Le type est obligatoire." });

        var created = await _placeService.CreateAsync(dto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = created.Id },
            created
        );
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PlaceReadDto>> Update(Guid id, [FromBody] PlaceCreateDto dto)
    {
        var updated = await _placeService.UpdateAsync(id, dto);

        if (updated == null)
            return NotFound(new { message = "Place introuvable." });

        return Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var deleted = await _placeService.DeleteAsync(id);

        if (!deleted)
            return NotFound(new { message = "Place introuvable." });

        return NoContent();
    }

    [HttpGet("filter")]
    public async Task<ActionResult<List<PlaceReadDto>>> Filter(
        [FromQuery] string? type,
        [FromQuery] string? ville)
    {
        var results = await _placeService.FilterAsync(type, ville);
        return Ok(results);
    }
}