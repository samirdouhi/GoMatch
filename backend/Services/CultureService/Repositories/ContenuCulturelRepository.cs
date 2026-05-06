using CultureService.Data;
using CultureService.Models;
using Microsoft.EntityFrameworkCore;

namespace CultureService.Repositories;

public class ContenuCulturelRepository : IContenuCulturelRepository
{
    private readonly ContexteBdCulture _context;

    public ContenuCulturelRepository(ContexteBdCulture context)
    {
        _context = context;
    }

    private IQueryable<ContenuCulturel> AvecRelations() =>
        _context.ContenusCulturels
            .Include(c => c.Categorie)
            .Include(c => c.Tags)
            .Include(c => c.Medias.OrderBy(m => m.Ordre).ThenBy(m => m.DateAjout))
            .Include(c => c.Traductions);

    public async Task<IEnumerable<ContenuCulturel>> ObtenirToutAsync() =>
        await AvecRelations().ToListAsync();

    public async Task<ContenuCulturel?> ObtenirParIdAsync(Guid id) =>
        await AvecRelations().FirstOrDefaultAsync(c => c.Id == id);

    public async Task<IEnumerable<ContenuCulturel>> RechercherAsync(
        string? titre, Guid? categorieId, string? tag, string? langue, string? statut)
    {
        IQueryable<ContenuCulturel> query = AvecRelations();

        if (!string.IsNullOrWhiteSpace(titre))
            query = query.Where(c => c.Titre.Contains(titre));

        if (categorieId.HasValue)
            query = query.Where(c => c.CategorieId == categorieId.Value);

        if (!string.IsNullOrWhiteSpace(tag))
            query = query.Where(c => c.Tags.Any(t => t.Nom.Contains(tag)));

        if (!string.IsNullOrWhiteSpace(langue))
            query = query.Where(c =>
                c.LangueOriginale == langue ||
                c.Traductions.Any(t => t.Langue == langue));

        if (!string.IsNullOrWhiteSpace(statut))
            query = query.Where(c => c.Statut == statut);

        return await query.ToListAsync();
    }

    public async Task AjouterAsync(ContenuCulturel contenu) =>
        await _context.ContenusCulturels.AddAsync(contenu);

    public Task MettreAJourAsync(ContenuCulturel contenu)
    {
        _context.ContenusCulturels.Update(contenu);
        return Task.CompletedTask;
    }

    public Task SupprimerAsync(ContenuCulturel contenu)
    {
        _context.ContenusCulturels.Remove(contenu);
        return Task.CompletedTask;
    }

    public async Task SauvegarderAsync() =>
        await _context.SaveChangesAsync();
}
