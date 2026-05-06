using CultureService.DTOs.CategorieCulturelle;
using CultureService.Mappers;
using CultureService.Repositories;

namespace CultureService.Services;

public class ServiceCategorieCulturelle : IServiceCategorieCulturelle
{
    private readonly ICategorieCulturelleRepository _repo;

    public ServiceCategorieCulturelle(ICategorieCulturelleRepository repo) => _repo = repo;

    public async Task<IEnumerable<CategorieCulturelleReponseDto>> ObtenirToutAsync()
    {
        var cats = await _repo.ObtenirToutAsync();
        return cats.Select(CategorieCulturelleMapper.ToResponse);
    }

    public async Task<CategorieCulturelleReponseDto?> ObtenirParIdAsync(Guid id)
    {
        var cat = await _repo.ObtenirParIdAsync(id);
        return cat == null ? null : CategorieCulturelleMapper.ToResponse(cat);
    }

    public async Task<CategorieCulturelleReponseDto> CreerAsync(CreerCategorieCulturelleRequeteDto dto)
    {
        var cat = CategorieCulturelleMapper.ToEntity(dto);
        await _repo.AjouterAsync(cat);
        await _repo.SauvegarderAsync();
        return CategorieCulturelleMapper.ToResponse(cat);
    }

    public async Task<CategorieCulturelleReponseDto?> ModifierAsync(Guid id, ModifierCategorieCulturelleRequeteDto dto)
    {
        var cat = await _repo.ObtenirParIdAsync(id);
        if (cat == null) return null;
        CategorieCulturelleMapper.ApplyUpdate(cat, dto);
        await _repo.MettreAJourAsync(cat);
        await _repo.SauvegarderAsync();
        return CategorieCulturelleMapper.ToResponse(cat);
    }

    public async Task<bool> SupprimerAsync(Guid id)
    {
        var cat = await _repo.ObtenirParIdAsync(id);
        if (cat == null) return false;
        await _repo.SupprimerAsync(cat);
        await _repo.SauvegarderAsync();
        return true;
    }
}
