namespace ProfileService.DTOs.Touriste;

public sealed class UpdateTouristePreferencesRequestDto
{
    public string? PreferencesJson { get; set; }
    public string? EquipesSuiviesJson { get; set; }
}