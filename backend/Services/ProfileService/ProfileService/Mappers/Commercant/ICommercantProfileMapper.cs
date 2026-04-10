using ProfileService.DTOs.Commercant;
using ProfileService.DTOs.Common;
using ProfileService.Models;

namespace ProfileService.Mappers.Commercant;

public interface ICommercantProfileMapper
{
    CommercantProfileResponseDto ToResponseDto(
        UserProfile userProfile,
        CommercantProfile profile);

    UpdateUserProfileResponseDto ToUpdateUserProfileResponseDto(UserProfile userProfile);

    void MapRequest(CompleteCommercantProfileRequestDto dto, CommercantProfile profile);
}