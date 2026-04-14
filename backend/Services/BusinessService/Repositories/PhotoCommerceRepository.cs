using BusinessService.Data;
using BusinessService.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessService.Repositories
{
    public class PhotoCommerceRepository : IPhotoCommerceRepository
    {
        private readonly ContexteBdCommerce _context;

        public PhotoCommerceRepository(ContexteBdCommerce context)
        {
            _context = context;
        }

        public async Task<List<PhotoCommerce>> ObtenirParCommerceAsync(Guid commerceId)
        {
            return await _context.PhotosCommerces
                .Where(p => p.CommerceId == commerceId)
                .OrderBy(p => p.Ordre)
                .ThenBy(p => p.DateAjout)
                .ToListAsync();
        }

        public async Task<PhotoCommerce?> ObtenirParIdAsync(Guid photoId)
        {
            return await _context.PhotosCommerces.FindAsync(photoId);
        }

        public async Task<PhotoCommerce> AjouterAsync(PhotoCommerce photo)
        {
            _context.PhotosCommerces.Add(photo);
            await _context.SaveChangesAsync();
            return photo;
        }

        public async Task<bool> SupprimerAsync(Guid photoId)
        {
            var photo = await _context.PhotosCommerces.FindAsync(photoId);
            if (photo == null) return false;
            _context.PhotosCommerces.Remove(photo);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> CompterParCommerceAsync(Guid commerceId)
        {
            return await _context.PhotosCommerces
                .CountAsync(p => p.CommerceId == commerceId);
        }
    }
}
