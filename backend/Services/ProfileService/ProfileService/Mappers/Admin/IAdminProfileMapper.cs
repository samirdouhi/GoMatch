using ProfileService.DTOs.Admin;
using ProfileService.DTOs.Common;
using ProfileService.Models;

namespace ProfileService.Mappers.Admin;

public interface IAdminProfileMapper
{
    AdminProfileResponseDto ToResponseDto(
        UserProfile userProfile,
        AdminProfile profile);

    UpdateUserProfileResponseDto ToUpdateUserProfileResponseDto(UserProfile userProfile);

    void MapRequest(UpdateAdminProfileRequestDto dto, AdminProfile profile);
}