namespace ServiceDecouverte.Services.Import;

public interface IGeoJsonImportService
{
    Task<int> ImportFileAsync(string filePath, string fallbackType);
}