using AuthService.DTOs;
using AuthService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace AuthService.Controllers;

[ApiController]
[Route("auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _service;
    private readonly IConfiguration _configuration;

    public AuthController(IAuthService service, IConfiguration configuration)
    {
        _service = service;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request, CancellationToken ct)
    {
        var (success, code, erreur, data) = await _service.RegisterAsync(request, ct);

        if (!success)
            return StatusCode(code, new { erreur });

        return StatusCode(StatusCodes.Status201Created, data);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto, CancellationToken ct)
    {
        var (success, code, erreur, data) = await _service.LoginAsync(dto, ct);

        if (!success)
            return StatusCode(code, new { message = erreur });

        return Ok(data);
    }
    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDto dto, CancellationToken ct)
    {
        var (success, code, erreur, data) = await _service.GoogleLoginAsync(dto, ct);

        if (!success)
            return StatusCode(code, new { message = erreur });

        return Ok(data);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshRequestDto dto, CancellationToken ct)
    {
        var (success, code, erreur) = await _service.LogoutAsync(dto.RefreshToken, ct);

        if (!success)
            return StatusCode(code, new { erreur });

        return Ok(new { message = "Déconnexion réussie." });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(User.Claims.Select(c => new
        {
            c.Type,
            c.Value
        }));
    }

    [Authorize]
    [HttpGet("me/details")]
    public async Task<IActionResult> MeDetails(CancellationToken ct)
    {
        var (success, code, erreur, data) = await _service.GetMeAsync(User, ct);

        if (!success)
            return StatusCode(code, new { message = erreur });

        return Ok(data);
    }

    [Authorize]
    [HttpPut("me/email")]
    public async Task<IActionResult> ChangeEmail(
        [FromBody] ChangeEmailRequestDto dto,
        CancellationToken ct)
    {
        var (success, code, erreur) = await _service.ChangeEmailAsync(User, dto, ct);

        if (!success)
            return StatusCode(code, new { message = erreur });

        return Ok(new { message = "Email modifié avec succès." });
    }

    [Authorize]
    [HttpPut("me/password")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequestDto dto,
        CancellationToken ct)
    {
        var (success, code, erreur) = await _service.ChangePasswordAsync(User, dto, ct);

        if (!success)
            return StatusCode(code, new { message = erreur });

        return Ok(new { message = "Mot de passe modifié avec succès." });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequestDto dto, CancellationToken ct)
    {
        var (success, code, erreur, data) = await _service.RefreshAsync(dto, ct);

        if (!success)
            return StatusCode(code, new { erreur });

        return Ok(data);
    }

    [AllowAnonymous]
    [HttpPost("users/{userId:guid}/grant-merchant-role")]
    public async Task<IActionResult> GrantMerchantRole(Guid userId, CancellationToken ct)
    {
        var internalKey = Request.Headers["X-Internal-Api-Key"].FirstOrDefault();
        var expectedKey = _configuration["InternalApiKey"];

        if (string.IsNullOrWhiteSpace(expectedKey))
            return StatusCode(500, new { message = "InternalApiKey not configured in AuthService." });

        if (internalKey != expectedKey)
            return Unauthorized(new { message = "Invalid internal API key." });

        var (success, code, erreur) = await _service.GrantMerchantRoleAsync(userId, ct);

        if (!success)
            return StatusCode(code, new { message = erreur });

        return Ok(new { message = "Rôle commerçant attribué avec succès." });
    }
}