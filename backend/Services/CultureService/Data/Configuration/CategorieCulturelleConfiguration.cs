using CultureService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CultureService.Data.Configuration;

public class CategorieCulturelleConfiguration : IEntityTypeConfiguration<CategorieCulturelle>
{
    public void Configure(EntityTypeBuilder<CategorieCulturelle> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(c => c.Nom)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(c => c.Description)
            .HasMaxLength(500);

        builder.Property(c => c.Icone)
            .HasMaxLength(100);

        builder.HasIndex(c => c.Nom).IsUnique();
    }
}
