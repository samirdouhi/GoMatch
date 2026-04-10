using AuthService.Data;
using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Repositories;

public sealed class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly AuthDbContext _db;

    public RefreshTokenRepository(AuthDbContext db)
    {
        _db = db;
    }

    public Task AddAsync(RefreshToken token, CancellationToken ct)
        => _db.RefreshTokens.AddAsync(token, ct).AsTask();

    public Task<RefreshToken?> GetByTokenWithUserAsync(string token, CancellationToken ct)
        => _db.RefreshTokens
              .AsTracking()
              .Include(x => x.User)
              .SingleOrDefaultAsync(x => x.Token == token, ct);

    public async Task RevokeAllActiveForUserAsync(Guid userId, DateTime revokedAtUtc, CancellationToken ct)
    {
        var tokens = await _db.RefreshTokens
            .Where(x => x.UserId == userId && x.RevokedAtUtc == null)
            .ToListAsync(ct);

        foreach (var t in tokens)
        {
            t.RevokedAtUtc = revokedAtUtc;
        }
    }

    public Task SaveChangesAsync(CancellationToken ct)
        => _db.SaveChangesAsync(ct);
}
