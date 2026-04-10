using ProfileService.Enums;
using ProfileService.Models;

namespace ProfileService.Repositories.Commercant;

public interface ICommercantProfileRepository
{
    Task<CommercantProfile?> GetByUserIdAsync(Guid userId);
    Task<CommercantProfile?> GetByCommerceIdAsync(Guid commerceId);
    Task<CommercantProfile?> GetByIdAsync(Guid id);
    Task<List<CommercantProfile>> GetByStatusAsync(CommercantStatus status);
    Task<bool> ExistsByUserIdAsync(Guid userId);
    Task AddAsync(CommercantProfile profile);
    Task SaveChangesAsync();
    Task<CommercantProfile?> GetByVerificationTokenAsync(string token);
}