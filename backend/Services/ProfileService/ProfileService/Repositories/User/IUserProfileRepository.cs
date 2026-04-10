using ProfileService.Models;

namespace ProfileService.Repositories.UserProfiles;

public interface IUserProfileRepository
{
    Task<UserProfile?> GetByUserIdAsync(Guid userId);
    Task<bool> ExistsByUserIdAsync(Guid userId);
    Task AddAsync(UserProfile profile);
    void Update(UserProfile profile);
    Task SaveChangesAsync();
}