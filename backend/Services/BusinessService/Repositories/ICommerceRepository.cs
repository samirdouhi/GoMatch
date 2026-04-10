using BusinessService.Models;

namespace BusinessService.Repositories
{
    public interface ICommerceRepository
    {
        Task<IEnumerable<Commerce>> ObtenirToutAsync();
        Task<Commerce?> ObtenirParIdAsync(Guid id);
        Task AjouterAsync(Commerce commerce);
        Task MettreAJourAsync(Commerce commerce);
        Task SupprimerAsync(Commerce commerce);
        Task SauvegarderAsync();

        Task<Commerce?> AjouterTagsAsync(Guid commerceId, List<Guid> tagIds);

        Task<IEnumerable<Commerce>> ObtenirCommercesProchesAsync(
            double latitude,
            double longitude,
            double rayonKm);

        Task<IEnumerable<Commerce>> RechercherAsync(
            string? nom,
            string? categorie,
            string? tag,
            bool? estValide);
    }
}