using CultureService.Models;

namespace CultureService.Repositories;

public interface ITagCulturelRepository
{
    Task<IEnumerable<TagCulturel>> ObtenirToutAsync();
    Task<TagCulturel?> ObtenirParIdAsync(Guid id);
    Task<IEnumerable<TagCulturel>> ObtenirParIdsAsync(List<Guid> ids);
    Task AjouterAsync(TagCulturel tag);
    Task MettreAJourAsync(TagCulturel tag);
    Task SupprimerAsync(TagCulturel tag);
    Task SauvegarderAsync();
}
