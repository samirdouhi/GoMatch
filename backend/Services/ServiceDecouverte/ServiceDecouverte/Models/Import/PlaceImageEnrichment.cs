namespace ServiceDecouverte.Models.Import;

public class PlaceImageEnrichment
{
    public string Nom { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public string ImageUrl { get; set; } = string.Empty;
}