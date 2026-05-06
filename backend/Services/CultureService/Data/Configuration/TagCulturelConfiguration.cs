using CultureService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CultureService.Data.Configuration;

public class TagCulturelConfiguration : IEntityTypeConfiguration<TagCulturel>
{
    public void Configure(EntityTypeBuilder<TagCulturel> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        builder.Property(t => t.Nom).IsRequired().HasMaxLength(100);
        builder.HasIndex(t => t.Nom).IsUnique();
    }
}
