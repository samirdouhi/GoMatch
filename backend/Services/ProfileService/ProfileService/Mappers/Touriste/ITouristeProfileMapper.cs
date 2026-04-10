using ProfileService.DTOs.Common;
using ProfileService.DTOs.Touriste;
using ProfileService.Models;

namespace ProfileService.Mappers.Touriste;

public interface ITouristeProfileMapper
{
    TouristeProfileResponseDto ToProfileResponseDto(
        UserProfile userProfile,
        TouristeProfile profile);

    TouristePreferencesResponseDto ToPreferencesResponseDto(TouristeProfile profile);

    CompleteTouristeOnboardingResponseDto ToOnboardingResponseDto(TouristeProfile profile);

    UpdateUserProfileResponseDto ToUpdateUserProfileResponseDto(UserProfile userProfile);

    void MapOnboarding(CompleteTouristeOnboardingRequestDto dto, TouristeProfile profile);

    void MapPreferences(UpdateTouristePreferencesRequestDto dto, TouristeProfile profile);
}