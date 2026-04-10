using AuthService.Data;
using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Repositories;

public sealed class UserRepository : IUserRepository
{
    private readonly AuthDbContext _db;

    public UserRepository(AuthDbContext db)
    {
        _db = db;
    }

    public Task<bool> EmailExisteAsync(string emailNormalise, CancellationToken ct)
    {
        return _db.Users
            .AsNoTracking()
            .AnyAsync(u => u.Email == emailNormalise, ct);
    }

    public Task<User?> GetByEmailAsync(string emailNormalise, CancellationToken ct)
    {
        return _db.Users
            .FirstOrDefaultAsync(u => u.Email == emailNormalise, ct);
    }

    public Task<User?> GetByIdAsync(Guid userId, CancellationToken ct)
    {
        return _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
    }

    public Task<User?> GetByEmailConfirmationTokenAsync(string token, CancellationToken ct)
    {
        return _db.Users
            .FirstOrDefaultAsync(u => u.EmailConfirmationToken == token, ct);
    }

    public Task AjouterAsync(User utilisateur, CancellationToken ct)
    {
        return _db.Users.AddAsync(utilisateur, ct).AsTask();
    }

    public Task SauvegarderAsync(CancellationToken ct)
    {
        return _db.SaveChangesAsync(ct);
    }
}