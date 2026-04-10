using ProfileService.DTOs.Common;

namespace ProfileService.DTOs.Commercant;

public sealed class CommercantProfileResponseDto
{
    public UserProfileSummaryDto UserProfile { get; set; } = new();

    public string? NomResponsable { get; set; }
    public string? Telephone { get; set; }
    public string? EmailProfessionnel { get; set; }
    public string? Ville { get; set; }
    public string? AdresseProfessionnelle { get; set; }
    public string? TypeActivite { get; set; }

    public string? Status { get; set; }
    public string? RejectionReason { get; set; }

    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public Guid? CommerceId { get; set; }
    public bool InscriptionTerminee { get; set; }
}