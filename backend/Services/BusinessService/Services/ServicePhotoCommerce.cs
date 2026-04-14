using BusinessService.DTOs;
using BusinessService.Models;
using BusinessService.Repositories;
using Microsoft.AspNetCore.Http;

namespace BusinessService.Services
{
    public class ServicePhotoCommerce : IServicePhotoCommerce
    {
        private static readonly string[] ExtensionsAutorisees = { ".jpg", ".jpeg", ".png", ".webp" };
        private const int MaxPhotosParCommerce = 10;
        private const long TailleMaxFichier = 10 * 1024 * 1024; // 10 MB

        private readonly IPhotoCommerceRepository _photoRepo;
        private readonly ICommerceRepository _commerceRepo;

        public ServicePhotoCommerce(
            IPhotoCommerceRepository photoRepo,
            ICommerceRepository commerceRepo)
        {
            _photoRepo = photoRepo;
            _commerceRepo = commerceRepo;
        }

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

            var photoId = Guid.NewGuid();
            var nomFichier = $"{photoId}{extension}";
            var dossier = Path.Combine(
                Directory.GetCurrentDirectory(), "wwwroot", "uploads", "commerces", commerceId.ToString());

            Directory.CreateDirectory(dossier);

            var chemin = Path.Combine(dossier, nomFichier);
            using (var stream = new FileStream(chemin, FileMode.Create))
            {
                await fichier.CopyToAsync(stream);
            }

            var photo = new PhotoCommerce
            {
                Id            = photoId,
                CommerceId    = commerceId,
                NomFichier    = fichier.FileName,
                CheminFichier = chemin,
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

            if (File.Exists(photo.CheminFichier))
                File.Delete(photo.CheminFichier);

            return await _photoRepo.SupprimerAsync(photoId);
        }

        public async Task<(byte[] contenu, string typeContenu, string nomFichier)?> TelechargerAsync(Guid photoId)
        {
            var photo = await _photoRepo.ObtenirParIdAsync(photoId);
            if (photo == null || !File.Exists(photo.CheminFichier))
                return null;

            var contenu = await File.ReadAllBytesAsync(photo.CheminFichier);
            return (contenu, photo.TypeContenu, photo.NomFichier);
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
