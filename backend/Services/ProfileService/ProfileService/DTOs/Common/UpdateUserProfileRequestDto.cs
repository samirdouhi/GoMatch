using System.ComponentModel.DataAnnotations;

namespace ProfileService.DTOs.Common;

public sealed class UpdateUserProfileRequestDto
{
    [Required]
    [MaxLength(100)]
    public string Prenom { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Nom { get; set; } = string.Empty;

    [Required]
    public DateTime DateNaissance { get; set; }

    [Required]
    public string Genre { get; set; } = string.Empty;

    public string? Langue { get; set; }
}