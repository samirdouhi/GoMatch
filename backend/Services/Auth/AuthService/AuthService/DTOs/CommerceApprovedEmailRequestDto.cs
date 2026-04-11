namespace AuthService.DTOs
{
    public sealed class CommerceApprovedEmailRequestDto
    {
        public string To { get; set; } = string.Empty;
        public string? FullName { get; set; }
    }
}