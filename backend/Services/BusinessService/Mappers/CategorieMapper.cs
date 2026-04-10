using BusinessService.DTOs;
using BusinessService.Models;

namespace BusinessService.Mappers
{
    public static class CategorieMapper
    {
        public static CategorieResponseDto ToResponse(Categorie categorie)
        {
            return new CategorieResponseDto
            {
                Id = categorie.Id,
                Nom = categorie.Nom
            };
        }

        public static Categorie ToEntity(CreerCategorieRequestDto dto)
        {
            return new Categorie
            {
                Id = Guid.NewGuid(),
                Nom = dto.Nom
            };
        }

        public static void ApplyUpdate(Categorie categorie, ModifierCategorieRequestDto dto)
        {
            categorie.Nom = dto.Nom;
        }
    }
}