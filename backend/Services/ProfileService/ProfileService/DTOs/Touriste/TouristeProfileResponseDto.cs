using ProfileService.DTOs.Common;

namespace ProfileService.DTOs.Touriste;

public sealed class TouristeProfileResponseDto
{
    public UserProfileSummaryDto UserProfile { get; set; } = new();
    public string? Nationalite { get; set; }
    public string? PreferencesJson { get; set; }
    public string? EquipesSuiviesJson { get; set; }
    public bool InscriptionTerminee { get; set; }
}