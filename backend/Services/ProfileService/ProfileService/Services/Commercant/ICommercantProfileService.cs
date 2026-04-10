using ProfileService.DTOs.Commercant;
using ProfileService.DTOs.Common;

namespace ProfileService.Services.Commercant;

public interface ICommercantProfileService
{
    Task<CommercantProfileResponseDto> GetMyProfileAsync(CancellationToken ct);

    Task<CommercantProfileResponseDto> InitProfileAsync(CancellationToken ct);

    Task<CommercantProfileResponseDto> UpdateCommercantProfileAsync(
        CompleteCommercantProfileRequestDto request,
        CancellationToken ct);

    Task<UpdateUserProfileResponseDto> UpdateUserProfileAsync(
        UpdateUserProfileRequestDto request,
        CancellationToken ct);
    Task ConfirmProfessionalEmailAsync(string token, CancellationToken ct);
}