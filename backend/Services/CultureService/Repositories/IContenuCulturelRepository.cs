using CultureService.Models;

namespace CultureService.Repositories;

public interface IContenuCulturelRepository
{
    Task<IEnumerable<ContenuCulturel>> ObtenirToutAsync();
    Task<ContenuCulturel?> ObtenirParIdAsync(Guid id);
    Task<IEnumerable<ContenuCulturel>> RechercherAsync(string? titre, Guid? categorieId, string? tag, string? langue, string? statut);
    Task AjouterAsync(ContenuCulturel contenu);
    Task MettreAJourAsync(ContenuCulturel contenu);
    Task SupprimerAsync(ContenuCulturel contenu);
    Task SauvegarderAsync();
}
