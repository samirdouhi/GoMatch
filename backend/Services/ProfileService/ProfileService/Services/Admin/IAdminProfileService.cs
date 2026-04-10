using ProfileService.DTOs.Admin;
using ProfileService.DTOs.Common;
using ProfileService.DTOs.Commercant;

namespace ProfileService.Services.Admin;

public interface IAdminProfileService
{
    Task<AdminProfileResponseDto> GetMyProfileAsync(CancellationToken ct);

    Task<AdminProfileResponseDto> InitProfileAsync(CancellationToken ct);

    Task<UpdateUserProfileResponseDto> UpdateUserProfileAsync(
        UpdateUserProfileRequestDto request,
        CancellationToken ct);

    Task<AdminProfileResponseDto> UpdateAdminProfileAsync(
        UpdateAdminProfileRequestDto request,
        CancellationToken ct);

    Task<IReadOnlyList<CommercantReviewResponseDto>> GetPendingCommercantsAsync(CancellationToken ct);

    Task<CommercantProfileResponseDto> GetCommercantByIdAsync(Guid id, CancellationToken ct);

    Task<CommercantProfileResponseDto> ApproveCommercantAsync(Guid id, CancellationToken ct);

    Task<CommercantProfileResponseDto> RejectCommercantAsync(
        Guid id,
        UpdateCommercantStatusRequestDto request,
        CancellationToken ct);
    Task<AdminProfileStatusResponseDto> GetProfileStatusAsync(CancellationToken ct);
}