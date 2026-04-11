using BusinessService.DTOs;
using BusinessService.Enums;
using BusinessService.Exceptions;
using BusinessService.Mappers;
using BusinessService.Repositories;
using BusinessService.Services.External;

namespace BusinessService.Services
{
    public class ServiceCommerce : IServiceCommerce
    {
        private readonly ICommerceRepository _repository;
        private readonly IEmailNotificationClient _emailClient;
        private readonly ILogger<ServiceCommerce> _logger;

        public ServiceCommerce(
            ICommerceRepository repository,
            IEmailNotificationClient emailClient,
            ILogger<ServiceCommerce> logger)
        {
            _repository = repository;
            _emailClient = emailClient;
            _logger = logger;
        }

        public async Task<IEnumerable<CommerceReponseDto>> ObtenirToutAsync()
        {
            var commerces = await _repository.ObtenirToutAsync();
            return commerces
                .Where(c => c.EstValide)
                .Select(CommerceMapper.ToResponse);
        }

        public async Task<IEnumerable<CommerceReponseDto>> ObtenirToutAdminAsync()
        {
            var commerces = await _repository.ObtenirToutAsync();
            return commerces.Select(CommerceMapper.ToResponse);
        }

        public async Task<IEnumerable<CommerceReponseDto>> ObtenirEnAttenteAsync()
        {
            var commerces = await _repository.ObtenirToutAsync();
            return commerces
                .Where(c => c.Statut == StatutCommerce.EnAttente)
                .Select(CommerceMapper.ToResponse);
        }

        public async Task<CommerceReponseDto?> ObtenirParIdAsync(Guid id)
        {
            var commerce = await _repository.ObtenirParIdAsync(id);
            return commerce == null ? null : CommerceMapper.ToResponse(commerce);
        }

        public async Task<CommerceReponseDto> CreerAsync(
            CreerCommerceRequeteDto requete,
            Guid proprietaireUtilisateurId,
            string proprietaireEmail)
        {
            var commerce = CommerceMapper.ToEntity(
                requete,
                proprietaireUtilisateurId,
                proprietaireEmail);

            _logger.LogInformation(
                "Création commerce {CommerceId} - Email propriétaire: {Email}",
                commerce.Id,
                proprietaireEmail);

            await _repository.AjouterAsync(commerce);
            await _repository.SauvegarderAsync();

            if (!string.IsNullOrWhiteSpace(proprietaireEmail))
            {
                await _emailClient.SendCommerceSubmissionReceivedAsync(
                    proprietaireEmail,
                    null);
            }
            else
            {
                _logger.LogWarning(
                    "Aucun email propriétaire pour le commerce {CommerceId}",
                    commerce.Id);
            }

            return CommerceMapper.ToResponse(commerce);
        }

        public async Task<CommerceReponseDto?> ModifierAsync(
            Guid id,
            ModifierCommerceRequeteDto requete,
            Guid utilisateurId)
        {
            var commerce = await _repository.ObtenirParIdAsync(id);

            if (commerce == null)
                return null;

            if (commerce.ProprietaireUtilisateurId != utilisateurId)
                throw new ForbiddenBusinessAccessException("Accès refusé à ce commerce.");

            CommerceMapper.ApplyUpdate(commerce, requete);

            await _repository.MettreAJourAsync(commerce);
            await _repository.SauvegarderAsync();

            return CommerceMapper.ToResponse(commerce);
        }

        public async Task<bool> SupprimerAsync(Guid id, Guid utilisateurId)
        {
            var commerce = await _repository.ObtenirParIdAsync(id);

            if (commerce == null)
                return false;

            if (commerce.ProprietaireUtilisateurId != utilisateurId)
                throw new ForbiddenBusinessAccessException("Accès refusé à ce commerce.");

            await _repository.SupprimerAsync(commerce);
            await _repository.SauvegarderAsync();

            return true;
        }

