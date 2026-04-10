using Microsoft.EntityFrameworkCore;
using ProfileService.Data;
using ProfileService.Enums;
using ProfileService.Models;

namespace ProfileService.Repositories.Commercant;

public sealed class CommercantProfileRepository : ICommercantProfileRepository
{
    private readonly ProfileDbContext _context;

    public CommercantProfileRepository(ProfileDbContext context)
    {
        _context = context;
    }

    public async Task<CommercantProfile?> GetByUserIdAsync(Guid userId)
    {
        return await _context.CommercantProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);
    }

    public async Task<CommercantProfile?> GetByCommerceIdAsync(Guid commerceId)
    {
        return await _context.CommercantProfiles
            .FirstOrDefaultAsync(p => p.CommerceId == commerceId);
    }

    public async Task<CommercantProfile?> GetByIdAsync(Guid id)
    {
        return await _context.CommercantProfiles
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<List<CommercantProfile>> GetByStatusAsync(CommercantStatus status)
    {
        return await _context.CommercantProfiles
            .Where(p => p.Status == status)
            .OrderByDescending(p => p.SubmittedAt)
            .ToListAsync();
    }

    public async Task<bool> ExistsByUserIdAsync(Guid userId)
    {
        return await _context.CommercantProfiles
            .AnyAsync(p => p.UserId == userId);
    }

    public async Task AddAsync(CommercantProfile profile)
    {
        await _context.CommercantProfiles.AddAsync(profile);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
    public async Task<CommercantProfile?> GetByVerificationTokenAsync(string token)
    {
        return await _context.CommercantProfiles
            .FirstOrDefaultAsync(x => x.ProfessionalEmailVerificationToken == token);
    }
}