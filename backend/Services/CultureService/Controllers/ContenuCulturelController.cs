using CultureService.DTOs.ContenuCulturel;
using CultureService.DTOs.Media;
using CultureService.DTOs.Traduction;
using CultureService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CultureService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContenuCulturelController : ControllerBase
{
    private readonly IServiceContenuCulturel _service;
    private readonly ILogger<ContenuCulturelController> _logger;

    public ContenuCulturelController(IServiceContenuCulturel service, ILogger<ContenuCulturelController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>Public - retourne uniquement les contenus publiés</summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> ObtenirTout()
    {
        var contenus = await _service.ObtenirToutPubliesAsync();
        return Ok(contenus);
    }

    /// <summary>Admin - retourne tous les contenus peu importe le statut</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("admin/all")]
    public async Task<IActionResult> ObtenirToutAdmin()
    {
        var contenus = await _service.ObtenirToutAdminAsync();
        return Ok(contenus);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenirParId(Guid id)
    {
        var contenu = await _service.ObtenirParIdAsync(id);
        return contenu == null ? NotFound() : Ok(contenu);
    }

    /// <summary>Recherche par titre, catégorie, tag ou langue</summary>
    [AllowAnonymous]
    [HttpGet("recherche")]
    public async Task<IActionResult> Rechercher(
        [FromQuery] string? titre,
        [FromQuery] Guid? categorieId,
        [FromQuery] string? tag,
        [FromQuery] string? langue)
    {
        var resultat = await _service.RechercherAsync(titre, categorieId, tag, langue);
        return Ok(resultat);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Creer([FromBody] CreerContenuCulturelRequeteDto dto)
    {
        var auteurId = ObtenirAuteurId();
        if (auteurId == null)
            return Unauthorized(new { message = "Identifiant utilisateur introuvable dans le token." });

        var resultat = await _service.CreerAsync(dto, auteurId.Value);
        return CreatedAtAction(nameof(ObtenirParId), new { id = resultat.Id }, resultat);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Modifier(Guid id, [FromBody] ModifierContenuCulturelRequeteDto dto)
    {
        var auteurId = ObtenirAuteurId();
        if (auteurId == null)
            return Unauthorized(new { message = "Identifiant utilisateur introuvable dans le token." });

        var resultat = await _service.ModifierAsync(id, dto, auteurId.Value);
        return resultat == null ? NotFound() : Ok(resultat);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Supprimer(Guid id)
    {
        var succes = await _service.SupprimerAsync(id);
        return succes ? NoContent() : NotFound();
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/publier")]
    public async Task<IActionResult> Publier(Guid id)
    {
        var resultat = await _service.PublierAsync(id);
        return resultat == null ? NotFound() : Ok(resultat);
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/depublier")]
    public async Task<IActionResult> Depublier(Guid id)
    {
        var resultat = await _service.DepublierAsync(id);
        return resultat == null ? NotFound() : Ok(resultat);
    }

    // ---- Médias ----
    [Authorize(Roles = "Admin")]
    [HttpPost("{id:guid}/medias")]
    public async Task<IActionResult> AjouterMedia(Guid id, [FromBody] AjouterMediaRequeteDto dto)
    {
        var media = await _service.AjouterMediaAsync(id, dto);
        return media == null ? NotFound() : Ok(media);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}/medias/{mediaId:guid}")]
    public async Task<IActionResult> SupprimerMedia(Guid id, Guid mediaId)
    {
        var succes = await _service.SupprimerMediaAsync(id, mediaId);
        return succes ? NoContent() : NotFound();
    }

    // ---- Traductions ----
    [Authorize(Roles = "Admin")]
    [HttpPost("{id:guid}/traductions")]
    public async Task<IActionResult> AjouterTraduction(Guid id, [FromBody] CreerTraductionRequeteDto dto)
    {
        var trad = await _service.AjouterTraductionAsync(id, dto);
        return trad == null ? NotFound() : Ok(trad);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}/traductions/{traductionId:guid}")]
    public async Task<IActionResult> SupprimerTraduction(Guid id, Guid traductionId)
    {
        var succes = await _service.SupprimerTraductionAsync(id, traductionId);
        return succes ? NoContent() : NotFound();
    }

    private Guid? ObtenirAuteurId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? User.FindFirstValue("sub")
                 ?? User.FindFirstValue("userId");
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}
