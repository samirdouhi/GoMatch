using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfileService.DTOs.Admin;
using ProfileService.DTOs.Common;
using ProfileService.DTOs.Commercant;
using ProfileService.Services.Admin;

namespace ProfileService.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/profile")]
public sealed class AdminProfileController : ControllerBase
{
    private readonly IAdminProfileService _service;

    public AdminProfileController(IAdminProfileService service)
    {
        _service = service;
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(AdminProfileResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminProfileResponseDto>> GetMyProfile(CancellationToken ct)
    {
        var response = await _service.GetMyProfileAsync(ct);
        return Ok(response);
    }

    [HttpPost("me/init")]
    [ProducesResponseType(typeof(AdminProfileResponseDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<AdminProfileResponseDto>> InitProfile(CancellationToken ct)
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

    [HttpPut("me/admin")]
    [ProducesResponseType(typeof(AdminProfileResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminProfileResponseDto>> UpdateAdminProfile(
        [FromBody] UpdateAdminProfileRequestDto request,
        CancellationToken ct)
    {
        var response = await _service.UpdateAdminProfileAsync(request, ct);
        return Ok(response);
    }

    [HttpGet("commercants/pending")]
    [ProducesResponseType(typeof(IReadOnlyList<CommercantReviewResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CommercantReviewResponseDto>>> GetPendingCommercants(CancellationToken ct)
    {
        var response = await _service.GetPendingCommercantsAsync(ct);
        return Ok(response);
    }

    [HttpGet("commercants/{id:guid}")]
    [ProducesResponseType(typeof(CommercantProfileResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CommercantProfileResponseDto>> GetCommercantById(Guid id, CancellationToken ct)
    {
        var response = await _service.GetCommercantByIdAsync(id, ct);
        return Ok(response);
    }

    [HttpPost("commercants/{id:guid}/approve")]
    [ProducesResponseType(typeof(CommercantProfileResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CommercantProfileResponseDto>> ApproveCommercant(Guid id, CancellationToken ct)
    {
        var response = await _service.ApproveCommercantAsync(id, ct);
        return Ok(response);
    }

    [HttpPost("commercants/{id:guid}/reject")]
    [ProducesResponseType(typeof(CommercantProfileResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CommercantProfileResponseDto>> RejectCommercant(
        Guid id,
        [FromBody] UpdateCommercantStatusRequestDto request,
        CancellationToken ct)
    {
        var response = await _service.RejectCommercantAsync(id, request, ct);
        return Ok(response);
    }
    [HttpGet("me/status")]
    [ProducesResponseType(typeof(AdminProfileStatusResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminProfileStatusResponseDto>> GetMyProfileStatus(CancellationToken ct)
    {
        var response = await _service.GetProfileStatusAsync(ct);
        return Ok(response);
    }
}