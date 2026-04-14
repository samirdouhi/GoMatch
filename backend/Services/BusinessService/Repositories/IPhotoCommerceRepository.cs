using BusinessService.Models;

namespace BusinessService.Repositories
{
    public interface IPhotoCommerceRepository
    {
        Task<List<PhotoCommerce>> ObtenirParCommerceAsync(Guid commerceId);
        Task<PhotoCommerce?> ObtenirParIdAsync(Guid photoId);
        Task<PhotoCommerce> AjouterAsync(PhotoCommerce photo);
        Task<bool> SupprimerAsync(Guid photoId);
        Task<int> CompterParCommerceAsync(Guid commerceId);
    }
}
