using CultureService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CultureService.Data.Configuration;

public class TraductionContenuConfiguration : IEntityTypeConfiguration<TraductionContenu>
{
    public void Configure(EntityTypeBuilder<TraductionContenu> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        builder.Property(t => t.Langue).IsRequired().HasMaxLength(10);
        builder.Property(t => t.Titre).IsRequired().HasMaxLength(300);
        builder.Property(t => t.Corps).IsRequired();
        builder.Property(t => t.Resume).HasMaxLength(1000);
        // Un seul enregistrement par langue par contenu
        builder.HasIndex(t => new { t.ContenuCulturelId, t.Langue }).IsUnique();
    }
}
