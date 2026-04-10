namespace ProfileService.DTOs.Touriste;

public sealed class CompleteTouristeOnboardingRequestDto
{
    public string? Nationalite { get; set; }
    public string? PreferencesJson { get; set; }
    public string? EquipesSuiviesJson { get; set; }
}