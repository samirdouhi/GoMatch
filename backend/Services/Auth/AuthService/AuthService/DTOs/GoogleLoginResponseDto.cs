namespace AuthService.DTOs;

public sealed class GoogleLoginResponseDto
{
    public bool RequiresRegistration { get; set; }

    public string? Email { get; set; }
    public string? Prenom { get; set; }
    public string? Nom { get; set; }

    public LoginResponseDto? Login { get; set; }
}