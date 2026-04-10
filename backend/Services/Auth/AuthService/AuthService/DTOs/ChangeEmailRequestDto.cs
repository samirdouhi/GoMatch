using System.ComponentModel.DataAnnotations;

namespace AuthService.DTOs;

public sealed class ChangeEmailRequestDto
{
    [Required]
    [EmailAddress]
    public string NewEmail { get; set; } = string.Empty;

    [Required]
    public string CurrentPassword { get; set; } = string.Empty;
}