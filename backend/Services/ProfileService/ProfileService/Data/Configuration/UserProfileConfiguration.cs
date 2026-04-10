using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProfileService.Models;

namespace ProfileService.Data.Configurations;

public sealed class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> b)
    {
        b.ToTable("UserProfiles");

        b.HasKey(x => x.Id);

        b.Property(x => x.UserId)
            .IsRequired();

        b.HasIndex(x => x.UserId)
            .IsUnique();

        b.Property(x => x.Prenom)
            .HasMaxLength(100);

        b.Property(x => x.Nom)
            .HasMaxLength(100);

        b.Property(x => x.PhotoPath)
            .HasMaxLength(500);

        b.Property(x => x.Langue)
            .HasConversion<string>()
            .HasMaxLength(10)
            .IsRequired();

        b.Property(x => x.CreatedAt)
            .IsRequired();

        b.Property(x => x.UpdatedAt)
            .IsRequired();

        b.Property(x => x.IsActive)
            .IsRequired();

        b.HasOne(x => x.TouristeProfile)
            .WithOne(x => x.UserProfile)
            .HasForeignKey<TouristeProfile>(x => x.UserProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.CommercantProfile)
            .WithOne(x => x.UserProfile)
            .HasForeignKey<CommercantProfile>(x => x.UserProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.AdminProfile)
            .WithOne(x => x.UserProfile)
            .HasForeignKey<AdminProfile>(x => x.UserProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}