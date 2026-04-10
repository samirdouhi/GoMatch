using ProfileService.DTOs.Commercant;
using ProfileService.DTOs.Common;
using ProfileService.Enums;
using ProfileService.ErrorHandling.Exceptions;
using ProfileService.Mappers.Commercant;
using ProfileService.Models;
using ProfileService.Repositories.Commercant;
using ProfileService.Repositories.UserProfiles;
using ProfileService.Security;
using ProfileService.Services.External;

namespace ProfileService.Services.Commercant;

public sealed class CommercantProfileService : ICommercantProfileService
{
    private readonly ICommercantProfileRepository _repository;
    private readonly IUserProfileRepository _userRepository;
    private readonly ICommercantProfileMapper _mapper;
    private readonly ICurrentUser _currentUser;
    private readonly IEmailClient _emailClient;

    public CommercantProfileService(
        ICommercantProfileRepository repository,
        IUserProfileRepository userRepository,
        ICommercantProfileMapper mapper,
        ICurrentUser currentUser,
         IEmailClient emailClient)
    {
        _repository = repository;
        _userRepository = userRepository;
        _mapper = mapper;
        _currentUser = currentUser;
        _emailClient = emailClient;
    }

    public async Task<CommercantProfileResponseDto?> GetMyProfileAsync(CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var userProfile = await _userRepository.GetByUserIdAsync(userId);
        if (userProfile is null)
            throw new NotFoundException("UserProfile introuvable.");

        var profile = await _repository.GetByUserIdAsync(userId);
        if (profile is null)
            return null;

        return _mapper.ToResponseDto(userProfile, profile);
    }

