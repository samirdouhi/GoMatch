using System.ComponentModel.DataAnnotations;

namespace ProfileService.DTOs.Touriste;

public sealed class RegisterTouristeProfileRequestDto
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Prenom { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Nom { get; set; } = string.Empty;

    [Required]
    public DateTime DateNaissance { get; set; }

    [Required]
    [MaxLength(50)]
    public string Genre { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Nationalite { get; set; }

    [MaxLength(10)]
    public string? Langue { get; set; }
}