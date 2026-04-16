using ServiceDecouverte.Dtos;
using ServiceDecouverte.Models;

namespace ServiceDecouverte.Mappers;

public interface IPlaceMapper
{
    Place ToEntity(PlaceCreateDto dto);
    PlaceReadDto ToReadDto(Place entity);
    List<PlaceReadDto> ToReadDtoList(IEnumerable<Place> entities);
}