using BusinessService.DTOs;
using BusinessService.Mappers;
using BusinessService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BusinessService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TagsCulturelsController : ControllerBase
    {
        private readonly IServiceTagCulturel _service;

        public TagsCulturelsController(IServiceTagCulturel service)
        {
            _service = service;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> ObtenirTout()
        {
            var tagsCulturels = await _service.ObtenirToutAsync();
            var response = tagsCulturels.Select(TagCulturelMapper.ToResponse);
            return Ok(response);
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenirParId(Guid id)
        {
            var tagCulturel = await _service.ObtenirParIdAsync(id);

            if (tagCulturel == null)
                return NotFound();

            return Ok(TagCulturelMapper.ToResponse(tagCulturel));
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Creer([FromBody] CreerTagCulturelRequestDto dto)
        {
            var tagCulturel = TagCulturelMapper.ToEntity(dto);

            var (succes, erreur, resultat) = await _service.CreerAsync(tagCulturel);

            if (!succes)
                return BadRequest(erreur);

            return CreatedAtAction(
                nameof(ObtenirParId),
                new { id = resultat!.Id },
                TagCulturelMapper.ToResponse(resultat));
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Modifier(Guid id, [FromBody] ModifierTagCulturelRequestDto dto)
        {
            var tagExistant = await _service.ObtenirParIdAsync(id);

            if (tagExistant == null)
                return NotFound();

            TagCulturelMapper.ApplyUpdate(tagExistant, dto);

            var (succes, erreur) = await _service.ModifierAsync(id, tagExistant);

            if (erreur != null)
                return BadRequest(erreur);

            if (!succes)
                return NotFound();

            var resultat = await _service.ObtenirParIdAsync(id);

            if (resultat == null)
                return NotFound();

            return Ok(TagCulturelMapper.ToResponse(resultat));
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Supprimer(Guid id)
        {
            var succes = await _service.SupprimerAsync(id);

            if (!succes)
                return NotFound();

            return NoContent();
        }
    }
}