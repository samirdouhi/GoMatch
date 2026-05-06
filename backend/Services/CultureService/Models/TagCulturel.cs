namespace CultureService.Models;

public class TagCulturel
{
    public Guid Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    public ICollection<ContenuCulturel> Contenus { get; set; } = new List<ContenuCulturel>();
}
