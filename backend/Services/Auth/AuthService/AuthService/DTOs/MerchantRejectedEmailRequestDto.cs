namespace AuthService.DTOs;

public sealed class MerchantRejectedEmailRequestDto
{
    public string To { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string? FullName { get; set; }
}