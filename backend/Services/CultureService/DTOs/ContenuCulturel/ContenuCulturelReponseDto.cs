namespace CultureService.DTOs.ContenuCulturel;

public class ContenuCulturelReponseDto
{
    public Guid Id { get; set; }
    public string Titre { get; set; } = string.Empty;
    public string Corps { get; set; } = string.Empty;
    public string? Resume { get; set; }
    public string? Lieu { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string Statut { get; set; } = string.Empty;
    public string LangueOriginale { get; set; } = "fr";
    public Guid AuteurId { get; set; }
    public DateTime DateCreation { get; set; }
    public DateTime? DatePublication { get; set; }
    public DateTime? DateMiseAJour { get; set; }
    public Guid CategorieId { get; set; }
    public string? NomCategorie { get; set; }
    public List<string> Tags { get; set; } = new();
    public List<MediaReponseDto> Medias { get; set; } = new();
    public List<TraductionReponseDto> Traductions { get; set; } = new();
}
