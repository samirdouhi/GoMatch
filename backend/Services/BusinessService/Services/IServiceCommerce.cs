using BusinessService.DTOs;

namespace BusinessService.Services
{
    public interface IServiceCommerce
    {
        Task<IEnumerable<CommerceReponseDto>> ObtenirToutAsync();
        Task<CommerceReponseDto?> ObtenirParIdAsync(Guid id);
        Task<CommerceReponseDto> CreerAsync(CreerCommerceRequeteDto requete, Guid proprietaireUtilisateurId);

        Task<CommerceReponseDto?> ModifierAsync(
            Guid id,
            ModifierCommerceRequeteDto requete,
            Guid utilisateurId);

        Task<bool> SupprimerAsync(Guid id, Guid utilisateurId);

        Task<CommerceReponseDto?> AjouterTagsAsync(
            Guid commerceId,
            List<Guid> tagIds,
            Guid utilisateurId);

        Task<IEnumerable<CommerceProcheReponseDto>> ObtenirCommercesProchesAsync(
            double latitude,
            double longitude,
            double rayonKm);

        Task<IEnumerable<CommerceReponseDto>> RechercherAsync(
            string? nom,
            string? categorie,
            string? tag,
            bool? estValide);

        Task<CommerceReponseDto?> ValiderAsync(Guid id);
        Task<CommerceReponseDto?> RejeterAsync(Guid id);
        Task<CommerceReponseDto?> ObtenirMonCommerceAsync(Guid utilisateurId);
    }
}