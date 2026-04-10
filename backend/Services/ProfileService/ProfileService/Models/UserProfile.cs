using ProfileService.Enums;
using System.ComponentModel.DataAnnotations;

namespace ProfileService.Models;

public class UserProfile
{
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [MaxLength(100)]
    public string? Prenom { get; set; }

    [MaxLength(100)]
    public string? Nom { get; set; }

    public DateOnly? DateNaissance { get; set; }

    public Genre? Genre { get; set; }

    [MaxLength(500)]
    public string? PhotoPath { get; set; }

    public Langue Langue { get; set; } = Langue.FR;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public TouristeProfile? TouristeProfile { get; set; }
    public CommercantProfile? CommercantProfile { get; set; }
    public AdminProfile? AdminProfile { get; set; }
}