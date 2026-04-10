using BusinessService.DTOs;

namespace BusinessService.Services
{
    public interface IServiceHoraireCommerce
    {
        Task<IEnumerable<HoraireCommerceReponseDto>> ObtenirParCommerceAsync(Guid commerceId);

        Task<HoraireCommerceReponseDto?> ObtenirParIdAsync(Guid commerceId, Guid horaireId);

        Task<HoraireCommerceReponseDto> CreerAsync(
            Guid commerceId,
            Guid utilisateurId,
            CreerHoraireCommerceRequeteDto requete);

        Task<HoraireCommerceReponseDto?> ModifierAsync(
            Guid commerceId,
            Guid horaireId,
            Guid utilisateurId,
            ModifierHoraireCommerceRequeteDto requete);

        Task<bool> SupprimerAsync(
            Guid commerceId,
            Guid horaireId,
            Guid utilisateurId);
    }
}