using BusinessService.Data;
using BusinessService.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessService.Repositories
{
    public class CommerceRepository : ICommerceRepository
    {
        private readonly ContexteBdCommerce _context;

        public CommerceRepository(ContexteBdCommerce context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Commerce>> ObtenirToutAsync()
        {
            return await _context.Commerces
                .Include(c => c.Categorie)
                .Include(c => c.TagsCulturels)
                .Include(c => c.Horaires)
                .ToListAsync();
        }

        public async Task<Commerce?> ObtenirParIdAsync(Guid id)
        {
            return await _context.Commerces
                .Include(c => c.Categorie)
                .Include(c => c.TagsCulturels)
                .Include(c => c.Horaires)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task AjouterAsync(Commerce commerce)
        {
            await _context.Commerces.AddAsync(commerce);
        }

        public Task MettreAJourAsync(Commerce commerce)
        {
            _context.Commerces.Update(commerce);
            return Task.CompletedTask;
        }

        public Task SupprimerAsync(Commerce commerce)
        {
            _context.Commerces.Remove(commerce);
            return Task.CompletedTask;
        }

        public async Task SauvegarderAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<Commerce?> AjouterTagsAsync(Guid commerceId, List<Guid> tagIds)
        {
            var commerce = await _context.Commerces
                .Include(c => c.TagsCulturels)
                .Include(c => c.Categorie)
                .Include(c => c.Horaires)
                .FirstOrDefaultAsync(c => c.Id == commerceId);

            if (commerce == null)
            {
                return null;
            }

            if (tagIds == null || tagIds.Count == 0)
            {
                return commerce;
            }

            var tags = await _context.TagsCulturels
                .Where(t => tagIds.Contains(t.Id))
                .ToListAsync();

            foreach (var tag in tags)
            {
                var tagExisteDeja = commerce.TagsCulturels.Any(t => t.Id == tag.Id);

                if (!tagExisteDeja)
                {
                    commerce.TagsCulturels.Add(tag);
                }
            }

            await _context.SaveChangesAsync();

            return commerce;
        }

        public async Task<IEnumerable<Commerce>> ObtenirCommercesProchesAsync(
            double latitude,
            double longitude,
            double rayonKm)
        {
            var commerces = await _context.Commerces
                .Include(c => c.Categorie)
                .Include(c => c.TagsCulturels)
                .Include(c => c.Horaires)
                .Where(c => c.EstValide)
                .ToListAsync();

            return commerces
                .Where(c => CalculerDistanceKm(latitude, longitude, c.Latitude, c.Longitude) <= rayonKm)
                .OrderBy(c => CalculerDistanceKm(latitude, longitude, c.Latitude, c.Longitude))
                .ToList();
        }

        public async Task<IEnumerable<Commerce>> RechercherAsync(
            string? nom,
            string? categorie,
            string? tag,
            bool? estValide)
        {
            IQueryable<Commerce> query = _context.Commerces
                .Include(c => c.Categorie)
                .Include(c => c.TagsCulturels)
                .Include(c => c.Horaires);

            if (!string.IsNullOrWhiteSpace(nom))
            {
                query = query.Where(c => c.Nom.Contains(nom));
            }

            if (!string.IsNullOrWhiteSpace(categorie))
            {
                query = query.Where(c =>
                    c.Categorie != null &&
                    c.Categorie.Nom.Contains(categorie));
            }

            if (!string.IsNullOrWhiteSpace(tag))
            {
                query = query.Where(c =>
                    c.TagsCulturels.Any(t => t.Nom.Contains(tag)));
            }

            if (estValide.HasValue)
            {
                query = query.Where(c => c.EstValide == estValide.Value);
            }

            return await query.ToListAsync();
        }

        private static double CalculerDistanceKm(
            double lat1,
            double lon1,
            double lat2,
            double lon2)
        {
            const double rayonTerreKm = 6371;

            var dLat = ConvertirEnRadians(lat2 - lat1);
            var dLon = ConvertirEnRadians(lon2 - lon1);

            var a =
                Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ConvertirEnRadians(lat1)) * Math.Cos(ConvertirEnRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return rayonTerreKm * c;
        }

        private static double ConvertirEnRadians(double angle)
        {
            return angle * Math.PI / 180;
        }
    }
}