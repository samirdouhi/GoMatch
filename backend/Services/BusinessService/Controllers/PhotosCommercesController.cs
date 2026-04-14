using BusinessService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BusinessService.Controllers
{
    [ApiController]
    [Route("api/commerces/{commerceId}/photos")]
    public class PhotosCommercesController : ControllerBase
    {
        private readonly IServicePhotoCommerce _service;

        public PhotosCommercesController(IServicePhotoCommerce service)
        {
            _service = service;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> ObtenirTout(Guid commerceId)
        {
            var photos = await _service.ObtenirParCommerceAsync(commerceId);
            return Ok(photos);
        }

        [AllowAnonymous]
        [HttpGet("{photoId}/image")]
        public async Task<IActionResult> TelechargerImage(Guid commerceId, Guid photoId)
        {
            var result = await _service.TelechargerAsync(photoId);
            if (result == null) return NotFound();

            var (contenu, typeContenu, _) = result.Value;
            Response.Headers.Append("Cache-Control", "public, max-age=86400");
            return File(contenu, typeContenu);
        }

        [Authorize]
        [HttpPost]
        [RequestSizeLimit(11 * 1024 * 1024)]
        public async Task<IActionResult> Ajouter(Guid commerceId, IFormFile fichier)
        {
            if (fichier == null || fichier.Length == 0)
                return BadRequest(new { message = "Aucun fichier fourni." });

            var utilisateurId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _service.AjouterAsync(commerceId, utilisateurId, fichier);

            if (result == null)
                return BadRequest(new { message = "Impossible d'ajouter la photo. Vérifiez : commerce valide, format accepté (jpg/png/webp), taille ≤ 10 Mo, maximum 10 photos." });

            return CreatedAtAction(nameof(ObtenirTout), new { commerceId }, result);
        }

        [Authorize]
        [HttpDelete("{photoId}")]
        public async Task<IActionResult> Supprimer(Guid commerceId, Guid photoId)
        {
            var utilisateurId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var succes = await _service.SupprimerAsync(commerceId, photoId, utilisateurId);

            if (!succes) return NotFound();
            return NoContent();
        }
    }
}
