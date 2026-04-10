namespace AuthService.DTOs;

public sealed class SendMerchantSubmissionReceivedEmailRequestDto
{
    public string To { get; set; } = string.Empty;
    public string? FullName { get; set; }
}