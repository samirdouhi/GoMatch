namespace CultureService.DTOs.Traduction;

public class CreerTraductionRequeteDto
{
    public string Langue { get; set; } = string.Empty;
    public string Titre { get; set; } = string.Empty;
    public string Corps { get; set; } = string.Empty;
    public string? Resume { get; set; }
}
