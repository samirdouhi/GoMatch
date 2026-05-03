using BusinessService.Models;

namespace BusinessService.Repositories
{
    public interface IAvisRepository
    {
        Task<IEnumerable<Avis>> ObtenirParCommerceIdAsync(Guid commerceId);
        Task<Avis?> ObtenirParIdAsync(Guid id);
        Task<bool> ExisteDejaAsync(Guid commerceId, Guid utilisateurId);
        Task AjouterAsync(Avis avis);
        Task SauvegarderAsync();
    }
}
