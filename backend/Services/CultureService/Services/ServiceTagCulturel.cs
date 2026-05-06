using CultureService.DTOs.TagCulturel;
using CultureService.Mappers;
using CultureService.Repositories;

namespace CultureService.Services;

public class ServiceTagCulturel : IServiceTagCulturel
{
    private readonly ITagCulturelRepository _repo;

    public ServiceTagCulturel(ITagCulturelRepository repo) => _repo = repo;

    public async Task<IEnumerable<TagCulturelReponseDto>> ObtenirToutAsync()
    {
        var tags = await _repo.ObtenirToutAsync();
        return tags.Select(TagCulturelMapper.ToResponse);
    }

    public async Task<TagCulturelReponseDto?> ObtenirParIdAsync(Guid id)
    {
        var tag = await _repo.ObtenirParIdAsync(id);
        return tag == null ? null : TagCulturelMapper.ToResponse(tag);
    }

    public async Task<TagCulturelReponseDto> CreerAsync(CreerTagCulturelRequeteDto dto)
    {
        var tag = TagCulturelMapper.ToEntity(dto);
        await _repo.AjouterAsync(tag);
        await _repo.SauvegarderAsync();
        return TagCulturelMapper.ToResponse(tag);
    }

    public async Task<TagCulturelReponseDto?> ModifierAsync(Guid id, ModifierTagCulturelRequeteDto dto)
    {
        var tag = await _repo.ObtenirParIdAsync(id);
        if (tag == null) return null;
        tag.Nom = dto.Nom;
        await _repo.MettreAJourAsync(tag);
        await _repo.SauvegarderAsync();
        return TagCulturelMapper.ToResponse(tag);
    }

    public async Task<bool> SupprimerAsync(Guid id)
    {
        var tag = await _repo.ObtenirParIdAsync(id);
        if (tag == null) return false;
        await _repo.SupprimerAsync(tag);
        await _repo.SauvegarderAsync();
        return true;
    }
}
