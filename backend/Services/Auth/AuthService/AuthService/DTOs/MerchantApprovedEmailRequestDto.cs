namespace AuthService.DTOs;

public sealed class MerchantApprovedEmailRequestDto
{
    public string To { get; set; } = string.Empty;
    public string? FullName { get; set; }
}