using ProfileService.Models;

namespace ProfileService.Repositories.Touriste;

public interface ITouristeProfileRepository
{
    Task<TouristeProfile?> GetByUserIdAsync(Guid userId);
    Task<bool> ExistsByUserIdAsync(Guid userId);
    Task AddAsync(TouristeProfile profile);
    Task SaveChangesAsync();
}