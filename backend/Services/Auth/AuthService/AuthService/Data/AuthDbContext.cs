using AuthService.Enums;
using AuthService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace AuthService.Data
{
    public class AuthDbContext : DbContext
    {
        public AuthDbContext(DbContextOptions<AuthDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = default!;
        public DbSet<RefreshToken> RefreshTokens { get; set; } = default!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(e =>
            {
                e.HasIndex(u => u.Email).IsUnique();

                e.Property(u => u.Email)
                    .HasMaxLength(256)
                    .IsRequired();

                e.Property(u => u.PasswordHash)
                    .IsRequired();

                e.Property(u => u.Roles)
                    .HasConversion(
                        v => string.Join(',', v.Select(r => r.ToString())),
                        v => string.IsNullOrWhiteSpace(v)
                            ? new List<UserRole> { UserRole.Touriste }
                            : v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                .Select(r => Enum.Parse<UserRole>(r))
                                .Distinct()
                                .ToList()
                    )
                    .Metadata.SetValueComparer(
                        new ValueComparer<List<UserRole>>(
                            (c1, c2) => (c1 ?? new List<UserRole>()).SequenceEqual(c2 ?? new List<UserRole>()),
                            c => c == null
                                ? 0
                                : c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                            c => c == null ? new List<UserRole>() : c.ToList()
                        )
                    );

                e.Property(u => u.Roles)
                    .HasMaxLength(200)
                    .IsRequired();

                e.Property(u => u.IsActive)
                    .IsRequired();

                e.Property(u => u.CreatedAt)
                    .IsRequired();

                // ✅ NEW
                e.Property(u => u.EmailConfirmed)
                    .IsRequired()
                    .HasDefaultValue(false);

                e.Property(u => u.EmailConfirmationToken)
                    .HasMaxLength(200)
                    .IsRequired(false);

                e.Property(u => u.EmailConfirmationTokenExpiresAt)
                    .IsRequired(false);

                e.HasIndex(u => u.EmailConfirmationToken)
                    .IsUnique()
                    .HasFilter("[EmailConfirmationToken] IS NOT NULL");
            });

            modelBuilder.Entity<RefreshToken>(e =>
            {
                e.HasKey(rt => rt.Id);

                e.Property(rt => rt.Token)
                    .HasMaxLength(512)
                    .IsRequired();

                e.HasIndex(rt => rt.Token).IsUnique();

                e.Property(rt => rt.CreatedAtUtc).IsRequired();
                e.Property(rt => rt.ExpiresAtUtc).IsRequired();

                e.Property(rt => rt.RevokedAtUtc);
                e.Property(rt => rt.ReplacedByToken).HasMaxLength(512);

                e.HasOne(rt => rt.User)
                    .WithMany()
                    .HasForeignKey(rt => rt.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}