using ProfileService.Enums;
using System.ComponentModel.DataAnnotations;

namespace ProfileService.Models;

public class CommercantProfile
{
    public Guid Id { get; set; }

    public Guid UserProfileId { get; set; }
    public Guid UserId { get; set; }

    [MaxLength(150)]
    public string? NomResponsable { get; set; }

    [MaxLength(20)]
    public string? Telephone { get; set; }

    [MaxLength(150)]
    [EmailAddress]
    public string? EmailProfessionnel { get; set; }

    [MaxLength(100)]
    public string? Ville { get; set; }

    [MaxLength(250)]
    public string? AdresseProfessionnelle { get; set; }

    [MaxLength(100)]
    public string? TypeActivite { get; set; }

    public CommercantStatus Status { get; set; } = CommercantStatus.Incomplete;

    [MaxLength(500)]
    public string? RejectionReason { get; set; }

    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public Guid? CommerceId { get; set; }

    public bool InscriptionTerminee { get; set; }

    [MaxLength(200)]
    public string? ProfessionalEmailVerificationToken { get; set; }

    public DateTime? ProfessionalEmailVerificationTokenExpiresAt { get; set; }

    public bool IsProfessionalEmailVerified { get; set; } = false;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public UserProfile UserProfile { get; set; } = null!;
}