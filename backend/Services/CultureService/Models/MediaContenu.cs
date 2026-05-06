using CultureService.Enums;

namespace CultureService.Models;

public class MediaContenu
{
    public Guid Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Type { get; set; } = TypeMedia.Image;
    public string? Legende { get; set; }
    public int Ordre { get; set; } = 0;
    public DateTime DateAjout { get; set; } = DateTime.UtcNow;

    public Guid ContenuCulturelId { get; set; }
    public ContenuCulturel? ContenuCulturel { get; set; }
}
