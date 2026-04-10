using BusinessService.DTOs;
using BusinessService.Exceptions;
using BusinessService.Mappers;
using BusinessService.Repositories;

namespace BusinessService.Services
{
    public class ServiceHoraireCommerce : IServiceHoraireCommerce
    {
        private readonly IHoraireCommerceRepository _repository;
        private readonly ICommerceRepository _commerceRepository;

        public ServiceHoraireCommerce(
            IHoraireCommerceRepository repository,
            ICommerceRepository commerceRepository)
        {
            _repository = repository;
            _commerceRepository = commerceRepository;
        }

        public async Task<IEnumerable<HoraireCommerceReponseDto>> ObtenirParCommerceAsync(Guid commerceId)
        {
            var horaires = await _repository.ObtenirParCommerceIdAsync(commerceId);
            return horaires.Select(HoraireCommerceMapper.ToResponse);
        }

        public async Task<HoraireCommerceReponseDto?> ObtenirParIdAsync(Guid commerceId, Guid horaireId)
        {
            var horaire = await _repository.ObtenirParIdAsync(horaireId);

            if (horaire == null || horaire.CommerceId != commerceId)
                return null;

            return HoraireCommerceMapper.ToResponse(horaire);
        }

        public async Task<HoraireCommerceReponseDto> CreerAsync(
            Guid commerceId,
            Guid utilisateurId,
            CreerHoraireCommerceRequeteDto requete)
        {
            var commerce = await _commerceRepository.ObtenirParIdAsync(commerceId);

            if (commerce == null)
                throw new BusinessNotFoundException(commerceId);

            if (commerce.ProprietaireUtilisateurId != utilisateurId)
                throw new ForbiddenBusinessAccessException("Accès refusé à ce commerce.");

            ValiderHoraire(requete.EstFerme, requete.HeureOuverture, requete.HeureFermeture);

            var horairesExistants = await _repository.ObtenirParCommerceIdAsync(commerceId);

            if (horairesExistants.Any(h => h.JourSemaine == requete.JourSemaine))
                throw new ArgumentException("Un horaire existe déjà pour ce jour.");

            var horaire = HoraireCommerceMapper.ToEntity(commerceId, requete);

            if (requete.EstFerme)
            {
                horaire.HeureOuverture = TimeSpan.Zero;
                horaire.HeureFermeture = TimeSpan.Zero;
            }

            await _repository.AjouterAsync(horaire);
            await _repository.SauvegarderAsync();

            return HoraireCommerceMapper.ToResponse(horaire);
        }

        public async Task<HoraireCommerceReponseDto?> ModifierAsync(
            Guid commerceId,
            Guid horaireId,
            Guid utilisateurId,
            ModifierHoraireCommerceRequeteDto requete)
        {
            var commerce = await _commerceRepository.ObtenirParIdAsync(commerceId);

            if (commerce == null)
                throw new BusinessNotFoundException(commerceId);

            if (commerce.ProprietaireUtilisateurId != utilisateurId)
                throw new ForbiddenBusinessAccessException("Accès refusé à ce commerce.");

            var horaire = await _repository.ObtenirParIdAsync(horaireId);

            if (horaire == null || horaire.CommerceId != commerceId)
                return null;

            ValiderHoraire(requete.EstFerme, requete.HeureOuverture, requete.HeureFermeture);

            var horairesExistants = await _repository.ObtenirParCommerceIdAsync(commerceId);

            if (horairesExistants.Any(h => h.Id != horaireId && h.JourSemaine == requete.JourSemaine))
                throw new ArgumentException("Un horaire existe déjà pour ce jour.");

            HoraireCommerceMapper.ApplyUpdate(horaire, requete);

            if (requete.EstFerme)
            {
                horaire.HeureOuverture = TimeSpan.Zero;
                horaire.HeureFermeture = TimeSpan.Zero;
            }

            await _repository.MettreAJourAsync(horaire);
            await _repository.SauvegarderAsync();

            return HoraireCommerceMapper.ToResponse(horaire);
        }

        public async Task<bool> SupprimerAsync(
            Guid commerceId,
            Guid horaireId,
            Guid utilisateurId)
        {
            var commerce = await _commerceRepository.ObtenirParIdAsync(commerceId);

            if (commerce == null)
                throw new BusinessNotFoundException(commerceId);

            if (commerce.ProprietaireUtilisateurId != utilisateurId)
                throw new ForbiddenBusinessAccessException("Accès refusé à ce commerce.");

            var horaire = await _repository.ObtenirParIdAsync(horaireId);

            if (horaire == null || horaire.CommerceId != commerceId)
                return false;

            await _repository.SupprimerAsync(horaire);
            await _repository.SauvegarderAsync();

            return true;
        }

        private static void ValiderHoraire(
            bool estFerme,
            TimeSpan heureOuverture,
            TimeSpan heureFermeture)
        {
            if (estFerme)
                return;

            if (heureOuverture >= heureFermeture)
                throw new ArgumentException("L'heure d'ouverture doit être strictement inférieure à l'heure de fermeture.");
        }
    }
}