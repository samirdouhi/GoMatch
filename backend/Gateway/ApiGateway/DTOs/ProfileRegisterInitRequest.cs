using System.ComponentModel.DataAnnotations;

namespace ApiGateway.DTOs;

public class ProfileRegisterInitRequest
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Prenom { get; set; } = default!;

    [Required]
    [MaxLength(100)]
    public string Nom { get; set; } = default!;

    [Required]
    public DateTime DateNaissance { get; set; }

    [Required]
    public string Genre { get; set; } = default!;

    [MaxLength(100)]
    public string? Nationalite { get; set; }
}