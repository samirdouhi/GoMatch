using BusinessService.DTOs;
using BusinessService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BusinessService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommercesController : ControllerBase
    {
        private readonly IServiceCommerce _service;

        public CommercesController(IServiceCommerce service)
        {
            _service = service;
        }

        // ── Public : commerces validés seulement ──────────────────────────
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> ObtenirTout()
        {
            var commerces = await _service.ObtenirToutAsync();
            return Ok(commerces);
        }

        // ── Admin : tous les commerces ────────────────────────────────────
        [Authorize(Roles = "Admin")]
        [HttpGet("admin/all")]
        public async Task<IActionResult> ObtenirToutAdmin()
        {
            var commerces = await _service.ObtenirToutAdminAsync();
            return Ok(commerces);
        }

        // ── Admin : commerces en attente ──────────────────────────────────
        [Authorize(Roles = "Admin")]
        [HttpGet("admin/en-attente")]
        public async Task<IActionResult> ObtenirEnAttente()
        {
            var commerces = await _service.ObtenirEnAttenteAsync();
            return Ok(commerces);
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenirParId(Guid id)
        {
            var commerce = await _service.ObtenirParIdAsync(id);

            if (commerce == null)
                return NotFound();

            return Ok(commerce);
        }

        // ── Création : email extrait du JWT ───────────────────────────────
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Creer([FromBody] CreerCommerceRequeteDto requete)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var email  = User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;

            var resultat = await _service.CreerAsync(requete, userId, email);

            return CreatedAtAction(nameof(ObtenirParId), new { id = resultat.Id }, resultat);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Modifier(Guid id, [FromBody] ModifierCommerceRequeteDto requete)
        {
            var userId   = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var resultat = await _service.ModifierAsync(id, requete, userId);

            if (resultat == null)
                return NotFound();

            return Ok(resultat);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Supprimer(Guid id)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var succes = await _service.SupprimerAsync(id, userId);

            if (!succes)
                return NotFound();

            return NoContent();
        }

        [Authorize]
        [HttpPost("{commerceId}/tags")]
        public async Task<IActionResult> AjouterTags(Guid commerceId, [FromBody] List<Guid> tagIds)
        {
            var userId   = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var resultat = await _service.AjouterTagsAsync(commerceId, tagIds, userId);

            if (resultat == null)
                return NotFound("Commerce introuvable");

            return Ok(resultat);
        }

        [AllowAnonymous]
        [HttpGet("proches")]
        public async Task<IActionResult> ObtenirProches(
            [FromQuery] double latitude,
            [FromQuery] double longitude,
            [FromQuery] double rayonKm)
        {
            if (rayonKm <= 0)
                return BadRequest("Le rayon doit être supérieur à 0.");

            var resultat = await _service.ObtenirCommercesProchesAsync(latitude, longitude, rayonKm);
            return Ok(resultat);
        }

        [AllowAnonymous]
        [HttpGet("recherche")]
        public async Task<IActionResult> Rechercher(
            [FromQuery] string? nom,
            [FromQuery] string? categorie,
            [FromQuery] string? tag,
            [FromQuery] bool?   estValide)
        {
            if (nom == null && categorie == null && tag == null && estValide == null)
                return BadRequest("Au moins un filtre est requis.");

            var resultat = await _service.RechercherAsync(nom, categorie, tag, estValide);
            return Ok(resultat);
        }

        // ── Admin : valider ───────────────────────────────────────────────
        [Authorize(Roles = "Admin")]
        [HttpPatch("{id}/valider")]
        public async Task<IActionResult> Valider(Guid id, CancellationToken ct)
        {
            var resultat = await _service.ValiderAsync(id, ct);

            if (resultat == null)
                return NotFound();

            return Ok(resultat);
        }

        // ── Admin : rejeter (avec raison) ─────────────────────────────────
        [Authorize(Roles = "Admin")]
        [HttpPatch("{id}/rejeter")]
        public async Task<IActionResult> Rejeter(
            Guid id,
            [FromBody] RejeterCommerceRequeteDto? requete,
            CancellationToken ct)
        {
            var raison   = requete?.Raison ?? string.Empty;
            var resultat = await _service.RejeterAsync(id, raison, ct);

            if (resultat == null)
                return NotFound();

            return Ok(resultat);
        }

        // ── Commerçant : mon commerce ─────────────────────────────────────
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> ObtenirMonCommerce()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Utilisateur non authentifié." });

            var utilisateurId = Guid.Parse(userIdClaim);
            var commerce      = await _service.ObtenirMonCommerceAsync(utilisateurId);

            if (commerce == null)
                return NotFound(new { message = "Aucun commerce associé à cet utilisateur." });

            return Ok(commerce);
        }
    }
}
