using BusinessService.Models;

namespace BusinessService.Repositories
{
    public interface ICategorieRepository
    {
        Task<List<Categorie>> ObtenirToutAsync();
        Task<Categorie?> ObtenirParIdAsync(Guid id);
        Task<bool> ExisteParNomAsync(string nom);
        Task AjouterAsync(Categorie categorie);
        Task SupprimerAsync(Categorie categorie);
        Task SauvegarderAsync();
    }
}