        public async Task<CommerceReponseDto?> AjouterTagsAsync(
            Guid commerceId,
            List<Guid> tagIds,
            Guid utilisateurId)
        {
            var commerceExistant = await _repository.ObtenirParIdAsync(commerceId);

            if (commerceExistant == null)
                return null;

            if (commerceExistant.ProprietaireUtilisateurId != utilisateurId)
                throw new ForbiddenBusinessAccessException("Accès refusé à ce commerce.");

            var commerce = await _repository.AjouterTagsAsync(commerceId, tagIds);

            if (commerce == null)
                return null;

            return CommerceMapper.ToResponse(commerce);
        }

        public async Task<IEnumerable<CommerceProcheReponseDto>> ObtenirCommercesProchesAsync(
            double latitude,
            double longitude,
            double rayonKm)
        {
            var commerces = await _repository.ObtenirCommercesProchesAsync(
                latitude,
                longitude,
                rayonKm);

            return commerces
                .Where(c => c.EstValide)
                .Select(c => CommerceMapper.ToNearbyResponse(
                    c,
                    CalculerDistance(latitude, longitude, c.Latitude, c.Longitude)));
        }

        public async Task<IEnumerable<CommerceReponseDto>> RechercherAsync(
            string? nom,
            string? categorie,
            string? tag,
            bool? estValide)
        {
            var commerces = await _repository.RechercherAsync(
                nom,
                categorie,
                tag,
                estValide);

            return commerces.Select(CommerceMapper.ToResponse);
        }

        public async Task<CommerceReponseDto?> ValiderAsync(
            Guid id,
            CancellationToken ct = default)
        {
            var commerce = await _repository.ObtenirParIdAsync(id);

            if (commerce == null)
                return null;

            commerce.EstValide = true;
            commerce.Statut = StatutCommerce.Approuve;
            commerce.RaisonRejet = null;

            await _repository.SauvegarderAsync();

            var email = commerce.ProprietaireEmail;

            _logger.LogInformation(
                "Validation commerce {CommerceId} - Email propriétaire: {Email}",
                commerce.Id,
                email);

            if (!string.IsNullOrWhiteSpace(email))
            {
                await _emailClient.SendCommerceApprovedAsync(email, null, ct);
            }
            else
            {
                _logger.LogWarning(
                    "Impossible d'envoyer l'email d'approbation: email vide pour commerce {CommerceId}",
                    commerce.Id);
            }

            return CommerceMapper.ToResponse(commerce);
        }

        public async Task<CommerceReponseDto?> RejeterAsync(
            Guid id,
            string raison,
            CancellationToken ct = default)
        {
            var commerce = await _repository.ObtenirParIdAsync(id);

            if (commerce == null)
                return null;

            commerce.EstValide = false;
            commerce.Statut = StatutCommerce.Rejete;
            commerce.RaisonRejet = raison;

            await _repository.SauvegarderAsync();

            var email = commerce.ProprietaireEmail;

            _logger.LogInformation(
                "Rejet commerce {CommerceId} - Email propriétaire: {Email}",
                commerce.Id,
                email);

            if (!string.IsNullOrWhiteSpace(email))
            {
                var raisonEmail = string.IsNullOrWhiteSpace(raison)
                    ? "Non précisée"
                    : raison;

                await _emailClient.SendCommerceRejectedAsync(
                    email,
                    raisonEmail,
                    null,
                    ct);
            }
            else
            {
                _logger.LogWarning(
                    "Impossible d'envoyer l'email de rejet: email vide pour commerce {CommerceId}",
                    commerce.Id);
            }

            return CommerceMapper.ToResponse(commerce);
        }

        public async Task<CommerceReponseDto?> ObtenirMonCommerceAsync(Guid utilisateurId)
        {
            var commerces = await _repository.ObtenirToutAsync();
            var commerce = commerces.FirstOrDefault(
                c => c.ProprietaireUtilisateurId == utilisateurId);

            if (commerce == null)
                return null;

            return CommerceMapper.ToResponse(commerce);
        }

        private static double CalculerDistance(
            double lat1,
            double lon1,
            double lat2,
            double lon2)
        {
            const double R = 6371;
            var dLat = ConvertirEnRadians(lat2 - lat1);
            var dLon = ConvertirEnRadians(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                    + Math.Cos(ConvertirEnRadians(lat1))
                    * Math.Cos(ConvertirEnRadians(lat2))
                    * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        }

        private static double ConvertirEnRadians(double deg) => deg * Math.PI / 180;
    }
}