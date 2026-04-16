namespace ServiceDecouverte.Dtos;

public class PlaceCreateDto
{
    public string Nom { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string Adresse { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public string Ville { get; set; } = "Rabat";

    public List<string> Tags { get; set; } = new();

    public double? Note { get; set; }

    public int? PrixMoyen { get; set; }

    public List<string> Images { get; set; } = new();

    public bool? EstOuvert { get; set; }

    public string? HorairesOuverture { get; set; }

    public int? Popularite { get; set; }
}