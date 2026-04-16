using ServiceDecouverte.Models;

namespace ServiceDecouverte.Repositories;

public interface IPlaceRepository
{
    Task<List<Place>> GetAllAsync();
    Task<Place?> GetByIdAsync(Guid id);
    Task<Place> AddAsync(Place place);
    Task<Place?> UpdateAsync(Place place);
    Task<bool> DeleteAsync(Guid id);
    Task<IEnumerable<Place>> FilterAsync(string? type, string? ville);
}