    public async Task<CommercantProfileResponseDto> InitProfileAsync(CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var userProfile = await _userRepository.GetByUserIdAsync(userId);
        if (userProfile is null)
        {
            userProfile = new UserProfile
            {
                UserId = userId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRepository.AddAsync(userProfile);
            await _userRepository.SaveChangesAsync();
        }

        // 🔥 IMPORTANT : chercher directement le profil existant
        var existingProfile = await _repository.GetByUserIdAsync(userId);
        if (existingProfile is not null)
        {
            return _mapper.ToResponseDto(userProfile, existingProfile);
        }

        var profile = new CommercantProfile
        {
            UserId = userId,
            UserProfileId = userProfile.Id,
            InscriptionTerminee = false,
            Status = CommercantStatus.Incomplete,
            SubmittedAt = null,
            ReviewedAt = null,
            RejectionReason = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(profile);

        try
        {
            await _repository.SaveChangesAsync();
        }
        catch
        {
            // si un autre appel a créé le profil juste avant,
            // on recharge ce qui existe déjà
            var fallbackProfile = await _repository.GetByUserIdAsync(userId);
            if (fallbackProfile is not null)
            {
                return _mapper.ToResponseDto(userProfile, fallbackProfile);
            }

            throw;
        }

        return _mapper.ToResponseDto(userProfile, profile);
    }
    public async Task<CommercantProfileResponseDto> UpdateCommercantProfileAsync(
    CompleteCommercantProfileRequestDto request,
    CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var userProfile = await _userRepository.GetByUserIdAsync(userId);
        if (userProfile is null)
            throw new NotFoundException("UserProfile introuvable.");

        var profile = await _repository.GetByUserIdAsync(userId);
        if (profile is null)
            throw new NotFoundException("Le profil commerçant est introuvable.");

        _mapper.MapRequest(request, profile);

        // 🔒 Vérifications obligatoires
        if (string.IsNullOrWhiteSpace(userProfile.Prenom) ||
            string.IsNullOrWhiteSpace(userProfile.Nom) ||
            userProfile.DateNaissance is null ||
            userProfile.Genre is null)
        {
            throw new ConflictException(
                "Le prénom, le nom, la date de naissance et le genre sont obligatoires.");
        }

        if (string.IsNullOrWhiteSpace(profile.Telephone))
            throw new ConflictException("Le téléphone est obligatoire.");

        if (string.IsNullOrWhiteSpace(profile.NomResponsable))
            throw new ConflictException("Le nom du responsable est obligatoire.");

        if (string.IsNullOrWhiteSpace(profile.TypeActivite))
            throw new ConflictException("Le type d'activité est obligatoire.");

        if (string.IsNullOrWhiteSpace(profile.EmailProfessionnel))
            throw new ConflictException("L'email professionnel est obligatoire.");

        // 🔥 IMPORTANT : génération du token
        var token = Guid.NewGuid().ToString("N");

        profile.ProfessionalEmailVerificationToken = token;
        profile.ProfessionalEmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24);
        profile.IsProfessionalEmailVerified = false;

        // 🔥 CHANGEMENT PRINCIPAL
        profile.Status = CommercantStatus.EmailVerificationPending;

        profile.InscriptionTerminee = true;
        profile.SubmittedAt = null; // PAS encore soumis
        profile.ReviewedAt = null;
        profile.RejectionReason = null;
        profile.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync();

        // 🔥 Envoi email de vérification
        await _emailClient.SendMerchantEmailVerificationAsync(
            profile.EmailProfessionnel!,
            token,
            $"{userProfile.Prenom} {userProfile.Nom}".Trim(),
            ct
        );

        return _mapper.ToResponseDto(userProfile, profile);
    }

    public async Task<UpdateUserProfileResponseDto> UpdateUserProfileAsync(
        UpdateUserProfileRequestDto request,
        CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var userProfile = await _userRepository.GetByUserIdAsync(userId);
        if (userProfile is null)
            throw new NotFoundException("UserProfile introuvable.");

        if (string.IsNullOrWhiteSpace(request.Prenom))
            throw new ConflictException("Le prénom est obligatoire.");

        if (string.IsNullOrWhiteSpace(request.Nom))
            throw new ConflictException("Le nom est obligatoire.");

        if (string.IsNullOrWhiteSpace(request.Genre))
            throw new ConflictException("Le genre est obligatoire.");

        if (!Enum.TryParse<Genre>(request.Genre, true, out var parsedGenre))
            throw new ConflictException("La valeur du genre est invalide.");

        Langue parsedLangue = userProfile.Langue;

        if (!string.IsNullOrWhiteSpace(request.Langue) &&
            !Enum.TryParse<Langue>(request.Langue, true, out parsedLangue))
        {
            throw new ConflictException("La valeur de la langue est invalide.");
        }

        userProfile.Prenom = request.Prenom.Trim();
        userProfile.Nom = request.Nom.Trim();
        userProfile.DateNaissance = DateOnly.FromDateTime(request.DateNaissance);
        userProfile.Genre = parsedGenre;

        if (!string.IsNullOrWhiteSpace(request.Langue))
            userProfile.Langue = parsedLangue;

        userProfile.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(userProfile);
        await _userRepository.SaveChangesAsync();

        return _mapper.ToUpdateUserProfileResponseDto(userProfile);
    }
    public async Task ConfirmProfessionalEmailAsync(string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ConflictException("Token invalide.");

        var profile = await _repository.GetByVerificationTokenAsync(token);

        if (profile is null)
            throw new NotFoundException("Token invalide ou expiré.");

        if (profile.ProfessionalEmailVerificationTokenExpiresAt < DateTime.UtcNow)
            throw new ConflictException("Le lien de vérification a expiré.");

        // 🔥 Marquer email vérifié
        profile.IsProfessionalEmailVerified = true;
        profile.ProfessionalEmailVerificationToken = null;
        profile.ProfessionalEmailVerificationTokenExpiresAt = null;

        // 🔥 Passage en vrai workflow admin
        profile.Status = CommercantStatus.Pending;
        profile.SubmittedAt = DateTime.UtcNow;
        profile.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync();

        // 🔥 Email "demande reçue"
        var userProfile = await _userRepository.GetByUserIdAsync(profile.UserId);

        var fullName = userProfile is null
            ? null
            : $"{userProfile.Prenom} {userProfile.Nom}".Trim();

        if (!string.IsNullOrWhiteSpace(profile.EmailProfessionnel))
        {
            await _emailClient.SendMerchantSubmissionReceivedEmailAsync(
                profile.EmailProfessionnel!,
                fullName,
                ct
            );
        }
    }
}