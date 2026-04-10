using BusinessService.Data;
using BusinessService.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessService.Repositories
{
    public class CategorieRepository : ICategorieRepository
    {
        private readonly ContexteBdCommerce _context;

        public CategorieRepository(ContexteBdCommerce context)
        {
            _context = context;
        }

        public async Task<List<Categorie>> ObtenirToutAsync()
        {
            return await _context.Categories.ToListAsync();
        }

        public async Task<Categorie?> ObtenirParIdAsync(Guid id)
        {
            return await _context.Categories
                .Include(c => c.Commerces)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<bool> ExisteParNomAsync(string nom)
        {
            var nomNormalise = (nom ?? string.Empty).Trim().ToLower();

            return await _context.Categories
                .AnyAsync(c => c.Nom.Trim().ToLower() == nomNormalise);
        }

        public async Task AjouterAsync(Categorie categorie)
        {
            await _context.Categories.AddAsync(categorie);
        }

        public Task SupprimerAsync(Categorie categorie)
        {
            _context.Categories.Remove(categorie);
            return Task.CompletedTask;
        }

        public async Task SauvegarderAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}