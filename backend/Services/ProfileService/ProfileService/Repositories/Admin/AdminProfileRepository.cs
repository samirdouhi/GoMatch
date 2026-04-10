using Microsoft.EntityFrameworkCore;
using ProfileService.Data;
using ProfileService.Models;

namespace ProfileService.Repositories.Admin;

public sealed class AdminProfileRepository : IAdminProfileRepository
{
    private readonly ProfileDbContext _context;

    public AdminProfileRepository(ProfileDbContext context)
    {
        _context = context;
    }

    public async Task<AdminProfile?> GetByUserIdAsync(Guid userId)
    {
        return await _context.AdminProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);
    }

    public async Task<bool> ExistsByUserIdAsync(Guid userId)
    {
        return await _context.AdminProfiles
            .AnyAsync(p => p.UserId == userId);
    }

    public async Task AddAsync(AdminProfile profile)
    {
        await _context.AdminProfiles.AddAsync(profile);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}