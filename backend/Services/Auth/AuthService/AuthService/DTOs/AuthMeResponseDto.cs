namespace AuthService.DTOs;

public sealed class AuthMeResponseDto
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
}