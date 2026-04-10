using AuthService.Models;

namespace AuthService.Repositories;

public interface IRefreshTokenRepository
{
    Task AddAsync(RefreshToken token, CancellationToken ct);

    Task<RefreshToken?> GetByTokenWithUserAsync(string token, CancellationToken ct);

    Task RevokeAllActiveForUserAsync(Guid userId, DateTime revokedAtUtc, CancellationToken ct);

    Task SaveChangesAsync(CancellationToken ct);
}
