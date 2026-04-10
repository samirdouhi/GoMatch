using System.ComponentModel.DataAnnotations;

namespace ProfileService.Models;

public class AdminProfile
{
    public Guid Id { get; set; }

    public Guid UserProfileId { get; set; }
    public Guid UserId { get; set; }

    [MaxLength(100)]
    public string? Departement { get; set; }

    [MaxLength(100)]
    public string? Fonction { get; set; }

    [MaxLength(20)]
    public string? TelephoneProfessionnel { get; set; }

    public bool InscriptionTerminee { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public UserProfile UserProfile { get; set; } = null!;
}