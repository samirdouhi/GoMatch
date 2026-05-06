namespace CultureService.DTOs.CategorieCulturelle;

public class CategorieCulturelleReponseDto
{
    public Guid Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icone { get; set; }
    public DateTime DateCreation { get; set; }
}
