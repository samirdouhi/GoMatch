using BusinessService.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessService.Data
{
    public class ContexteBdCommerce : DbContext
    {
        public ContexteBdCommerce(DbContextOptions<ContexteBdCommerce> options)
            : base(options)
        {
        }

        public DbSet<Commerce> Commerces { get; set; }
        public DbSet<Categorie> Categories { get; set; }
        public DbSet<TagCulturel> TagsCulturels { get; set; }
        public DbSet<HoraireCommerce> HorairesCommerces { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ContexteBdCommerce).Assembly);
            base.OnModelCreating(modelBuilder);
        }
    }
}