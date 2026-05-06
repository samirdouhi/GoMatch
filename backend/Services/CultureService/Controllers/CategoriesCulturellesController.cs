using CultureService.DTOs.CategorieCulturelle;
using CultureService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CultureService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesCulturellesController : ControllerBase
{
    private readonly IServiceCategorieCulturelle _service;

    public CategoriesCulturellesController(IServiceCategorieCulturelle service) => _service = service;

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> ObtenirTout()
    {
        var cats = await _service.ObtenirToutAsync();
        return Ok(cats);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenirParId(Guid id)
    {
        var cat = await _service.ObtenirParIdAsync(id);
        return cat == null ? NotFound() : Ok(cat);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Creer([FromBody] CreerCategorieCulturelleRequeteDto dto)
    {
        var resultat = await _service.CreerAsync(dto);
        return CreatedAtAction(nameof(ObtenirParId), new { id = resultat.Id }, resultat);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Modifier(Guid id, [FromBody] ModifierCategorieCulturelleRequeteDto dto)
    {
        var resultat = await _service.ModifierAsync(id, dto);
        return resultat == null ? NotFound() : Ok(resultat);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Supprimer(Guid id)
    {
        var succes = await _service.SupprimerAsync(id);
        return succes ? NoContent() : NotFound();
    }
}
