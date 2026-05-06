namespace CultureService.Models;

public class CategorieCulturelle
{
    public Guid Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icone { get; set; }
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    public ICollection<ContenuCulturel> Contenus { get; set; } = new List<ContenuCulturel>();
}
