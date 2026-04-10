using BusinessService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BusinessService.Data.Configuration
{
    public class TagCulturelConfiguration : IEntityTypeConfiguration<TagCulturel>
    {
        public void Configure(EntityTypeBuilder<TagCulturel> builder)
        {
            builder.ToTable("TagsCulturels");

            builder.HasKey(t => t.Id);

            builder.Property(t => t.Nom)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(t => t.Nom)
                .IsUnique();
        }
    }
}