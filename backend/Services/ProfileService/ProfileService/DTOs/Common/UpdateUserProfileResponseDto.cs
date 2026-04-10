namespace ProfileService.DTOs.Common;

public sealed class UpdateUserProfileResponseDto
{
    public string Prenom { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public DateOnly DateNaissance { get; set; }
    public string Genre { get; set; } = string.Empty;
    public string? Langue { get; set; }
    public string? PhotoUrl { get; set; }
}