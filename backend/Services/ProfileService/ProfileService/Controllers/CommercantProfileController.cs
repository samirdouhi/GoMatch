using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfileService.DTOs.Commercant;
using ProfileService.DTOs.Common;
using ProfileService.Services.Commercant;

namespace ProfileService.Controllers;

[Authorize]
[ApiController]
[Route("api/commercant/profile")]
public sealed class CommercantProfileController : ControllerBase
{
    private readonly ICommercantProfileService _service;

    public CommercantProfileController(ICommercantProfileService service)
    {
        _service = service;
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(CommercantProfileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CommercantProfileResponseDto>> GetMyProfile(CancellationToken ct)
    {
        var response = await _service.GetMyProfileAsync(ct);

        if (response is null)
        {
            return NotFound(new
            {
                message = "Le profil commerçant est introuvable."
            });
        }

        return Ok(response);
    }

    [HttpPost("me/init")]
    [ProducesResponseType(typeof(CommercantProfileResponseDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<CommercantProfileResponseDto>> InitProfile(CancellationToken ct)
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

    [HttpPut("me/business")]
    [ProducesResponseType(typeof(CommercantProfileResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CommercantProfileResponseDto>> UpdateBusinessProfile(
        [FromBody] CompleteCommercantProfileRequestDto request,
        CancellationToken ct)
    {
        var response = await _service.UpdateCommercantProfileAsync(request, ct);
        return Ok(response);
    }
    [AllowAnonymous]
    [HttpGet("confirm-professional-email")]
    public async Task<IActionResult> ConfirmProfessionalEmail(
    [FromQuery] string token,
    CancellationToken ct)
    {
        await _service.ConfirmProfessionalEmailAsync(token, ct);

        return Ok(new
        {
            message = "Email professionnel vérifié. Votre demande est en cours d'analyse."
        });
    }
}