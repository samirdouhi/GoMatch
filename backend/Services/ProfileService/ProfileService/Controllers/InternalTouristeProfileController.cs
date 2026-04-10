using Microsoft.AspNetCore.Mvc;
using ProfileService.DTOs.Touriste;
using ProfileService.Services.Touriste;

namespace ProfileService.Controllers.Touriste;

[ApiController]
[Route("internal/touriste/profile")]
public sealed class InternalTouristeProfileController : ControllerBase
{
    private readonly ITouristeProfileService _touristeProfileService;

    public InternalTouristeProfileController(ITouristeProfileService touristeProfileService)
    {
        _touristeProfileService = touristeProfileService;
    }

    [HttpPost("register-init")]
    public async Task<IActionResult> RegisterInit(
      [FromBody] RegisterTouristeProfileRequestDto request,
      CancellationToken ct)
    {
        try
        {
            var result = await _touristeProfileService.RegisterInitAsync(request, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = ex.Message,
                type = ex.GetType().Name,
                request
            });
        }
    }
}