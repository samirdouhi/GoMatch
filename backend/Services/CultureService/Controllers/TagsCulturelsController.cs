using CultureService.DTOs.TagCulturel;
using CultureService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CultureService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TagsCulturelsController : ControllerBase
{
    private readonly IServiceTagCulturel _service;

    public TagsCulturelsController(IServiceTagCulturel service) => _service = service;

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> ObtenirTout()
    {
        var tags = await _service.ObtenirToutAsync();
        return Ok(tags);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenirParId(Guid id)
    {
        var tag = await _service.ObtenirParIdAsync(id);
        return tag == null ? NotFound() : Ok(tag);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Creer([FromBody] CreerTagCulturelRequeteDto dto)
    {
        var resultat = await _service.CreerAsync(dto);
        return CreatedAtAction(nameof(ObtenirParId), new { id = resultat.Id }, resultat);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Modifier(Guid id, [FromBody] ModifierTagCulturelRequeteDto dto)
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
