using System.Globalization;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ServiceDecouverte.Data;
using ServiceDecouverte.Models;
using ServiceDecouverte.Models.Import;

namespace ServiceDecouverte.Services.Import;

public class GeoJsonImportService : IGeoJsonImportService
{
    private readonly ContexteBdDecouverte _context;

    public GeoJsonImportService(ContexteBdDecouverte context)
    {
        _context = context;
    }

    public async Task<int> ImportFileAsync(string filePath, string fallbackType)
    {
        if (!File.Exists(filePath))
            return 0;

        var enrichments = LoadImageEnrichments();

        var json = await File.ReadAllTextAsync(filePath);
        using var document = JsonDocument.Parse(json);

        if (!document.RootElement.TryGetProperty("features", out var features))
            return 0;

        var imported = 0;

        foreach (var feature in features.EnumerateArray())
        {
            if (!feature.TryGetProperty("properties", out var properties))
                continue;

            if (!feature.TryGetProperty("geometry", out var geometry))
                continue;

            if (!geometry.TryGetProperty("type", out var geometryType))
                continue;

            if (geometryType.GetString() != "Point")
                continue;

            if (!geometry.TryGetProperty("coordinates", out var coords))
                continue;

            if (coords.GetArrayLength() < 2)
                continue;

            var lon = coords[0].GetDouble();
            var lat = coords[1].GetDouble();

            var nom = Get(properties, "name");
            if (string.IsNullOrWhiteSpace(nom))
                continue;

            var exists = await _context.Places.AnyAsync(p =>
                p.Nom == nom &&
                Math.Abs(p.Latitude - lat) < 0.00001 &&
                Math.Abs(p.Longitude - lon) < 0.00001);

            if (exists)
                continue;

            var type = ResolveType(properties, fallbackType);
            var matchedImage = FindImageForPlace(enrichments, nom, lat, lon);

            var place = new Place
            {
                Id = Guid.NewGuid(),
                Nom = nom,
                Description = BuildDescription(properties, type),
                Type = type,
                Adresse = BuildAddress(properties),
                Latitude = lat,
                Longitude = lon,
                Ville = "Rabat",
                Tags = BuildTags(properties, type),
                Note = null,
                PrixMoyen = GetEstimatedPrice(type),
                Images = string.IsNullOrWhiteSpace(matchedImage)
                    ? new List<string>()
                    : new List<string> { matchedImage },
                EstOuvert = ResolveOpenStatus(properties),
                HorairesOuverture = GetOpeningHours(properties),
                Popularite = GetEstimatedPopularity(type)
            };

            _context.Places.Add(place);
            imported++;
        }

        await _context.SaveChangesAsync();
        return imported;
    }

    private static string? Get(JsonElement p, string key)
    {
        return p.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.String
            ? v.GetString()
            : null;
    }

    private static string ResolveType(JsonElement p, string fallback)
    {
        var tourism = Get(p, "tourism");
        var amenity = Get(p, "amenity");
        var leisure = Get(p, "leisure");

        if (tourism == "hotel") return "hotel";
        if (tourism == "museum") return "museum";
        if (tourism == "attraction") return "attraction";
        if (tourism == "viewpoint") return "viewpoint";

        if (amenity == "nightclub" || amenity == "bar" || amenity == "pub")
            return "nightlife";

        if (leisure == "fitness_centre" || leisure == "fitness_station")
            return "activity";

        return fallback;
    }

    private static string BuildAddress(JsonElement p)
    {
        var full = Get(p, "addr:full");
        if (!string.IsNullOrWhiteSpace(full))
            return full!;

        var street = Get(p, "addr:street");
        var houseNumber = Get(p, "addr:housenumber");

        if (!string.IsNullOrWhiteSpace(street) && !string.IsNullOrWhiteSpace(houseNumber))
            return $"{houseNumber} {street}";

        if (!string.IsNullOrWhiteSpace(street))
            return street!;

        return "Rabat";
    }

