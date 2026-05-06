using CultureService.Models;

namespace CultureService.Repositories;

public interface ICategorieCulturelleRepository
{
    Task<IEnumerable<CategorieCulturelle>> ObtenirToutAsync();
    Task<CategorieCulturelle?> ObtenirParIdAsync(Guid id);
    Task AjouterAsync(CategorieCulturelle categorie);
    Task MettreAJourAsync(CategorieCulturelle categorie);
    Task SupprimerAsync(CategorieCulturelle categorie);
    Task SauvegarderAsync();
}
