namespace ServiceDecouverte.Models.Import;

public class PlaceImageDto
{
    public string Name { get; set; } = string.Empty;
    public List<string> Images { get; set; } = new();
}