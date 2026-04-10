using BusinessService.Models;
using BusinessService.Repositories;
using Microsoft.EntityFrameworkCore;

namespace BusinessService.Services
{
    public class ServiceCategorie : IServiceCategorie
    {
        private readonly ICategorieRepository _repository;

        public ServiceCategorie(ICategorieRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<Categorie>> ObtenirToutAsync()
        {
            return await _repository.ObtenirToutAsync();
        }

        public async Task<Categorie?> ObtenirParIdAsync(Guid id)
        {
            return await _repository.ObtenirParIdAsync(id);
        }

        public async Task<(bool succes, string? erreur, Categorie? resultat)> CreerAsync(Categorie categorie)
        {
            categorie.Nom = (categorie.Nom ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(categorie.Nom))
            {
                return (false, "Le nom de la catégorie est obligatoire.", null);
            }

            var existe = await _repository.ExisteParNomAsync(categorie.Nom);
            if (existe)
            {
                return (false, "Une catégorie avec ce nom existe déjà.", null);
            }

            categorie.Id = Guid.NewGuid();

            try
            {
                await _repository.AjouterAsync(categorie);
                await _repository.SauvegarderAsync();
            }
            catch (DbUpdateException)
            {
                return (false, "Une catégorie avec ce nom existe déjà.", null);
            }

            return (true, null, categorie);
        }

        public async Task<Categorie?> ModifierAsync(Guid id, Categorie categorieModifiee)
        {
            var categorie = await _repository.ObtenirParIdAsync(id);
            if (categorie == null)
            {
                return null;
            }

            categorie.Nom = (categorieModifiee.Nom ?? string.Empty).Trim();

            await _repository.SauvegarderAsync();

            return categorie;
        }

        public async Task<(bool succes, string? erreur)> SupprimerAsync(Guid id)
        {
            var categorie = await _repository.ObtenirParIdAsync(id);
            if (categorie == null)
            {
                return (false, null);
            }

            if (categorie.Commerces.Any())
            {
                return (false, "Impossible de supprimer une catégorie liée à des commerces.");
            }

            await _repository.SupprimerAsync(categorie);
            await _repository.SauvegarderAsync();

            return (true, null);
        }
    }
}