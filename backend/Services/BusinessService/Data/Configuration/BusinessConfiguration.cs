using BusinessService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BusinessService.Data.Configuration
{
    public class CommerceConfiguration : IEntityTypeConfiguration<Commerce>
    {
        public void Configure(EntityTypeBuilder<Commerce> builder)
        {
            builder.ToTable("Commerces");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.Nom)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(c => c.Description)
                .IsRequired()
                .HasMaxLength(1000);

            builder.Property(c => c.Adresse)
                .IsRequired()
                .HasMaxLength(250);

            builder.Property(c => c.Latitude)
                .IsRequired();

            builder.Property(c => c.Longitude)
                .IsRequired();

            builder.Property(c => c.ProprietaireUtilisateurId)
                .IsRequired();

            builder.Property(c => c.EstValide)
                .HasDefaultValue(false);

            builder.Property(c => c.DateCreation)
                .IsRequired();

            builder.HasOne(c => c.Categorie)
                .WithMany(cat => cat.Commerces)
                .HasForeignKey(c => c.CategorieId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(c => c.TagsCulturels)
                .WithMany(t => t.Commerces)
                .UsingEntity(j => j.ToTable("CommerceTagCulturel"));
        }
    }
}