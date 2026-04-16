using ServiceDecouverte.Dtos;

namespace ServiceDecouverte.Services;

public interface IPlaceService
{
    Task<List<PlaceReadDto>> GetAllAsync();
    Task<PlaceReadDto?> GetByIdAsync(Guid id);
    Task<PlaceReadDto> CreateAsync(PlaceCreateDto dto);
    Task<PlaceReadDto?> UpdateAsync(Guid id, PlaceCreateDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<List<PlaceReadDto>> FilterAsync(string? type, string? ville);
}