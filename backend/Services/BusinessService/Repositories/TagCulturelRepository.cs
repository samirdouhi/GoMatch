using BusinessService.Data;
using BusinessService.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessService.Repositories
{
    public class TagCulturelRepository : ITagCulturelRepository
    {
        private readonly ContexteBdCommerce _context;

        public TagCulturelRepository(ContexteBdCommerce context)
        {
            _context = context;
        }

        public async Task<List<TagCulturel>> ObtenirToutAsync()
        {
            return await _context.TagsCulturels.ToListAsync();
        }

        public async Task<TagCulturel?> ObtenirParIdAsync(Guid id)
        {
            return await _context.TagsCulturels.FindAsync(id);
        }

        public async Task<bool> ExisteParNomAsync(string nom, Guid? idExclu = null)
        {
            return await _context.TagsCulturels
                .AnyAsync(t => t.Nom == nom && (idExclu == null || t.Id != idExclu));
        }

        public async Task AjouterAsync(TagCulturel tagCulturel)
        {
            await _context.TagsCulturels.AddAsync(tagCulturel);
        }

        public Task SupprimerAsync(TagCulturel tagCulturel)
        {
            _context.TagsCulturels.Remove(tagCulturel);
            return Task.CompletedTask;
        }

        public async Task SauvegarderAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}