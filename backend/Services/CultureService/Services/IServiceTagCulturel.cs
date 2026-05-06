using CultureService.DTOs.TagCulturel;

namespace CultureService.Services;

public interface IServiceTagCulturel
{
    Task<IEnumerable<TagCulturelReponseDto>> ObtenirToutAsync();
    Task<TagCulturelReponseDto?> ObtenirParIdAsync(Guid id);
    Task<TagCulturelReponseDto> CreerAsync(CreerTagCulturelRequeteDto dto);
    Task<TagCulturelReponseDto?> ModifierAsync(Guid id, ModifierTagCulturelRequeteDto dto);
    Task<bool> SupprimerAsync(Guid id);
}
