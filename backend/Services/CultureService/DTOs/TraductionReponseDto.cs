namespace CultureService.DTOs;

public class TraductionReponseDto
{
    public Guid Id { get; set; }
    public string Langue { get; set; } = string.Empty;
    public string Titre { get; set; } = string.Empty;
    public string Corps { get; set; } = string.Empty;
    public string? Resume { get; set; }
    public DateTime DateCreation { get; set; }
    public DateTime? DateMiseAJour { get; set; }
}
