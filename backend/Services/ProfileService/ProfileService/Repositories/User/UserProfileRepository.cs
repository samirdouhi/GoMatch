using Microsoft.EntityFrameworkCore;
using ProfileService.Data;
using ProfileService.Models;

namespace ProfileService.Repositories.UserProfiles;

public sealed class UserProfileRepository : IUserProfileRepository
{
    private readonly ProfileDbContext _context;

    public UserProfileRepository(ProfileDbContext context)
    {
        _context = context;
    }

    public async Task<UserProfile?> GetByUserIdAsync(Guid userId)
    {
        return await _context.UserProfiles
            .Include(x => x.TouristeProfile)
            .Include(x => x.CommercantProfile)
            .Include(x => x.AdminProfile)
            .FirstOrDefaultAsync(x => x.UserId == userId);
    }

    public async Task<bool> ExistsByUserIdAsync(Guid userId)
    {
        return await _context.UserProfiles
            .AnyAsync(x => x.UserId == userId);
    }

    public async Task AddAsync(UserProfile profile)
    {
        await _context.UserProfiles.AddAsync(profile);
    }

    public void Update(UserProfile profile)
    {
        _context.UserProfiles.Update(profile);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}