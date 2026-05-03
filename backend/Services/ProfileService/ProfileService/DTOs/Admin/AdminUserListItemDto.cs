namespace ProfileService.DTOs.Admin;

public sealed record AdminUserListItemDto
{
    public Guid UserId { get; init; }
    public string? Prenom { get; init; }
    public string? Nom { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public string ProfileType { get; init; } = "Aucun";
}
