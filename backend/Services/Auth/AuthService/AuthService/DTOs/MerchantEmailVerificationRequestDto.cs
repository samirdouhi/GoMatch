namespace AuthService.DTOs;

public sealed class MerchantEmailVerificationRequestDto
{
    public string To { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string? FullName { get; set; }
}