using BusinessService.DTOs;
using BusinessService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BusinessService.Controllers
{
    [ApiController]
    [Route("api/commerces/{commerceId:guid}/avis")]
    public class AvisController : ControllerBase
    {
        private readonly IServiceAvis _service;

        public AvisController(IServiceAvis service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AvisReponseDto>>> GetAvis(Guid commerceId)
        {
            var avis = await _service.ObtenirParCommerceAsync(commerceId);
            return Ok(avis);
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<AvisReponseDto>> PostAvis(
            Guid commerceId,
            [FromBody] CreerAvisRequeteDto requete)
        {
            var utilisateurIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(utilisateurIdStr, out var utilisateurId))
                return Unauthorized();

            var email = User.FindFirstValue(ClaimTypes.Email)
                     ?? User.FindFirstValue("email")
                     ?? string.Empty;

            try
            {
                var avis = await _service.AjouterAvisAsync(commerceId, requete, utilisateurId, email);
                return CreatedAtAction(nameof(GetAvis), new { commerceId }, avis);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
