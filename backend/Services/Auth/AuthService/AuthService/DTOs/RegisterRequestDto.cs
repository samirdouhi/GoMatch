using System.ComponentModel.DataAnnotations;

namespace AuthService.DTOs;

public sealed class RegisterRequestDto
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = default!;

    [Required, MinLength(8), MaxLength(128)]
    public string Password { get; init; } = default!;
}
