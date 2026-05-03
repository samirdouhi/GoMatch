using BusinessService.DTOs;

namespace BusinessService.Services
{
    public interface IServiceAvis
    {
        Task<IEnumerable<AvisReponseDto>> ObtenirParCommerceAsync(Guid commerceId);
        Task<AvisReponseDto> AjouterAvisAsync(Guid commerceId, CreerAvisRequeteDto requete, Guid utilisateurId, string utilisateurEmail);
    }
}
