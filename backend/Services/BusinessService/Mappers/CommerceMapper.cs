using BusinessService.DTOs;
using BusinessService.Models;

namespace BusinessService.Mappers
{
    public static class CommerceMapper
    {
        public static CommerceReponseDto ToResponse(Commerce commerce)
        {
            return new CommerceReponseDto
            {
                Id = commerce.Id,
                Nom = commerce.Nom,
                Description = commerce.Description,
                Adresse = commerce.Adresse,
                Latitude = commerce.Latitude,
                Longitude = commerce.Longitude,
                ProprietaireUtilisateurId = commerce.ProprietaireUtilisateurId,
                EstValide = commerce.EstValide,
                DateCreation = commerce.DateCreation,
                CategorieId = commerce.CategorieId,
                NomCategorie = commerce.Categorie?.Nom,
                TagsCulturels = commerce.TagsCulturels.Select(t => t.Nom).ToList(),
                Horaires = commerce.Horaires.Select(HoraireCommerceMapper.ToResponse).ToList()
            };
        }

        public static CommerceProcheReponseDto ToNearbyResponse(Commerce commerce, double distanceKm)
        {
            return new CommerceProcheReponseDto
            {
                Id = commerce.Id,
                Nom = commerce.Nom,
                Description = commerce.Description,
                Adresse = commerce.Adresse,
                Latitude = commerce.Latitude,
                Longitude = commerce.Longitude,
                DistanceKm = distanceKm,
                NomCategorie = commerce.Categorie?.Nom ?? string.Empty,
                TagsCulturels = commerce.TagsCulturels.Select(t => t.Nom).ToList()
            };
        }

        public static Commerce ToEntity(CreerCommerceRequeteDto request, Guid proprietaireUtilisateurId)
        {
            return new Commerce
            {
                Id = Guid.NewGuid(),
                Nom = request.Nom,
                Description = request.Description,
                Adresse = request.Adresse,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                CategorieId = request.CategorieId,
                ProprietaireUtilisateurId = proprietaireUtilisateurId,
                EstValide = false,
                DateCreation = DateTime.UtcNow
            };
        }

        public static void ApplyUpdate(Commerce commerce, ModifierCommerceRequeteDto request)
        {
            commerce.Nom = request.Nom;
            commerce.Description = request.Description;
            commerce.Adresse = request.Adresse;
            commerce.Latitude = request.Latitude;
            commerce.Longitude = request.Longitude;
            commerce.CategorieId = request.CategorieId;
        }
    }
}