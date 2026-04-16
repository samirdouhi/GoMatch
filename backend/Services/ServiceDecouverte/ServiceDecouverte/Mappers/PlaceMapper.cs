using ServiceDecouverte.Dtos;
using ServiceDecouverte.Models;

namespace ServiceDecouverte.Mappers;

public class PlaceMapper : IPlaceMapper
{
    public Place ToEntity(PlaceCreateDto dto)
    {
        return new Place
        {
            Id = Guid.NewGuid(),
            Nom = dto.Nom,
            Description = dto.Description,
            Type = dto.Type,
            Adresse = dto.Adresse,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Ville = dto.Ville,
            Tags = dto.Tags ?? new List<string>(),
            Note = dto.Note,
            PrixMoyen = dto.PrixMoyen,
            Images = dto.Images ?? new List<string>(),
            EstOuvert = dto.EstOuvert,
            HorairesOuverture = dto.HorairesOuverture,
            Popularite = dto.Popularite
        };
    }

    public PlaceReadDto ToReadDto(Place entity)
    {
        return new PlaceReadDto
        {
            Id = entity.Id,
            Nom = entity.Nom,
            Description = entity.Description,
            Type = entity.Type,
            Adresse = entity.Adresse,
            Latitude = entity.Latitude,
            Longitude = entity.Longitude,
            Ville = entity.Ville,
            Tags = entity.Tags ?? new List<string>(),
            Note = entity.Note,
            PrixMoyen = entity.PrixMoyen,
            Images = entity.Images ?? new List<string>(),
            EstOuvert = entity.EstOuvert,
            HorairesOuverture = entity.HorairesOuverture,
            Popularite = entity.Popularite
        };
    }

    public List<PlaceReadDto> ToReadDtoList(IEnumerable<Place> entities)
    {
        return entities.Select(ToReadDto).ToList();
    }
}