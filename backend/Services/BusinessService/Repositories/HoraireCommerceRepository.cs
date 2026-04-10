using BusinessService.Data;
using BusinessService.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessService.Repositories
{
    public class HoraireCommerceRepository : IHoraireCommerceRepository
    {
        private readonly ContexteBdCommerce _context;

        public HoraireCommerceRepository(ContexteBdCommerce context)
        {
            _context = context;
        }

        public async Task<List<HoraireCommerce>> ObtenirParCommerceIdAsync(Guid commerceId)
        {
            return await _context.HorairesCommerces
                .Where(h => h.CommerceId == commerceId)
                .ToListAsync();
        }

        public async Task<HoraireCommerce?> ObtenirParIdAsync(Guid horaireId)
        {
            return await _context.HorairesCommerces
                .FirstOrDefaultAsync(h => h.Id == horaireId);
        }

        public async Task AjouterAsync(HoraireCommerce horaire)
        {
            await _context.HorairesCommerces.AddAsync(horaire);
        }

        public Task MettreAJourAsync(HoraireCommerce horaire)
        {
            _context.HorairesCommerces.Update(horaire);
            return Task.CompletedTask;
        }

        public Task SupprimerAsync(HoraireCommerce horaire)
        {
            _context.HorairesCommerces.Remove(horaire);
            return Task.CompletedTask;
        }

        public async Task SauvegarderAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}