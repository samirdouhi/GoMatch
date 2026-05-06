using CultureService.DTOs.TagCulturel;
using CultureService.Models;

namespace CultureService.Mappers;

public static class TagCulturelMapper
{
    public static TagCulturelReponseDto ToResponse(TagCulturel t) => new()
    {
        Id = t.Id, Nom = t.Nom, DateCreation = t.DateCreation
    };

    public static TagCulturel ToEntity(CreerTagCulturelRequeteDto dto) => new()
    {
        Id = Guid.NewGuid(), Nom = dto.Nom, DateCreation = DateTime.UtcNow
    };
}
