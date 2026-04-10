using BusinessService.Models;

namespace BusinessService.Services
{
    public interface IServiceCategorie
    {
        Task<List<Categorie>> ObtenirToutAsync();
        Task<Categorie?> ObtenirParIdAsync(Guid id);
        Task<(bool succes, string? erreur, Categorie? resultat)> CreerAsync(Categorie categorie);
        Task<Categorie?> ModifierAsync(Guid id, Categorie categorieModifiee);
        Task<(bool succes, string? erreur)> SupprimerAsync(Guid id);
    }
}