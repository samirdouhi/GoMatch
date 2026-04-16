using Microsoft.EntityFrameworkCore;
using ServiceDecouverte.Data;
using ServiceDecouverte.Models;

namespace ServiceDecouverte.Repositories;

public class PlaceRepository : IPlaceRepository
{
    private readonly ContexteBdDecouverte _context;

    public PlaceRepository(ContexteBdDecouverte context)
    {
        _context = context;
    }

    public async Task<List<Place>> GetAllAsync()
    {
        return await _context.Places
            .AsNoTracking()
            .OrderBy(p => p.Nom)
            .ToListAsync();
    }

    public async Task<Place?> GetByIdAsync(Guid id)
    {
        return await _context.Places
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Place> AddAsync(Place place)
    {
        _context.Places.Add(place);
        await _context.SaveChangesAsync();
        return place;
    }

    public async Task<Place?> UpdateAsync(Place place)
    {
        var existing = await _context.Places.FindAsync(place.Id);
        if (existing == null) return null;

        existing.Nom = place.Nom;
        existing.Description = place.Description;
        existing.Type = place.Type;
        existing.Adresse = place.Adresse;
        existing.Latitude = place.Latitude;
        existing.Longitude = place.Longitude;
        existing.Ville = place.Ville;
        existing.Tags = place.Tags ?? new List<string>();
        existing.Note = place.Note;
        existing.PrixMoyen = place.PrixMoyen;
        existing.Images = place.Images ?? new List<string>();
        existing.EstOuvert = place.EstOuvert;
        existing.HorairesOuverture = place.HorairesOuverture;
        existing.Popularite = place.Popularite;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var place = await _context.Places.FindAsync(id);
        if (place == null) return false;

        _context.Places.Remove(place);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<IEnumerable<Place>> FilterAsync(string? type, string? ville)
    {
        var query = _context.Places.AsQueryable();

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(p => p.Type == type);

        if (!string.IsNullOrWhiteSpace(ville))
            query = query.Where(p => p.Ville == ville);

        return await query
            .AsNoTracking()
            .OrderBy(p => p.Nom)
            .ToListAsync();
    }
}