using System.ComponentModel.DataAnnotations;

namespace ProfileService.Models;

public class TouristeProfile
{
    public Guid Id { get; set; }

    public Guid UserProfileId { get; set; }
    public Guid UserId { get; set; }

    [MaxLength(100)]
    public string? Nationalite { get; set; }

    // JSON pour simplifier
    public string? PreferencesJson { get; set; }
    public string? EquipesSuiviesJson { get; set; }

    public bool InscriptionTerminee { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public UserProfile UserProfile { get; set; } = null!;
}