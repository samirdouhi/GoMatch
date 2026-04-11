namespace AuthService.DTOs
{
    public sealed class CommerceSubmissionReceivedEmailRequestDto
    {
        public string To { get; set; } = string.Empty;
        public string? FullName { get; set; }
    }
}