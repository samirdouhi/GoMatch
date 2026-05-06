using CultureService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CultureService.Data.Configuration;

public class ContenuCulturelConfiguration : IEntityTypeConfiguration<ContenuCulturel>
{
    public void Configure(EntityTypeBuilder<ContenuCulturel> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(c => c.Titre)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(c => c.Corps)
            .IsRequired();

        builder.Property(c => c.Resume)
            .HasMaxLength(1000);

        builder.Property(c => c.Lieu)
            .HasMaxLength(300);

        builder.Property(c => c.Statut)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.LangueOriginale)
            .IsRequired()
            .HasMaxLength(10);

        builder.HasOne(c => c.Categorie)
            .WithMany(cat => cat.Contenus)
            .HasForeignKey(c => c.CategorieId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Tags)
            .WithMany(t => t.Contenus)
            .UsingEntity(j => j.ToTable("ContenuCulturelTag"));

        builder.HasMany(c => c.Medias)
            .WithOne(m => m.ContenuCulturel)
            .HasForeignKey(m => m.ContenuCulturelId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Traductions)
            .WithOne(t => t.ContenuCulturel)
            .HasForeignKey(t => t.ContenuCulturelId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
