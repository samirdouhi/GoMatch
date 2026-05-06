using CultureService.Enums;

namespace CultureService.Models;

public class ContenuCulturel
{
    public Guid Id { get; set; }
    public string Titre { get; set; } = string.Empty;
    public string Corps { get; set; } = string.Empty;
    public string? Resume { get; set; }
    public string? Lieu { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string Statut { get; set; } = StatutContenu.Brouillon;
    public string LangueOriginale { get; set; } = "fr";
    public Guid AuteurId { get; set; }
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    public DateTime? DatePublication { get; set; }
    public DateTime? DateMiseAJour { get; set; }

    // Relations
    public Guid CategorieId { get; set; }
    public CategorieCulturelle? Categorie { get; set; }
    public ICollection<TagCulturel> Tags { get; set; } = new List<TagCulturel>();
    public ICollection<MediaContenu> Medias { get; set; } = new List<MediaContenu>();
    public ICollection<TraductionContenu> Traductions { get; set; } = new List<TraductionContenu>();
}
