namespace AuthService.DTOs;

public sealed class ResendConfirmationEmailRequestDto
{
    public string Email { get; set; } = string.Empty;
}