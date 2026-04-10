using BusinessService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BusinessService.Data.Configuration
{
    public class HoraireCommerceConfiguration : IEntityTypeConfiguration<HoraireCommerce>
    {
        public void Configure(EntityTypeBuilder<HoraireCommerce> builder)
        {
            builder.ToTable("HorairesCommerces");

            builder.HasKey(h => h.Id);

            builder.Property(h => h.JourSemaine)
                .IsRequired();

            builder.Property(h => h.HeureOuverture)
                .IsRequired();

            builder.Property(h => h.HeureFermeture)
                .IsRequired();

            builder.Property(h => h.EstFerme)
                .HasDefaultValue(false);

            builder.HasOne(h => h.Commerce)
                .WithMany(c => c.Horaires)
                .HasForeignKey(h => h.CommerceId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}