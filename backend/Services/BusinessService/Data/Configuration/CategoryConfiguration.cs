using BusinessService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BusinessService.Data.Configuration
{
    public class CategorieConfiguration : IEntityTypeConfiguration<Categorie>
    {
        public void Configure(EntityTypeBuilder<Categorie> builder)
        {
            builder.ToTable("Categories");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.Nom)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(c => c.Nom)
                .IsUnique();

            builder.HasMany(c => c.Commerces)
                .WithOne(c => c.Categorie)
                .HasForeignKey(c => c.CategorieId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}