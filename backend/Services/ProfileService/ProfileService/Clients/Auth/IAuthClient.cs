namespace ProfileService.Clients.Auth;

public interface IAuthClient
{
    Task<bool> GrantMerchantRoleAsync(Guid userId, CancellationToken ct);
}