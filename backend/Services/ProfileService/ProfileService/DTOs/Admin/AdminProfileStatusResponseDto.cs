namespace ProfileService.DTOs.Admin;

public sealed class AdminProfileStatusResponseDto
{
    public bool UserProfileExists { get; set; }
    public bool AdminProfileExists { get; set; }
    public bool IsComplete { get; set; }
    public bool NeedsInitialization { get; set; }
}