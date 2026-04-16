using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using ServiceDecouverte.Models;

namespace ServiceDecouverte.Data;

public class ContexteBdDecouverte : DbContext
{
    public ContexteBdDecouverte(DbContextOptions<ContexteBdDecouverte> options)
        : base(options)
    {
    }

    public DbSet<Place> Places => Set<Place>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var listToStringConverter = new ValueConverter<List<string>, string>(
            v => string.Join(";", v),
            v => string.IsNullOrWhiteSpace(v)
                ? new List<string>()
                : v.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList()
        );

        var listValueComparer = new ValueComparer<List<string>>(
            (c1, c2) =>
                (c1 ?? new List<string>()).SequenceEqual(c2 ?? new List<string>()),
            c => c == null
                ? 0
                : c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
            c => c == null ? new List<string>() : c.ToList()
        );

        modelBuilder.Entity<Place>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Nom)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(p => p.Description)
                .HasMaxLength(2000);

            entity.Property(p => p.Type)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(p => p.Adresse)
                .HasMaxLength(300);

            entity.Property(p => p.Ville)
                .HasMaxLength(100);

            entity.Property(p => p.Tags)
                .HasConversion(listToStringConverter)
                .Metadata.SetValueComparer(listValueComparer);

            entity.Property(p => p.Images)
                .HasConversion(listToStringConverter)
                .Metadata.SetValueComparer(listValueComparer);
        });
    }
}