using Microsoft.EntityFrameworkCore;
using NotificationService.Models;

namespace NotificationService.Data;

public class NotificationDbContext(DbContextOptions<NotificationDbContext> options) : DbContext(options)
{
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Promotion> Promotions => Set<Promotion>();
    public DbSet<UserNotificationPreference> UserPreferences => Set<UserNotificationPreference>();
    public DbSet<AdminBroadcast> AdminBroadcasts => Set<AdminBroadcast>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Notification>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => new { x.UserId, x.CreatedAt });
        });

        modelBuilder.Entity<Promotion>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.BusinessId);
            e.HasIndex(x => new { x.IsActive, x.StartDate, x.EndDate });
            e.Property(x => x.Budget).HasColumnType("decimal(18,2)");
            e.Property(x => x.BudgetSpent).HasColumnType("decimal(18,2)");
            e.Property(x => x.CostPerImpression).HasColumnType("decimal(18,4)");
        });

        modelBuilder.Entity<UserNotificationPreference>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId).IsUnique();
        });

        modelBuilder.Entity<AdminBroadcast>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.SentAt);
        });
    }
}
