using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProfileService.Models;

namespace ProfileService.Data.Configurations;

public sealed class CommercantProfileConfiguration : IEntityTypeConfiguration<CommercantProfile>
{
    public void Configure(EntityTypeBuilder<CommercantProfile> b)
    {
        b.ToTable("CommercantProfiles");

        b.HasKey(x => x.Id);

        b.Property(x => x.UserProfileId)
            .IsRequired();

        b.Property(x => x.UserId)
            .IsRequired();

        b.HasIndex(x => x.UserProfileId)
            .IsUnique();

        b.HasIndex(x => x.UserId)
            .IsUnique();

        b.Property(x => x.NomResponsable)
            .HasMaxLength(150);

        b.Property(x => x.Telephone)
            .HasMaxLength(20);

        b.Property(x => x.EmailProfessionnel)
            .HasMaxLength(150);

        b.Property(x => x.Ville)
            .HasMaxLength(100);

        b.Property(x => x.AdresseProfessionnelle)
            .HasMaxLength(250);

        b.Property(x => x.TypeActivite)
            .HasMaxLength(100);

        b.Property(x => x.RejectionReason)
            .HasMaxLength(500);

        b.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        b.HasIndex(x => x.Status);

        b.HasIndex(x => x.CommerceId)
            .IsUnique()
            .HasFilter("[CommerceId] IS NOT NULL");

        b.HasIndex(x => x.Telephone);

        b.HasIndex(x => x.EmailProfessionnel);

        b.Property(x => x.InscriptionTerminee)
            .IsRequired();

        b.Property(x => x.CreatedAt)
            .IsRequired();

        b.Property(x => x.UpdatedAt)
            .IsRequired();
    }
}