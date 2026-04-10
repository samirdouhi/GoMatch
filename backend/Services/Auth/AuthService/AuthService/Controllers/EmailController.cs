using AuthService.DTOs;
using AuthService.Services.Email;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Controllers;

[ApiController]
[Route("email")]
public sealed class EmailController : ControllerBase
{
    private readonly IEmailService _service;

    public EmailController(IEmailService service)
    {
        _service = service;
    }

    [HttpGet("confirm")]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string token, CancellationToken ct)
    {
        var (success, code, erreur) = await _service.ConfirmEmailAsync(token, ct);

        if (!success)
            return StatusCode(code, new { message = erreur });

        return Ok(new { message = "Email confirmé avec succès." });
    }

    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmationEmail(
        [FromBody] ResendConfirmationEmailRequestDto dto,
        CancellationToken ct)
    {
        var (success, code, erreur) = await _service.ResendConfirmationEmailAsync(dto, ct);

        if (!success)
            return StatusCode(code, new { message = erreur });

        return Ok(new { message = "Email de confirmation renvoyé avec succès." });
    }

    [HttpPost("merchant-approved")]
    public async Task<IActionResult> SendMerchantApprovedEmail(
        [FromBody] MerchantApprovedEmailRequestDto dto,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.To))
            return BadRequest(new { message = "Le destinataire est obligatoire." });

        await _service.SendMerchantApprovedEmailAsync(dto.To, dto.FullName);

        return Ok(new { message = "Email d'acceptation commerçant envoyé avec succès." });
    }

    [HttpPost("merchant-rejected")]
    public async Task<IActionResult> SendMerchantRejectedEmail(
        [FromBody] MerchantRejectedEmailRequestDto dto,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.To))
            return BadRequest(new { message = "Le destinataire est obligatoire." });

        if (string.IsNullOrWhiteSpace(dto.Reason))
            return BadRequest(new { message = "La raison du rejet est obligatoire." });

        await _service.SendMerchantRejectedEmailAsync(dto.To, dto.Reason, dto.FullName);

        return Ok(new { message = "Email de refus commerçant envoyé avec succès." });
    }
    [HttpPost("merchant-submission-received")]
    public async Task<IActionResult> SendMerchantSubmissionReceivedEmail(
    [FromBody] SendMerchantSubmissionReceivedEmailRequestDto dto,
    CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.To))
            return BadRequest(new { message = "L'adresse email est obligatoire." });

        await _service.SendMerchantSubmissionReceivedEmailAsync(
            dto.To,
            dto.FullName);

        return Ok(new { message = "Email de réception de demande commerçant envoyé." });
    }
    [HttpPost("merchant-email-verification")]
    public async Task<IActionResult> SendMerchantEmailVerification(
    [FromBody] MerchantEmailVerificationRequestDto dto,
    CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.To))
            return BadRequest(new { message = "L'adresse email est obligatoire." });

        if (string.IsNullOrWhiteSpace(dto.Token))
            return BadRequest(new { message = "Le token est obligatoire." });

        await _service.SendMerchantEmailVerificationAsync(
            dto.To,
            dto.Token,
            dto.FullName,
            ct);

        return Ok(new { message = "Email de vérification commerçant envoyé." });
    }
}