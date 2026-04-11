using BusinessService.DTOs;

namespace BusinessService.Services
{
    public interface IServiceCommerce
    {
        /// <summary>Retourne uniquement les commerces validés (usage public).</summary>
        Task<IEnumerable<CommerceReponseDto>> ObtenirToutAsync();

        /// <summary>Retourne tous les commerces quel que soit le statut (usage admin).</summary>
        Task<IEnumerable<CommerceReponseDto>> ObtenirToutAdminAsync();

        /// <summary>Retourne les commerces en attente de validation.</summary>
        Task<IEnumerable<CommerceReponseDto>> ObtenirEnAttenteAsync();

        Task<CommerceReponseDto?> ObtenirParIdAsync(Guid id);

        Task<CommerceReponseDto> CreerAsync(
            CreerCommerceRequeteDto requete,
            Guid proprietaireUtilisateurId,
            string proprietaireEmail);

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

        Task<CommerceReponseDto?> ValiderAsync(Guid id, CancellationToken ct = default);
        Task<CommerceReponseDto?> RejeterAsync(Guid id, string raison, CancellationToken ct = default);

        Task<CommerceReponseDto?> ObtenirMonCommerceAsync(Guid utilisateurId);
    }
}