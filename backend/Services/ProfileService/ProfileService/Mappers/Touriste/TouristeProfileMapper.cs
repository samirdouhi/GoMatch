using ProfileService.DTOs.Common;
using ProfileService.DTOs.Touriste;
using ProfileService.Models;

namespace ProfileService.Mappers.Touriste;

public sealed class TouristeProfileMapper : ITouristeProfileMapper
{
    private const string MyPhotoEndpoint = "/profile/me/photo";

    private static string? BuildPhotoUrl(UserProfile userProfile)
        => string.IsNullOrWhiteSpace(userProfile.PhotoPath)
            ? null
            : MyPhotoEndpoint;

    private static UserProfileSummaryDto ToUserProfileSummaryDto(UserProfile userProfile) => new()
    {
        UserId = userProfile.UserId,
        Prenom = userProfile.Prenom,
        Nom = userProfile.Nom,
        DateNaissance = userProfile.DateNaissance,
        Genre = userProfile.Genre?.ToString(),
        Langue = userProfile.Langue.ToString(),
        PhotoUrl = BuildPhotoUrl(userProfile),
        IsActive = userProfile.IsActive
    };

    public TouristeProfileResponseDto ToProfileResponseDto(
        UserProfile userProfile,
        TouristeProfile profile) => new()
        {
            UserProfile = ToUserProfileSummaryDto(userProfile),
            Nationalite = profile.Nationalite,
            PreferencesJson = profile.PreferencesJson,
            EquipesSuiviesJson = profile.EquipesSuiviesJson,
            InscriptionTerminee = profile.InscriptionTerminee
        };

    public TouristePreferencesResponseDto ToPreferencesResponseDto(TouristeProfile profile) => new()
    {
        PreferencesJson = profile.PreferencesJson,
        EquipesSuiviesJson = profile.EquipesSuiviesJson
    };

    public CompleteTouristeOnboardingResponseDto ToOnboardingResponseDto(TouristeProfile profile) => new()
    {
        InscriptionTerminee = profile.InscriptionTerminee
    };

    public UpdateUserProfileResponseDto ToUpdateUserProfileResponseDto(UserProfile userProfile) => new()
    {
        Prenom = userProfile.Prenom ?? string.Empty,
        Nom = userProfile.Nom ?? string.Empty,
        DateNaissance = userProfile.DateNaissance ?? default,
        Genre = userProfile.Genre?.ToString() ?? string.Empty,
        Langue = userProfile.Langue.ToString(),
        PhotoUrl = BuildPhotoUrl(userProfile)
    };

    public void MapOnboarding(CompleteTouristeOnboardingRequestDto dto, TouristeProfile profile)
    {
        profile.Nationalite = string.IsNullOrWhiteSpace(dto.Nationalite)
            ? null
            : dto.Nationalite.Trim();

        profile.PreferencesJson = dto.PreferencesJson;
        profile.EquipesSuiviesJson = dto.EquipesSuiviesJson;
        profile.UpdatedAt = DateTime.UtcNow;
    }

    public void MapPreferences(UpdateTouristePreferencesRequestDto dto, TouristeProfile profile)
    {
        profile.PreferencesJson = dto.PreferencesJson;
        profile.EquipesSuiviesJson = dto.EquipesSuiviesJson;
        profile.UpdatedAt = DateTime.UtcNow;
    }
}