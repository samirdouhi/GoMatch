using BusinessService.DTOs;
using BusinessService.Models;
using BusinessService.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;

namespace BusinessService.Services
{
    public class ServicePhotoCommerce : IServicePhotoCommerce
    {
        private static readonly string[] ExtensionsAutorisees = { ".jpg", ".jpeg", ".png", ".webp" };
        private const int MaxPhotosParCommerce = 10;
        private const long TailleMaxFichier = 10 * 1024 * 1024; // 10 MB

        private readonly IPhotoCommerceRepository _photoRepo;
        private readonly ICommerceRepository      _commerceRepo;
        private readonly IHostEnvironment         _env;
        private readonly ILogger<ServicePhotoCommerce> _logger;

        public ServicePhotoCommerce(
            IPhotoCommerceRepository photoRepo,
            ICommerceRepository      commerceRepo,
            IHostEnvironment         env,
            ILogger<ServicePhotoCommerce> logger)
        {
            _photoRepo    = photoRepo;
            _commerceRepo = commerceRepo;
            _env          = env;
            _logger       = logger;
        }

        // Racine persistante des uploads (créée au démarrage via ContentRootPath)
        private string UploadsRoot =>
            Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "commerces");

        public async Task<List<PhotoCommerceReponseDto>> ObtenirParCommerceAsync(Guid commerceId)
        {
            var photos = await _photoRepo.ObtenirParCommerceAsync(commerceId);
            return photos.Select(ToDto).ToList();
        }

        public async Task<PhotoCommerceReponseDto?> AjouterAsync(
            Guid commerceId,
            Guid utilisateurId,
            IFormFile fichier)
        {
            if (fichier.Length == 0 || fichier.Length > TailleMaxFichier)
                return null;

            var extension = Path.GetExtension(fichier.FileName).ToLowerInvariant();
            if (!ExtensionsAutorisees.Contains(extension))
                return null;

            var commerce = await _commerceRepo.ObtenirParIdAsync(commerceId);
            if (commerce == null || commerce.ProprietaireUtilisateurId != utilisateurId)
                return null;

            var nbExistant = await _photoRepo.CompterParCommerceAsync(commerceId);
            if (nbExistant >= MaxPhotosParCommerce)
                return null;

            var photoId        = Guid.NewGuid();
            var nomFichierDisk = $"{photoId}{extension}";

            // Chemin relatif stocké en BD (portable entre environnements)
            var cheminRelatif = Path.Combine("uploads", "commerces",
                commerceId.ToString(), nomFichierDisk)
                .Replace('\\', '/');

            // Chemin absolu réel pour l'écriture
            var dossierAbsolu = Path.Combine(UploadsRoot, commerceId.ToString());
            Directory.CreateDirectory(dossierAbsolu);
            var cheminAbsolu = Path.Combine(dossierAbsolu, nomFichierDisk);

            await using (var stream = new FileStream(cheminAbsolu, FileMode.Create))
            {
                await fichier.CopyToAsync(stream);
            }

            _logger.LogInformation("Photo enregistrée : {Path}", cheminAbsolu);

            var photo = new PhotoCommerce
            {
                Id            = photoId,
                CommerceId    = commerceId,
                NomFichier    = fichier.FileName,
                CheminFichier = cheminRelatif,
                TypeContenu   = fichier.ContentType,
                TailleFichier = fichier.Length,
                Ordre         = nbExistant,
                DateAjout     = DateTime.UtcNow
            };

            var saved = await _photoRepo.AjouterAsync(photo);
            return ToDto(saved);
        }

        public async Task<bool> SupprimerAsync(Guid commerceId, Guid photoId, Guid utilisateurId)
        {
            var commerce = await _commerceRepo.ObtenirParIdAsync(commerceId);
            if (commerce == null || commerce.ProprietaireUtilisateurId != utilisateurId)
                return false;

            var photo = await _photoRepo.ObtenirParIdAsync(photoId);
            if (photo == null || photo.CommerceId != commerceId)
                return false;

            var cheminAbsolu = ResoudrChemin(photo.CheminFichier);
            if (File.Exists(cheminAbsolu))
            {
                try { File.Delete(cheminAbsolu); }
                catch (Exception ex) { _logger.LogWarning(ex, "Suppression fichier échouée : {Path}", cheminAbsolu); }
            }

            return await _photoRepo.SupprimerAsync(photoId);
        }

        public async Task<(byte[] contenu, string typeContenu, string nomFichier)?> TelechargerAsync(Guid photoId)
        {
            var photo = await _photoRepo.ObtenirParIdAsync(photoId);
            if (photo == null) return null;

            var cheminAbsolu = ResoudrChemin(photo.CheminFichier);
            if (!File.Exists(cheminAbsolu))
            {
                _logger.LogWarning("Fichier photo introuvable sur disque : {Path}", cheminAbsolu);
                return null;
            }

            var contenu = await File.ReadAllBytesAsync(cheminAbsolu);
            return (contenu, photo.TypeContenu, photo.NomFichier);
        }

        // Résout un chemin qui peut être relatif (nouveau format) OU absolu (ancien format)
        private string ResoudrChemin(string cheminStocke)
        {
            if (string.IsNullOrWhiteSpace(cheminStocke)) return string.Empty;
            if (Path.IsPathRooted(cheminStocke)) return cheminStocke; // rétro-compatibilité
            return Path.Combine(_env.ContentRootPath, "wwwroot", cheminStocke);
        }

        private static PhotoCommerceReponseDto ToDto(PhotoCommerce p) => new()
        {
            Id            = p.Id,
            CommerceId    = p.CommerceId,
            NomFichier    = p.NomFichier,
            TypeContenu   = p.TypeContenu,
            TailleFichier = p.TailleFichier,
            Ordre         = p.Ordre,
            DateAjout     = p.DateAjout,
            UrlImage      = $"/api/commerces/{p.CommerceId}/photos/{p.Id}/image"
        };
    }
}
