using CultureService.Models;
using Microsoft.EntityFrameworkCore;

namespace CultureService.Data;

public class ContexteBdCulture : DbContext
{
    public ContexteBdCulture(DbContextOptions<ContexteBdCulture> options)
        : base(options) { }

    public DbSet<ContenuCulturel> ContenusCulturels { get; set; }
    public DbSet<CategorieCulturelle> CategoriesCulturelles { get; set; }
    public DbSet<TagCulturel> TagsCulturels { get; set; }
    public DbSet<MediaContenu> MediasContenus { get; set; }
    public DbSet<TraductionContenu> TraductionsContenus { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ContexteBdCulture).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
