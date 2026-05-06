using CultureService.DTOs.CategorieCulturelle;
using CultureService.Models;

namespace CultureService.Mappers;

public static class CategorieCulturelleMapper
{
    public static CategorieCulturelleReponseDto ToResponse(CategorieCulturelle c) => new()
    {
        Id = c.Id, Nom = c.Nom, Description = c.Description,
        Icone = c.Icone, DateCreation = c.DateCreation
    };

    public static CategorieCulturelle ToEntity(CreerCategorieCulturelleRequeteDto dto) => new()
    {
        Id = Guid.NewGuid(), Nom = dto.Nom, Description = dto.Description,
        Icone = dto.Icone, DateCreation = DateTime.UtcNow
    };

    public static void ApplyUpdate(CategorieCulturelle c, ModifierCategorieCulturelleRequeteDto dto)
    {
        c.Nom = dto.Nom; c.Description = dto.Description; c.Icone = dto.Icone;
    }
}
