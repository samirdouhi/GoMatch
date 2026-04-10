using System.ComponentModel.DataAnnotations;

namespace ProfileService.DTOs.Commercant;

public sealed class CompleteCommercantProfileRequestDto
{
    [MaxLength(150)]
    public string? NomResponsable { get; set; }

    [MaxLength(20)]
    public string? Telephone { get; set; }

    [EmailAddress]
    [MaxLength(150)]
    public string? EmailProfessionnel { get; set; }

    [MaxLength(100)]
    public string? Ville { get; set; }

    [MaxLength(250)]
    public string? AdresseProfessionnelle { get; set; }

    [MaxLength(100)]
    public string? TypeActivite { get; set; }

    public Guid? CommerceId { get; set; }
}