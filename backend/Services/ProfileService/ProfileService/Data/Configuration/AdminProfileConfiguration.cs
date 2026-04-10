using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProfileService.Models;

namespace ProfileService.Data.Configurations;

public sealed class AdminProfileConfiguration : IEntityTypeConfiguration<AdminProfile>
{
    public void Configure(EntityTypeBuilder<AdminProfile> b)
    {
        b.ToTable("AdminProfiles");

        b.HasKey(x => x.Id);

        b.Property(x => x.UserProfileId)
            .IsRequired();

        b.Property(x => x.UserId)
            .IsRequired();

        b.HasIndex(x => x.UserProfileId)
            .IsUnique();

        b.HasIndex(x => x.UserId)
            .IsUnique();

        b.Property(x => x.Departement)
            .HasMaxLength(100);

        b.Property(x => x.Fonction)
            .HasMaxLength(100);

        b.Property(x => x.TelephoneProfessionnel)
            .HasMaxLength(20);

        b.HasIndex(x => x.Departement);

        b.Property(x => x.InscriptionTerminee)
            .IsRequired();

        b.Property(x => x.CreatedAt)
            .IsRequired();

        b.Property(x => x.UpdatedAt)
            .IsRequired();
    }
}