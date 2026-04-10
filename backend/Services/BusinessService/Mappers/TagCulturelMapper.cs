using BusinessService.DTOs;
using BusinessService.Models;

namespace BusinessService.Mappers
{
    public static class TagCulturelMapper
    {
        public static TagCulturelResponseDto ToResponse(TagCulturel tagCulturel)
        {
            return new TagCulturelResponseDto
            {
                Id = tagCulturel.Id,
                Nom = tagCulturel.Nom
            };
        }

        public static TagCulturel ToEntity(CreerTagCulturelRequestDto dto)
        {
            return new TagCulturel
            {
                Id = Guid.NewGuid(),
                Nom = dto.Nom
            };
        }

        public static void ApplyUpdate(TagCulturel tagCulturel, ModifierTagCulturelRequestDto dto)
        {
            tagCulturel.Nom = dto.Nom;
        }
    }
}