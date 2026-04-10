using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProfileService.Models;

namespace ProfileService.Data.Configurations;

public sealed class TouristeProfileConfiguration : IEntityTypeConfiguration<TouristeProfile>
{
    public void Configure(EntityTypeBuilder<TouristeProfile> b)
    {
        b.ToTable("TouristeProfiles");

        b.HasKey(x => x.Id);

        b.Property(x => x.UserProfileId)
            .IsRequired();

        b.Property(x => x.UserId)
            .IsRequired();

        b.HasIndex(x => x.UserProfileId)
            .IsUnique();

        b.HasIndex(x => x.UserId)
            .IsUnique();

        b.Property(x => x.Nationalite)
            .HasMaxLength(100);

        b.Property(x => x.PreferencesJson)
            .HasColumnType("nvarchar(max)");

        b.Property(x => x.EquipesSuiviesJson)
            .HasColumnType("nvarchar(max)");

        b.Property(x => x.InscriptionTerminee)
            .IsRequired();

        b.Property(x => x.CreatedAt)
            .IsRequired();

        b.Property(x => x.UpdatedAt)
            .IsRequired();
    }
}