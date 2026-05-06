namespace CultureService.DTOs.Media;

public class AjouterMediaRequeteDto
{
    public string Url { get; set; } = string.Empty;
    public string Type { get; set; } = "Image";
    public string? Legende { get; set; }
    public int Ordre { get; set; } = 0;
}
