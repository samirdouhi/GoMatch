using CultureService.DTOs.ContenuCulturel;
using CultureService.DTOs.Media;
using CultureService.DTOs.Traduction;
using CultureService.DTOs;

namespace CultureService.Services;

public interface IServiceContenuCulturel
{
    Task<IEnumerable<ContenuCulturelReponseDto>> ObtenirToutPubliesAsync();
    Task<IEnumerable<ContenuCulturelReponseDto>> ObtenirToutAdminAsync();
    Task<ContenuCulturelReponseDto?> ObtenirParIdAsync(Guid id);
    Task<IEnumerable<ContenuCulturelReponseDto>> RechercherAsync(string? titre, Guid? categorieId, string? tag, string? langue);
    Task<ContenuCulturelReponseDto> CreerAsync(CreerContenuCulturelRequeteDto dto, Guid auteurId);
    Task<ContenuCulturelReponseDto?> ModifierAsync(Guid id, ModifierContenuCulturelRequeteDto dto, Guid auteurId);
    Task<bool> SupprimerAsync(Guid id);
    Task<ContenuCulturelReponseDto?> PublierAsync(Guid id);
    Task<ContenuCulturelReponseDto?> DepublierAsync(Guid id);
    Task<MediaReponseDto?> AjouterMediaAsync(Guid contenuId, AjouterMediaRequeteDto dto);
    Task<bool> SupprimerMediaAsync(Guid contenuId, Guid mediaId);
    Task<TraductionReponseDto?> AjouterTraductionAsync(Guid contenuId, CreerTraductionRequeteDto dto);
    Task<bool> SupprimerTraductionAsync(Guid contenuId, Guid traductionId);
}
