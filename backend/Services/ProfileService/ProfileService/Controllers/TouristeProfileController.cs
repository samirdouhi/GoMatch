using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfileService.DTOs.Common;
using ProfileService.DTOs.Touriste;
using ProfileService.Services.Touriste;

namespace ProfileService.Controllers;

[Authorize]
[ApiController]
[Route("api/touriste/profile")]
public sealed class TouristeProfileController : ControllerBase
{
    private readonly ITouristeProfileService _service;

    public TouristeProfileController(ITouristeProfileService service)
    {
        _service = service;
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(TouristeProfileResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<TouristeProfileResponseDto>> GetMyProfile(CancellationToken ct)
    {
        var response = await _service.GetMyProfileAsync(ct);
        return Ok(response);
    }

    [HttpPost("me/init")]
    [ProducesResponseType(typeof(TouristeProfileResponseDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<TouristeProfileResponseDto>> InitProfile(CancellationToken ct)
    {
        var response = await _service.InitProfileAsync(ct);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpPut("me/user")]
    [ProducesResponseType(typeof(UpdateUserProfileResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UpdateUserProfileResponseDto>> UpdateUserProfile(
        [FromBody] UpdateUserProfileRequestDto request,
        CancellationToken ct)
    {
        var response = await _service.UpdateUserProfileAsync(request, ct);
        return Ok(response);
    }

    [HttpPost("me/onboarding")]
    [ProducesResponseType(typeof(CompleteTouristeOnboardingResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CompleteTouristeOnboardingResponseDto>> CompleteOnboarding(
        [FromBody] CompleteTouristeOnboardingRequestDto request,
        CancellationToken ct)
    {
        var response = await _service.CompleteOnboardingAsync(request, ct);
        return Ok(response);
    }

    [HttpPut("me/preferences")]
    [ProducesResponseType(typeof(TouristePreferencesResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<TouristePreferencesResponseDto>> UpdatePreferences(
        [FromBody] UpdateTouristePreferencesRequestDto request,
        CancellationToken ct)
    {
        var response = await _service.UpdatePreferencesAsync(request, ct);
        return Ok(response);
    }

    [HttpPost("me/photo")]
    [ProducesResponseType(typeof(PhotoUploadResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<PhotoUploadResponseDto>> UploadPhoto(
        [FromForm] IFormFile photo,
        CancellationToken ct)
    {
        var response = await _service.UploadPhotoAsync(photo, ct);
        return Ok(response);
    }

    [HttpGet("me/photo")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyPhoto(CancellationToken ct)
    {
        var (stream, contentType) = await _service.GetMyPhotoAsync(ct);
        return File(stream, contentType);
    }
}