using ProfileService.Models;

namespace ProfileService.Repositories.Admin;

public interface IAdminProfileRepository
{
    Task<AdminProfile?> GetByUserIdAsync(Guid userId);
    Task<bool> ExistsByUserIdAsync(Guid userId);
    Task AddAsync(AdminProfile profile);
    Task SaveChangesAsync();
}