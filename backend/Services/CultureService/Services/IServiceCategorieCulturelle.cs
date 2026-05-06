using CultureService.DTOs.CategorieCulturelle;

namespace CultureService.Services;

public interface IServiceCategorieCulturelle
{
    Task<IEnumerable<CategorieCulturelleReponseDto>> ObtenirToutAsync();
    Task<CategorieCulturelleReponseDto?> ObtenirParIdAsync(Guid id);
    Task<CategorieCulturelleReponseDto> CreerAsync(CreerCategorieCulturelleRequeteDto dto);
    Task<CategorieCulturelleReponseDto?> ModifierAsync(Guid id, ModifierCategorieCulturelleRequeteDto dto);
    Task<bool> SupprimerAsync(Guid id);
}
