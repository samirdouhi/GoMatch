using ProfileService.Models;

namespace ProfileService.Repositories.UserProfiles;

public interface IUserProfileRepository
{
    Task<UserProfile?> GetByUserIdAsync(Guid userId);
    Task<bool> ExistsByUserIdAsync(Guid userId);
    Task<List<UserProfile>> GetAllAsync();
    Task AddAsync(UserProfile profile);
    void Update(UserProfile profile);
    Task SaveChangesAsync();
}