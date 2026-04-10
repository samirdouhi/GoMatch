using BusinessService.Models;

namespace BusinessService.Services
{
    public interface IServiceTagCulturel
    {
        Task<List<TagCulturel>> ObtenirToutAsync();
        Task<TagCulturel?> ObtenirParIdAsync(Guid id);
        Task<(bool succes, string? erreur, TagCulturel? resultat)> CreerAsync(TagCulturel tagCulturel);
        Task<(bool succes, string? erreur)> ModifierAsync(Guid id, TagCulturel tagCulturelModifie);
        Task<bool> SupprimerAsync(Guid id);
    }
}