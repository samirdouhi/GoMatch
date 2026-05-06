using CultureService.Data;
using CultureService.Models;
using Microsoft.EntityFrameworkCore;

namespace CultureService.Repositories;

public class CategorieCulturelleRepository : ICategorieCulturelleRepository
{
    private readonly ContexteBdCulture _context;

    public CategorieCulturelleRepository(ContexteBdCulture context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CategorieCulturelle>> ObtenirToutAsync() =>
        await _context.CategoriesCulturelles.ToListAsync();

    public async Task<CategorieCulturelle?> ObtenirParIdAsync(Guid id) =>
        await _context.CategoriesCulturelles.FindAsync(id);

    public async Task AjouterAsync(CategorieCulturelle categorie) =>
        await _context.CategoriesCulturelles.AddAsync(categorie);

    public Task MettreAJourAsync(CategorieCulturelle categorie)
    {
        _context.CategoriesCulturelles.Update(categorie);
        return Task.CompletedTask;
    }

    public Task SupprimerAsync(CategorieCulturelle categorie)
    {
        _context.CategoriesCulturelles.Remove(categorie);
        return Task.CompletedTask;
    }

    public async Task SauvegarderAsync() =>
        await _context.SaveChangesAsync();
}
