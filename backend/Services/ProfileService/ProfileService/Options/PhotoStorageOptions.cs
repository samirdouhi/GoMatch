namespace ProfileService.Options;

public sealed class PhotoStorageOptions
{
    public string RootPath { get; set; } = "Storage/ProfilePhotos";
    public long MaxFileSizeBytes { get; set; } = 2 * 1024 * 1024;
}