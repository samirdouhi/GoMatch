namespace CultureService.DTOs;

public class MediaReponseDto
{
    public Guid Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Legende { get; set; }
    public int Ordre { get; set; }
    public DateTime DateAjout { get; set; }
}