    private static string BuildDescription(JsonElement p, string type)
    {
        var description = Get(p, "description");
        if (!string.IsNullOrWhiteSpace(description))
            return description!;

        return type switch
        {
            "hotel" => "Hôtel à Rabat pour séjour touristique.",
            "nightlife" => "Lieu de sortie nocturne à Rabat.",
            "attraction" => "Lieu d’intérêt touristique à Rabat.",
            "museum" => "Musée à visiter à Rabat.",
            "viewpoint" => "Point de vue touristique à Rabat.",
            "activity" => "Activité de loisir à Rabat.",
            _ => "Lieu touristique à Rabat."
        };
    }

    private static List<string> BuildTags(JsonElement p, string type)
    {
        var tags = new List<string> { type };

        var tourism = Get(p, "tourism");
        var amenity = Get(p, "amenity");
        var leisure = Get(p, "leisure");

        if (!string.IsNullOrWhiteSpace(tourism)) tags.Add(tourism!);
        if (!string.IsNullOrWhiteSpace(amenity)) tags.Add(amenity!);
        if (!string.IsNullOrWhiteSpace(leisure)) tags.Add(leisure!);

        return tags
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static int? GetEstimatedPrice(string type)
    {
        return type switch
        {
            "hotel" => 900,
            "nightlife" => 150,
            "museum" => 60,
            "attraction" => 40,
            "viewpoint" => 0,
            "activity" => 80,
            _ => null
        };
    }

    private static int? GetEstimatedPopularity(string type)
    {
        return type switch
        {
            "hotel" => 80,
            "nightlife" => 75,
            "museum" => 70,
            "attraction" => 78,
            "viewpoint" => 65,
            "activity" => 60,
            _ => null
        };
    }

    private static bool? ResolveOpenStatus(JsonElement p)
    {
        var openingHours = Get(p, "opening_hours");

        if (string.IsNullOrWhiteSpace(openingHours))
            return null;

        if (openingHours.Contains("24/7", StringComparison.OrdinalIgnoreCase))
            return true;

        return null;
    }

    private static string? GetOpeningHours(JsonElement p)
    {
        return Get(p, "opening_hours");
    }

    private List<PlaceImageEnrichment> LoadImageEnrichments()
    {
        var filePath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "DataSeed",
            "Enrichissement",
            "place-images.json"
        );

        Console.WriteLine($"[DEBUG] CurrentDirectory = {Directory.GetCurrentDirectory()}");
        Console.WriteLine($"[DEBUG] Image enrichment path = {filePath}");
        Console.WriteLine($"[DEBUG] File exists = {File.Exists(filePath)}");

        if (!File.Exists(filePath))
            return new List<PlaceImageEnrichment>();

        var json = File.ReadAllText(filePath);
        Console.WriteLine($"[DEBUG] JSON content = {json}");

        var items = JsonSerializer.Deserialize<List<PlaceImageEnrichment>>(json,
            new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

        Console.WriteLine($"[DEBUG] Enrichment count = {items?.Count ?? 0}");

        return items ?? new List<PlaceImageEnrichment>();
    }

    private static string? FindImageForPlace(
      List<PlaceImageEnrichment> enrichments,
      string nom,
      double latitude,
      double longitude)
    {
        var normalizedNom = NormalizeText(nom);

        // 1. MATCH EXACT NORMALISÉ
        var exact = enrichments.FirstOrDefault(x =>
            NormalizeText(x.Nom) == normalizedNom);

        if (exact != null && !string.IsNullOrWhiteSpace(exact.ImageUrl))
            return exact.ImageUrl;

        // 2. MATCH CONTIENT (très important)
        var contains = enrichments.FirstOrDefault(x =>
            NormalizeText(x.Nom).Contains(normalizedNom) ||
            normalizedNom.Contains(NormalizeText(x.Nom)));

        if (contains != null && !string.IsNullOrWhiteSpace(contains.ImageUrl))
            return contains.ImageUrl;

        // 3. MATCH PAR COORDONNÉES (fallback)
        var byCoords = enrichments.FirstOrDefault(x =>
            Math.Abs(x.Latitude - latitude) < 0.001 &&
            Math.Abs(x.Longitude - longitude) < 0.001);

        return byCoords?.ImageUrl;
    }

    private static string NormalizeText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var normalized = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();

        foreach (var c in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(c);
            if (category != UnicodeCategory.NonSpacingMark)
                builder.Append(c);
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }
}