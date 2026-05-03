using BusinessService.DTOs;
using BusinessService.Models;
using BusinessService.Repositories;

namespace BusinessService.Services
{
    public class ServiceAvis : IServiceAvis
    {
        private readonly IAvisRepository _repository;
        private readonly ICommerceRepository _commerceRepository;

        public ServiceAvis(IAvisRepository repository, ICommerceRepository commerceRepository)
        {
            _repository = repository;
            _commerceRepository = commerceRepository;
        }

        public async Task<IEnumerable<AvisReponseDto>> ObtenirParCommerceAsync(Guid commerceId)
        {
            var avis = await _repository.ObtenirParCommerceIdAsync(commerceId);
            return avis.Select(ToDto);
        }

        public async Task<AvisReponseDto> AjouterAvisAsync(
            Guid commerceId,
            CreerAvisRequeteDto requete,
            Guid utilisateurId,
            string utilisateurEmail)
        {
            if (requete.Note < 1 || requete.Note > 5)
                throw new ArgumentException("La note doit être entre 1 et 5.");

            var commerce = await _commerceRepository.ObtenirParIdAsync(commerceId);
            if (commerce == null)
                throw new KeyNotFoundException("Commerce introuvable.");

            var dejaNote = await _repository.ExisteDejaAsync(commerceId, utilisateurId);
            if (dejaNote)
                throw new InvalidOperationException("Vous avez déjà noté ce commerce.");

            var avis = new Avis
            {
                Id = Guid.NewGuid(),
                CommerceId = commerceId,
                UtilisateurId = utilisateurId,
                UtilisateurEmail = utilisateurEmail,
                Note = requete.Note,
                Commentaire = requete.Commentaire?.Trim(),
                DateCreation = DateTime.UtcNow,
            };

            await _repository.AjouterAsync(avis);
            await _repository.SauvegarderAsync();

            return ToDto(avis);
        }

        private static AvisReponseDto ToDto(Avis avis) => new()
        {
            Id = avis.Id,
            CommerceId = avis.CommerceId,
            UtilisateurId = avis.UtilisateurId,
            UtilisateurEmail = avis.UtilisateurEmail,
            Note = avis.Note,
            Commentaire = avis.Commentaire,
            DateCreation = avis.DateCreation,
        };
    }
}
