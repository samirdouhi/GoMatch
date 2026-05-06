namespace CultureService.Models;

public class TraductionContenu
{
    public Guid Id { get; set; }
    public string Langue { get; set; } = string.Empty; // "fr", "ar", "en"
    public string Titre { get; set; } = string.Empty;
    public string Corps { get; set; } = string.Empty;
    public string? Resume { get; set; }
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    public DateTime? DateMiseAJour { get; set; }

    public Guid ContenuCulturelId { get; set; }
    public ContenuCulturel? ContenuCulturel { get; set; }
}
