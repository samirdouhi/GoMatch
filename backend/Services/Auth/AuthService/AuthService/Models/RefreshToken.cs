namespace AuthService.Models
{
    public class RefreshToken
    {
        public Guid Id { get; set; }

        public string Token { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public DateTime CreatedAtUtc { get; set; }
        public DateTime ExpiresAtUtc { get; set; }

        // ✅ AJOUTE CES 2 PROPRIÉTÉS
        public DateTime? RevokedAtUtc { get; set; }
        public string? ReplacedByToken { get; set; }
    }
}
