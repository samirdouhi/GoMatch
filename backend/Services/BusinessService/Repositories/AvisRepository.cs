using BusinessService.Data;
using BusinessService.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessService.Repositories
{
    public class AvisRepository : IAvisRepository
    {
        private readonly ContexteBdCommerce _context;

        public AvisRepository(ContexteBdCommerce context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Avis>> ObtenirParCommerceIdAsync(Guid commerceId)
        {
            return await _context.Avis
                .Where(a => a.CommerceId == commerceId)
                .OrderByDescending(a => a.DateCreation)
                .ToListAsync();
        }

        public async Task<Avis?> ObtenirParIdAsync(Guid id)
        {
            return await _context.Avis.FindAsync(id);
        }

        public async Task<bool> ExisteDejaAsync(Guid commerceId, Guid utilisateurId)
        {
            return await _context.Avis
                .AnyAsync(a => a.CommerceId == commerceId && a.UtilisateurId == utilisateurId);
        }

        public async Task AjouterAsync(Avis avis)
        {
            await _context.Avis.AddAsync(avis);
        }

        public async Task SauvegarderAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
