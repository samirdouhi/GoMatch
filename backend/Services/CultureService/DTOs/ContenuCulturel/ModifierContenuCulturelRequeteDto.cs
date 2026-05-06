namespace CultureService.DTOs.ContenuCulturel;

public class ModifierContenuCulturelRequeteDto
{
    public string Titre { get; set; } = string.Empty;
    public string Corps { get; set; } = string.Empty;
    public string? Resume { get; set; }
    public string? Lieu { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public Guid CategorieId { get; set; }
    public List<Guid> TagIds { get; set; } = new();
}
