namespace AuthService.DTOs
{
    public class RefreshResponseDto
    {
        public string AccessToken { get; set; } = default!;
        public DateTime ExpiresAtUtc { get; set; }
        public string RefreshToken { get; set; } = default!;
    }
}
