using Microsoft.AspNetCore.Http;
using ProfileService.DTOs.Common;
using ProfileService.DTOs.Touriste;

namespace ProfileService.Services.Touriste;

public interface ITouristeProfileService
{
    Task<TouristeProfileResponseDto> GetMyProfileAsync(CancellationToken ct);

    Task<TouristeProfileResponseDto> InitProfileAsync(CancellationToken ct);

    Task<TouristeProfileResponseDto> RegisterInitAsync(
        RegisterTouristeProfileRequestDto request,
        CancellationToken ct);

    Task<UpdateUserProfileResponseDto> UpdateUserProfileAsync(
        UpdateUserProfileRequestDto request,
        CancellationToken ct);

    Task<CompleteTouristeOnboardingResponseDto> CompleteOnboardingAsync(
        CompleteTouristeOnboardingRequestDto request,
        CancellationToken ct);

    Task<TouristePreferencesResponseDto> UpdatePreferencesAsync(
        UpdateTouristePreferencesRequestDto request,
        CancellationToken ct);

    Task<PhotoUploadResponseDto> UploadPhotoAsync(IFormFile photo, CancellationToken ct);

    Task<(Stream Stream, string ContentType)> GetMyPhotoAsync(CancellationToken ct);
}