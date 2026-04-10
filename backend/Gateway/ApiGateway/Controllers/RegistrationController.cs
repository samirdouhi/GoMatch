using System.Net.Http.Json;
using System.Text.Json;
using ApiGateway.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace ApiGateway.Controllers;

[ApiController]
[Route("gateway")]
public sealed class RegistrationController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public RegistrationController(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpPost("register-complete")]
    public async Task<IActionResult> RegisterComplete([FromBody] RegisterCompleteRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (request.Password != request.ConfirmPassword)
        {
            return BadRequest(new
            {
                message = "Password et ConfirmPassword ne correspondent pas."
            });
        }

        var authClient = _httpClientFactory.CreateClient("AuthService");
        var profileClient = _httpClientFactory.CreateClient("ProfileService");

        var authPayload = new
        {
            email = request.Email.Trim().ToLowerInvariant(),
            password = request.Password
        };

        var authResponse = await authClient.PostAsJsonAsync("/auth/register", authPayload);
        var authRaw = await authResponse.Content.ReadAsStringAsync();

        if (!authResponse.IsSuccessStatusCode)
        {
            return StatusCode((int)authResponse.StatusCode, new
            {
                step = "AuthService",
                error = authRaw
            });
        }

        AuthRegisterResponse? authResult = null;

        try
        {
            authResult = JsonSerializer.Deserialize<AuthRegisterResponse>(
                authRaw,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
        }
        catch
        {
            authResult = null;
        }

        if (authResult is null || authResult.UserId == Guid.Empty)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                step = "AuthService",
                error = "Réponse invalide : UserId manquant.",
                raw = authRaw
            });
        }

        var profilePayload = new ProfileRegisterInitRequest
        {
            UserId = authResult.UserId,
            Prenom = request.Prenom.Trim(),
            Nom = request.Nom.Trim(),
            DateNaissance = request.DateNaissance,
            Genre = request.Genre.Trim(),
            Nationalite = string.IsNullOrWhiteSpace(request.Nationalite)
                ? null
                : request.Nationalite.Trim()
        };

        var internalApiKey = _configuration["InternalApiKey"];

        if (string.IsNullOrWhiteSpace(internalApiKey))
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                step = "Gateway",
                error = "InternalApiKey manquante dans la configuration."
            });
        }

        var profileRequest = new HttpRequestMessage(
            HttpMethod.Post,
            "/internal/touriste/profile/register-init");

        profileRequest.Headers.Add("X-Internal-Api-Key", internalApiKey);
        profileRequest.Content = JsonContent.Create(profilePayload);

        var profileResponse = await profileClient.SendAsync(profileRequest);
        

        if (!profileResponse.IsSuccessStatusCode)
        {
            var profileRaw = await profileResponse.Content.ReadAsStringAsync();

            return StatusCode((int)profileResponse.StatusCode, new
            {
                step = "ProfileService",
                error = profileRaw,
                payload = profilePayload,
                message = "Compte créé, mais profil initial non créé."
            });
        }

        return Ok(new
        {
            message = "Inscription complète réussie."
        });
    }
}