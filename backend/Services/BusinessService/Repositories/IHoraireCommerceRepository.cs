using BusinessService.Models;

namespace BusinessService.Repositories
{
    public interface IHoraireCommerceRepository
    {
        Task<List<HoraireCommerce>> ObtenirParCommerceIdAsync(Guid commerceId);
        Task<HoraireCommerce?> ObtenirParIdAsync(Guid horaireId);
        Task AjouterAsync(HoraireCommerce horaire);
        Task MettreAJourAsync(HoraireCommerce horaire);
        Task SupprimerAsync(HoraireCommerce horaire);
        Task SauvegarderAsync();
    }
}