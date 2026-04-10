namespace ProfileService.DTOs.Common;

public sealed class UserProfileSummaryDto
{
    public Guid UserId { get; set; }
    public string? Prenom { get; set; }
    public string? Nom { get; set; }
    public DateOnly? DateNaissance { get; set; }
    public string? Genre { get; set; }
    public string? Langue { get; set; }
    public string? PhotoUrl { get; set; }
    public bool IsActive { get; set; }
}