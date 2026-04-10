using BusinessService.Models;
using BusinessService.Repositories;

namespace BusinessService.Services
{
    public class ServiceTagCulturel : IServiceTagCulturel
    {
        private readonly ITagCulturelRepository _repository;

        public ServiceTagCulturel(ITagCulturelRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<TagCulturel>> ObtenirToutAsync()
        {
            return await _repository.ObtenirToutAsync();
        }

        public async Task<TagCulturel?> ObtenirParIdAsync(Guid id)
        {
            return await _repository.ObtenirParIdAsync(id);
        }

        public async Task<(bool succes, string? erreur, TagCulturel? resultat)> CreerAsync(TagCulturel tagCulturel)
        {
            var existe = await _repository.ExisteParNomAsync(tagCulturel.Nom);

            if (existe)
            {
                return (false, "Un tag culturel avec ce nom existe déjà.", null);
            }

            tagCulturel.Id = Guid.NewGuid();

            await _repository.AjouterAsync(tagCulturel);
            await _repository.SauvegarderAsync();

            return (true, null, tagCulturel);
        }

        public async Task<(bool succes, string? erreur)> ModifierAsync(Guid id, TagCulturel tagCulturelModifie)
        {
            var tagCulturel = await _repository.ObtenirParIdAsync(id);

            if (tagCulturel == null)
            {
                return (false, null);
            }

            var doublon = await _repository.ExisteParNomAsync(tagCulturelModifie.Nom, idExclu: id);

            if (doublon)
            {
                return (false, "Un tag culturel avec ce nom existe déjà.");
            }

            tagCulturel.Nom = tagCulturelModifie.Nom;

            await _repository.SauvegarderAsync();

            return (true, null);
        }

        public async Task<bool> SupprimerAsync(Guid id)
        {
            var tagCulturel = await _repository.ObtenirParIdAsync(id);

            if (tagCulturel == null)
            {
                return false;
            }

            await _repository.SupprimerAsync(tagCulturel);
            await _repository.SauvegarderAsync();

            return true;
        }
    }
}