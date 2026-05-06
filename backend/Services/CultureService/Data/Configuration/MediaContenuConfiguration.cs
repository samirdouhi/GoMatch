using CultureService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CultureService.Data.Configuration;

public class MediaContenuConfiguration : IEntityTypeConfiguration<MediaContenu>
{
    public void Configure(EntityTypeBuilder<MediaContenu> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        builder.Property(m => m.Url).IsRequired().HasMaxLength(2000);
        builder.Property(m => m.Type).IsRequired().HasMaxLength(50);
        builder.Property(m => m.Legende).HasMaxLength(500);
    }
}
