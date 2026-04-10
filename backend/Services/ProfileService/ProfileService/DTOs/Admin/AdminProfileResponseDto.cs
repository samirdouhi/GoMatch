using ProfileService.DTOs.Common;

namespace ProfileService.DTOs.Admin;

public sealed class AdminProfileResponseDto
{
    public UserProfileSummaryDto UserProfile { get; set; } = new();

    public string? Departement { get; set; }
    public string? Fonction { get; set; }
    public string? TelephoneProfessionnel { get; set; }
    public bool InscriptionTerminee { get; set; }
}