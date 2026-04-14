using BusinessService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BusinessService.Data.Configuration
{
    public class PhotoCommerceConfiguration : IEntityTypeConfiguration<PhotoCommerce>
    {
        public void Configure(EntityTypeBuilder<PhotoCommerce> builder)
        {
            builder.ToTable("PhotosCommerces");

            builder.HasKey(p => p.Id);

            builder.Property(p => p.NomFichier)
                .IsRequired()
                .HasMaxLength(260);

            builder.Property(p => p.CheminFichier)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(p => p.TypeContenu)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(p => p.TailleFichier)
                .IsRequired();

            builder.Property(p => p.Ordre)
                .HasDefaultValue(0);

            builder.Property(p => p.DateAjout)
                .HasDefaultValueSql("GETUTCDATE()");

            builder.HasOne(p => p.Commerce)
                .WithMany(c => c.Photos)
                .HasForeignKey(p => p.CommerceId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
