using BusinessService.DTOs;
using BusinessService.Mappers;
using BusinessService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BusinessService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly IServiceCategorie _service;

        public CategoriesController(IServiceCategorie service)
        {
            _service = service;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> ObtenirTout()
        {
            var categories = await _service.ObtenirToutAsync();
            var response = categories.Select(CategorieMapper.ToResponse);
            return Ok(response);
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenirParId(Guid id)
        {
            var categorie = await _service.ObtenirParIdAsync(id);

            if (categorie == null)
                return NotFound();

            return Ok(CategorieMapper.ToResponse(categorie));
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Creer([FromBody] CreerCategorieRequestDto dto)
        {
            var categorie = CategorieMapper.ToEntity(dto);

            var (succes, erreur, resultat) = await _service.CreerAsync(categorie);

            if (!succes)
                return BadRequest(erreur);

            return CreatedAtAction(
                nameof(ObtenirParId),
                new { id = resultat!.Id },
                CategorieMapper.ToResponse(resultat));
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Modifier(Guid id, [FromBody] ModifierCategorieRequestDto dto)
        {
            var categorieExistante = await _service.ObtenirParIdAsync(id);

            if (categorieExistante == null)
                return NotFound();

            CategorieMapper.ApplyUpdate(categorieExistante, dto);

            var resultat = await _service.ModifierAsync(id, categorieExistante);

            if (resultat == null)
                return NotFound();

            return Ok(CategorieMapper.ToResponse(resultat));
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Supprimer(Guid id)
        {
            var (succes, erreur) = await _service.SupprimerAsync(id);

            if (erreur != null)
                return BadRequest(erreur);

            if (!succes)
                return NotFound();

            return NoContent();
        }
    }
}