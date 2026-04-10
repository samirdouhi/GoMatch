using System.Security.Claims;
using AuthService.DTOs;
using AuthService.Enums;
using AuthService.Exceptions;
using AuthService.Logging;
using AuthService.Mappers;
using AuthService.Models;
using AuthService.Repositories;
using AuthService.Security;
using AuthService.Services.Email;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AuthService.Services;

public sealed class AuthentificationService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IPasswordHasher _passwordHasher;
    private readonly PasswordPolicy _passwordPolicy;
    private readonly IJwtService _jwtService;
    private readonly IAuthMapper _mapper;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthentificationService> _logger;
    private readonly IConfiguration _configuration;

    private static readonly TimeSpan RefreshLifetime = TimeSpan.FromDays(7);

    public AuthentificationService(
        IUserRepository users,
        IRefreshTokenRepository refreshTokens,
        IPasswordHasher passwordHasher,
        PasswordPolicy passwordPolicy,
        IJwtService jwtService,
        IAuthMapper mapper,
        IEmailService emailService,
        ILogger<AuthentificationService> logger,
        IConfiguration configuration)
    {
        _users = users;
        _refreshTokens = refreshTokens;
        _passwordHasher = passwordHasher;
        _passwordPolicy = passwordPolicy;
        _jwtService = jwtService;
        _mapper = mapper;
        _emailService = emailService;
        _logger = logger;
        _configuration = configuration;
    }

    private static Guid? GetUserIdFromClaims(ClaimsPrincipal user)
    {
        var idValue =
            user.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
            user.FindFirst("sub")?.Value ??
            user.FindFirst("userId")?.Value;

        return Guid.TryParse(idValue, out var id) ? id : null;
    }

    private async Task<LoginResponseDto> GenerateLoginResponseAsync(User user, CancellationToken ct)
    {
        var (accessToken, accessExpiresAtUtc) = _jwtService.GenerateToken(user);

        var now = DateTime.UtcNow;
        var refreshValue = RefreshTokenGenerator.GenerateOpaqueToken();

        var refresh = new RefreshToken
        {
            Id = Guid.NewGuid(),
            Token = refreshValue,
            UserId = user.Id,
            CreatedAtUtc = now,
            ExpiresAtUtc = now.Add(RefreshLifetime),
            RevokedAtUtc = null,
            ReplacedByToken = null
        };

        await _refreshTokens.AddAsync(refresh, ct);
        await _refreshTokens.SaveChangesAsync(ct);

        _logger.LogInformation(
            "LOGIN_SUCCESS userId={UserId} email={Email} roles={Roles} refreshTail={RefreshTail}",
            user.Id, user.Email, string.Join(",", user.Roles), LogSanitizer.TokenTail(refreshValue));

        return _mapper.ToLoginResponse(accessToken, accessExpiresAtUtc, refreshValue);
    }

    public async Task<(bool Success, int Code, string? Erreur, RegisterResponseDto? Data)>
        RegisterAsync(RegisterRequestDto request, CancellationToken ct)
    {
        var email = LogSanitizer.NormalizeEmail(request.Email);
        _logger.LogInformation("REGISTER_ATTEMPT email={Email}", email);

        if (string.IsNullOrWhiteSpace(email))
            throw new ValidationException("Email obligatoire.", "AUTH.EMAIL_REQUIRED");

        if (!_passwordPolicy.EstValide(request.Password, out var erreurPwd))
            throw new ValidationException(erreurPwd ?? "Mot de passe invalide.", "AUTH.PASSWORD_WEAK");

        if (await _users.EmailExisteAsync(email, ct))
            throw new ConflictException("Email déjà utilisé.", "AUTH.EMAIL_EXISTS");

        var passwordHash = _passwordHasher.Hasher(request.Password);
        var user = _mapper.ToUser(email, passwordHash);

        user.Id = Guid.NewGuid();
        user.Roles = new List<UserRole> { UserRole.Touriste };
        user.IsActive = true;
        user.CreatedAt = DateTime.UtcNow;
        user.EmailConfirmed = false;
        user.EmailConfirmationToken = Guid.NewGuid().ToString("N");
        user.EmailConfirmationTokenExpiresAt = DateTime.UtcNow.AddHours(24);

        await _users.AjouterAsync(user, ct);
        await _users.SauvegarderAsync(ct);

        await _emailService.SendConfirmationEmailAsync(
            user.Email,
            user.EmailConfirmationToken!
        );

        var response = _mapper.ToRegisterResponse(user);
        return (true, 201, null, response);
    }

    public async Task<(bool Success, int Code, string? Erreur, LoginResponseDto? Data)>
        LoginAsync(LoginRequestDto dto, CancellationToken ct)
    {
        var email = LogSanitizer.NormalizeEmail(dto.Email);

        if (string.IsNullOrWhiteSpace(email))
            throw new ValidationException("Email obligatoire.", "AUTH.EMAIL_REQUIRED");

        var motDePasse = dto.Password;
        if (string.IsNullOrWhiteSpace(motDePasse))
            throw new ValidationException("Mot de passe obligatoire.", "AUTH.PASSWORD_REQUIRED");

        var user = await _users.GetByEmailAsync(email, ct);
        if (user is null)
            throw new UnauthorizedException("Identifiants invalides.");

        if (!user.IsActive)
            throw new ForbiddenException("Compte inactif.");

        if (!user.EmailConfirmed)
            throw new UnauthorizedException("Veuillez confirmer votre adresse email avant de vous connecter.");

        if (string.IsNullOrWhiteSpace(user.PasswordHash) || !_passwordHasher.Verifier(motDePasse, user.PasswordHash))
            throw new UnauthorizedException("Identifiants invalides.");

        var response = await GenerateLoginResponseAsync(user, ct);
        return (true, 200, null, response);
    }

    public async Task<(bool Success, int Code, string? Erreur, GoogleLoginResponseDto? Data)>
     GoogleLoginAsync(GoogleLoginRequestDto dto, CancellationToken ct)
    {
        if (dto is null || string.IsNullOrWhiteSpace(dto.IdToken))
            throw new ValidationException("Google ID token obligatoire.", "AUTH.GOOGLE_IDTOKEN_REQUIRED");

        var googleClientId = _configuration["Authentication:Google:ClientId"];
        if (string.IsNullOrWhiteSpace(googleClientId))
            throw new ValidationException("Configuration Google manquante.", "AUTH.GOOGLE_CONFIG_MISSING");

        GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { googleClientId }
            };

            payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);
        }
        catch (InvalidJwtException)
        {
            throw new UnauthorizedException("Token Google invalide.");
        }

        var email = LogSanitizer.NormalizeEmail(payload.Email);

        if (string.IsNullOrWhiteSpace(email))
            throw new ValidationException("Email Google introuvable.", "AUTH.GOOGLE_EMAIL_MISSING");

        var user = await _users.GetByEmailAsync(email, ct);

        // ✅ NOUVEAU : si l'utilisateur n'existe pas, on ne crée rien
        if (user is null)
        {
            var registrationResponse = new GoogleLoginResponseDto
            {
                RequiresRegistration = true,
                Email = email,
                Prenom = payload.GivenName,
                Nom = payload.FamilyName,
                Login = null
            };

            return (true, 200, null, registrationResponse);
        }

        if (!user.IsActive)
            throw new ForbiddenException("Compte inactif.");

        var mustSave = false;

        if (!user.EmailConfirmed)
        {
            user.EmailConfirmed = true;
            user.EmailConfirmationToken = null;
            user.EmailConfirmationTokenExpiresAt = null;
            mustSave = true;
        }

        if (!user.Roles.Contains(UserRole.Touriste))
        {
            user.Roles.Add(UserRole.Touriste);
            user.Roles = user.Roles.Distinct().ToList();
            mustSave = true;
        }

        if (mustSave)
            await _users.SauvegarderAsync(ct);

        var loginResponse = await GenerateLoginResponseAsync(user, ct);

        var response = new GoogleLoginResponseDto
        {
            RequiresRegistration = false,
            Email = user.Email,
            Prenom = payload.GivenName,
            Nom = payload.FamilyName,
            Login = loginResponse
        };

        return (true, 200, null, response);
    }

    public async Task<(bool Success, int Code, string? Erreur, RefreshResponseDto? Data)>
        RefreshAsync(RefreshRequestDto dto, CancellationToken ct)
    {
        var refreshToken = (dto.RefreshToken ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(refreshToken))
            throw new ValidationException("Refresh token obligatoire.", "AUTH.REFRESH_REQUIRED");

        var now = DateTime.UtcNow;
        var existing = await _refreshTokens.GetByTokenWithUserAsync(refreshToken, ct);

        if (existing is null)
            throw new UnauthorizedException("Refresh token invalide.");

        if (existing.ExpiresAtUtc <= now)
            throw new UnauthorizedException("Refresh token expiré.");

        if (existing.RevokedAtUtc is not null)
        {
            await _refreshTokens.RevokeAllActiveForUserAsync(existing.UserId, now, ct);
            await _refreshTokens.SaveChangesAsync(ct);
            throw new UnauthorizedException("Refresh token révoqué.");
        }

        var user = existing.User;
        if (user is null)
            throw new UnauthorizedException("Utilisateur invalide.");

        if (!user.IsActive)
            throw new ForbiddenException("Utilisateur inactif.");

        if (!user.EmailConfirmed)
            throw new ForbiddenException("Email non confirmé.");

        var newRefreshValue = RefreshTokenGenerator.GenerateOpaqueToken();

        existing.RevokedAtUtc = now;
        existing.ReplacedByToken = newRefreshValue;

        var newRefresh = new RefreshToken
        {
            Id = Guid.NewGuid(),
            Token = newRefreshValue,
            UserId = user.Id,
            CreatedAtUtc = now,
            ExpiresAtUtc = now.Add(RefreshLifetime),
            RevokedAtUtc = null,
            ReplacedByToken = null
        };

        await _refreshTokens.AddAsync(newRefresh, ct);

        var (accessToken, accessExpiresAtUtc) = _jwtService.GenerateToken(user);

        await _refreshTokens.SaveChangesAsync(ct);

        var response = _mapper.ToRefreshResponse(accessToken, accessExpiresAtUtc, newRefreshValue);
        return (true, 200, null, response);
    }

    public async Task<(bool Success, int Code, string? Erreur)>
        LogoutAsync(string refreshToken, CancellationToken ct)
    {
        var token = (refreshToken ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(token))
            throw new ValidationException("Refresh token obligatoire.", "AUTH.REFRESH_REQUIRED");

        var existing = await _refreshTokens.GetByTokenWithUserAsync(token, ct);

        if (existing is null)
            throw new UnauthorizedException("Refresh token invalide.");

        if (existing.RevokedAtUtc is not null)
            return (true, 200, null);

        existing.RevokedAtUtc = DateTime.UtcNow;
        await _refreshTokens.SaveChangesAsync(ct);

        return (true, 200, null);
    }

    public async Task<(bool Success, int Code, string? Erreur, AuthMeResponseDto? Data)>
        GetMeAsync(ClaimsPrincipal user, CancellationToken ct)
    {
        var userId = GetUserIdFromClaims(user);
        if (userId is null)
            throw new UnauthorizedException("Utilisateur non authentifié.");

        var entity = await _users.GetByIdAsync(userId.Value, ct);
        if (entity is null)
            throw new NotFoundException("Utilisateur introuvable.", "AUTH.USER_NOT_FOUND");

        var response = new AuthMeResponseDto
        {
            UserId = entity.Id,
            Email = entity.Email,
            Roles = entity.Roles.Select(r => r.ToString()).ToList()
        };

        return (true, 200, null, response);
    }

    public async Task<(bool Success, int Code, string? Erreur)>
        ChangeEmailAsync(ClaimsPrincipal user, ChangeEmailRequestDto dto, CancellationToken ct)
    {
        var userId = GetUserIdFromClaims(user);
        if (userId is null)
            throw new UnauthorizedException("Utilisateur non authentifié.");

        var entity = await _users.GetByIdAsync(userId.Value, ct);
        if (entity is null)
            throw new NotFoundException("Utilisateur introuvable.", "AUTH.USER_NOT_FOUND");

        if (!entity.IsActive)
            throw new ForbiddenException("Compte inactif.");

        var currentPassword = dto.CurrentPassword?.Trim() ?? string.Empty;
        var newEmail = LogSanitizer.NormalizeEmail(dto.NewEmail);

        if (string.IsNullOrWhiteSpace(newEmail))
            throw new ValidationException("Nouvel email obligatoire.", "AUTH.EMAIL_REQUIRED");

        if (string.IsNullOrWhiteSpace(currentPassword))
            throw new ValidationException("Mot de passe actuel obligatoire.", "AUTH.PASSWORD_REQUIRED");

        if (string.IsNullOrWhiteSpace(entity.PasswordHash))
            throw new ForbiddenException("Ce compte Google n’a pas de mot de passe local. Ajoute d’abord un mot de passe.");

        if (!_passwordHasher.Verifier(currentPassword, entity.PasswordHash))
            throw new UnauthorizedException("Mot de passe actuel incorrect.");

        if (string.Equals(entity.Email, newEmail, StringComparison.OrdinalIgnoreCase))
            throw new ConflictException("Le nouvel email est identique à l’ancien.", "AUTH.EMAIL_SAME");

        if (await _users.EmailExisteAsync(newEmail, ct))
            throw new ConflictException("Email déjà utilisé.", "AUTH.EMAIL_EXISTS");

        entity.Email = newEmail;
        entity.EmailConfirmed = false;
        entity.EmailConfirmationToken = Guid.NewGuid().ToString("N");
        entity.EmailConfirmationTokenExpiresAt = DateTime.UtcNow.AddHours(24);

        await _users.SauvegarderAsync(ct);

        await _emailService.SendEmailChangeConfirmationAsync(
            entity.Email,
            entity.EmailConfirmationToken!
        );

        return (true, 200, null);
    }

    public async Task<(bool Success, int Code, string? Erreur)>
        ChangePasswordAsync(ClaimsPrincipal user, ChangePasswordRequestDto dto, CancellationToken ct)
    {
        var userId = GetUserIdFromClaims(user);
        if (userId is null)
            throw new UnauthorizedException("Utilisateur non authentifié.");

        var entity = await _users.GetByIdAsync(userId.Value, ct);
        if (entity is null)
            throw new NotFoundException("Utilisateur introuvable.", "AUTH.USER_NOT_FOUND");

        if (!entity.IsActive)
            throw new ForbiddenException("Compte inactif.");

        var currentPassword = dto.CurrentPassword?.Trim() ?? string.Empty;
        var newPassword = dto.NewPassword ?? string.Empty;

        if (!string.IsNullOrWhiteSpace(entity.PasswordHash))
        {
            if (string.IsNullOrWhiteSpace(currentPassword))
                throw new ValidationException("Mot de passe actuel obligatoire.", "AUTH.PASSWORD_REQUIRED");

            if (!_passwordHasher.Verifier(currentPassword, entity.PasswordHash))
                throw new UnauthorizedException("Mot de passe actuel incorrect.");
        }

        if (string.IsNullOrWhiteSpace(newPassword))
            throw new ValidationException("Nouveau mot de passe obligatoire.", "AUTH.NEW_PASSWORD_REQUIRED");

        if (!_passwordPolicy.EstValide(newPassword, out var erreurPwd))
            throw new ValidationException(erreurPwd ?? "Mot de passe invalide.", "AUTH.PASSWORD_WEAK");

        if (!string.IsNullOrWhiteSpace(entity.PasswordHash) &&
            _passwordHasher.Verifier(newPassword, entity.PasswordHash))
            throw new ConflictException("Le nouveau mot de passe doit être différent de l’ancien.", "AUTH.PASSWORD_SAME");

        entity.PasswordHash = _passwordHasher.Hasher(newPassword);
        await _users.SauvegarderAsync(ct);

        return (true, 200, null);
    }

    public async Task<(bool Success, int Code, string? Erreur)>
        GrantMerchantRoleAsync(Guid userId, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(userId, ct);
        if (user is null)
            throw new NotFoundException("Utilisateur introuvable.", "AUTH.USER_NOT_FOUND");

        if (!user.IsActive)
            throw new ForbiddenException("Compte inactif.");

        if (!user.Roles.Contains(UserRole.Touriste))
            user.Roles.Add(UserRole.Touriste);

        if (!user.Roles.Contains(UserRole.Commercant))
            user.Roles.Add(UserRole.Commercant);

        user.Roles = user.Roles.Distinct().ToList();

        await _users.SauvegarderAsync(ct);

        return (true, 200, null);
    }
}