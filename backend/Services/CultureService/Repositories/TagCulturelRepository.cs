using CultureService.Data;
using CultureService.Models;
using Microsoft.EntityFrameworkCore;

namespace CultureService.Repositories;

public class TagCulturelRepository : ITagCulturelRepository
{
    private readonly ContexteBdCulture _context;

    public TagCulturelRepository(ContexteBdCulture context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TagCulturel>> ObtenirToutAsync() =>
        await _context.TagsCulturels.ToListAsync();

    public async Task<TagCulturel?> ObtenirParIdAsync(Guid id) =>
        await _context.TagsCulturels.FindAsync(id);

    public async Task<IEnumerable<TagCulturel>> ObtenirParIdsAsync(List<Guid> ids) =>
        await _context.TagsCulturels.Where(t => ids.Contains(t.Id)).ToListAsync();

    public async Task AjouterAsync(TagCulturel tag) =>
        await _context.TagsCulturels.AddAsync(tag);

    public Task MettreAJourAsync(TagCulturel tag)
    {
        _context.TagsCulturels.Update(tag);
        return Task.CompletedTask;
    }

    public Task SupprimerAsync(TagCulturel tag)
    {
        _context.TagsCulturels.Remove(tag);
        return Task.CompletedTask;
    }

    public async Task SauvegarderAsync() =>
        await _context.SaveChangesAsync();
}
