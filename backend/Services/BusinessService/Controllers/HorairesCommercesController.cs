using BusinessService.DTOs;
using BusinessService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BusinessService.Controllers
{
    [ApiController]
    [Route("api/commerces/{commerceId}/horaires")]
    public class HorairesCommercesController : ControllerBase
    {
        private readonly IServiceHoraireCommerce _service;

        public HorairesCommercesController(IServiceHoraireCommerce service)
        {
            _service = service;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> ObtenirTout(Guid commerceId)
        {
            var resultat = await _service.ObtenirParCommerceAsync(commerceId);
            return Ok(resultat);
        }

        [AllowAnonymous]
        [HttpGet("{horaireId}")]
        public async Task<IActionResult> ObtenirParId(Guid commerceId, Guid horaireId)
        {
            var resultat = await _service.ObtenirParIdAsync(commerceId, horaireId);

            if (resultat == null)
                return NotFound();

            return Ok(resultat);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Creer(Guid commerceId, [FromBody] CreerHoraireCommerceRequeteDto requete)
        {
            var utilisateurId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var resultat = await _service.CreerAsync(commerceId, utilisateurId, requete);

            return CreatedAtAction(
                nameof(ObtenirParId),
                new { commerceId = commerceId, horaireId = resultat.Id },
                resultat);
        }

        [Authorize]
        [HttpPut("{horaireId}")]
        public async Task<IActionResult> Modifier(
            Guid commerceId,
            Guid horaireId,
            [FromBody] ModifierHoraireCommerceRequeteDto requete)
        {
            var utilisateurId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var resultat = await _service.ModifierAsync(commerceId, horaireId, utilisateurId, requete);

            if (resultat == null)
                return NotFound();

            return Ok(resultat);
        }

        [Authorize]
        [HttpDelete("{horaireId}")]
        public async Task<IActionResult> Supprimer(Guid commerceId, Guid horaireId)
        {
            var utilisateurId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var succes = await _service.SupprimerAsync(commerceId, horaireId, utilisateurId);

            if (!succes)
                return NotFound();

            return NoContent();
        }
    }
}