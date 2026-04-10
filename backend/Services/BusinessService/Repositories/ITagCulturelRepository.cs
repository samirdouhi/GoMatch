using BusinessService.Models;

namespace BusinessService.Repositories
{
    public interface ITagCulturelRepository
    {
        Task<List<TagCulturel>> ObtenirToutAsync();
        Task<TagCulturel?> ObtenirParIdAsync(Guid id);
        Task<bool> ExisteParNomAsync(string nom, Guid? idExclu = null);
        Task AjouterAsync(TagCulturel tagCulturel);
        Task SupprimerAsync(TagCulturel tagCulturel);
        Task SauvegarderAsync();
    }
}
