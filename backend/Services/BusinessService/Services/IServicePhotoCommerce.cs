using BusinessService.DTOs;
using Microsoft.AspNetCore.Http;

namespace BusinessService.Services
{
    public interface IServicePhotoCommerce
    {
        Task<List<PhotoCommerceReponseDto>> ObtenirParCommerceAsync(Guid commerceId);
        Task<PhotoCommerceReponseDto?> AjouterAsync(Guid commerceId, Guid utilisateurId, IFormFile fichier);
        Task<bool> SupprimerAsync(Guid commerceId, Guid photoId, Guid utilisateurId);
        Task<(byte[] contenu, string typeContenu, string nomFichier)?> TelechargerAsync(Guid photoId);
    }
}
