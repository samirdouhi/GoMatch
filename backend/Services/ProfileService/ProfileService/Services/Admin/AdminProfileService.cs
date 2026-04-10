using ProfileService.DTOs.Admin;
using ProfileService.DTOs.Common;
using ProfileService.DTOs.Commercant;
using ProfileService.Enums;
using ProfileService.ErrorHandling.Exceptions;
using ProfileService.Mappers.Admin;
using ProfileService.Mappers.Commercant;
using ProfileService.Models;
using ProfileService.Repositories.Admin;
using ProfileService.Repositories.Commercant;
using ProfileService.Repositories.UserProfiles;
using ProfileService.Security;
using ProfileService.Services.External;
using ProfileService.Clients.Auth;
namespace ProfileService.Services.Admin;

public sealed class AdminProfileService : IAdminProfileService
{
    private readonly IAdminProfileRepository _repository;
    private readonly IUserProfileRepository _userRepository;
    private readonly ICommercantProfileRepository _commercantRepository;
    private readonly IAdminProfileMapper _mapper;
    private readonly ICommercantProfileMapper _commercantMapper;
    private readonly ICurrentUser _currentUser;
    private readonly IEmailClient _emailClient;
    private readonly IAuthClient _authClient;

    public AdminProfileService(
        IAdminProfileRepository repository,
        IUserProfileRepository userRepository,
        ICommercantProfileRepository commercantRepository,
        IAdminProfileMapper mapper,
        ICommercantProfileMapper commercantMapper,
        ICurrentUser currentUser,
        IEmailClient emailClient,
        IAuthClient authClient)
    {
        _repository = repository;
        _userRepository = userRepository;
        _commercantRepository = commercantRepository;
        _mapper = mapper;
        _commercantMapper = commercantMapper;
        _currentUser = currentUser;
        _emailClient = emailClient;
        _authClient = authClient;
    }

    public async Task<AdminProfileResponseDto> GetMyProfileAsync(CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var userProfile = await _userRepository.GetByUserIdAsync(userId);
        if (userProfile is null)
            throw new NotFoundException("UserProfile introuvable.");

        var profile = await _repository.GetByUserIdAsync(userId);
        if (profile is null)
            throw new NotFoundException("Le profil admin est introuvable.");

        return _mapper.ToResponseDto(userProfile, profile);
    }

    public async Task<AdminProfileResponseDto> InitProfileAsync(CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var exists = await _repository.ExistsByUserIdAsync(userId);
        if (exists)
            throw new ConflictException("Le profil admin existe déjà.");

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

        var profile = new AdminProfile
        {
            UserId = userId,
            UserProfileId = userProfile.Id,
            InscriptionTerminee = false,
            Departement = null,
            Fonction = null,
            TelephoneProfessionnel = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(profile);
        await _repository.SaveChangesAsync();

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

        userProfile.Prenom = request.Prenom.Trim();
        userProfile.Nom = request.Nom.Trim();
        userProfile.DateNaissance = DateOnly.FromDateTime(request.DateNaissance);
        userProfile.Genre = parsedGenre;

        if (!string.IsNullOrWhiteSpace(request.Langue))
        {
            if (!Enum.TryParse<Langue>(request.Langue, true, out var parsedLangue))
                throw new ConflictException("La valeur de la langue est invalide.");

            userProfile.Langue = parsedLangue;
        }

        userProfile.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(userProfile);
        await _userRepository.SaveChangesAsync();

        return _mapper.ToUpdateUserProfileResponseDto(userProfile);
    }

    public async Task<AdminProfileResponseDto> UpdateAdminProfileAsync(
        UpdateAdminProfileRequestDto request,
        CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var userProfile = await _userRepository.GetByUserIdAsync(userId);
        if (userProfile is null)
            throw new NotFoundException("UserProfile introuvable.");

        var profile = await _repository.GetByUserIdAsync(userId);
        if (profile is null)
            throw new NotFoundException("Le profil admin est introuvable.");

        _mapper.MapRequest(request, profile);

        profile.InscriptionTerminee =
            !string.IsNullOrWhiteSpace(profile.Departement) &&
            !string.IsNullOrWhiteSpace(profile.Fonction) &&
            !string.IsNullOrWhiteSpace(profile.TelephoneProfessionnel);

        profile.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync();

        return _mapper.ToResponseDto(userProfile, profile);
    }

    public async Task<IReadOnlyList<CommercantReviewResponseDto>> GetPendingCommercantsAsync(CancellationToken ct)
    {
        var profiles = await _commercantRepository.GetByStatusAsync(CommercantStatus.Pending);

        return profiles
            .Select(p => new CommercantReviewResponseDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Status = p.Status.ToString(),
                RejectionReason = p.RejectionReason,
                ReviewedAt = p.ReviewedAt
            })
            .ToList();
    }

    public async Task<CommercantProfileResponseDto> GetCommercantByIdAsync(Guid id, CancellationToken ct)
    {
        var profile = await _commercantRepository.GetByIdAsync(id);
        if (profile is null)
            throw new NotFoundException("Le profil commerçant est introuvable.");

        var userProfile = await _userRepository.GetByUserIdAsync(profile.UserId);
        if (userProfile is null)
            throw new NotFoundException("UserProfile introuvable.");

        return _commercantMapper.ToResponseDto(userProfile, profile);
    }

    public async Task<CommercantProfileResponseDto> ApproveCommercantAsync(Guid id, CancellationToken ct)
    {
        var profile = await _commercantRepository.GetByIdAsync(id);
        if (profile is null)
            throw new NotFoundException("Le profil commerçant est introuvable.");

        if (profile.Status != CommercantStatus.Pending)
            throw new ConflictException("Seuls les profils commerçants en attente peuvent être approuvés.");

        profile.Status = CommercantStatus.Approved;
        profile.ReviewedAt = DateTime.UtcNow;
        profile.RejectionReason = null;
        profile.UpdatedAt = DateTime.UtcNow;

        await _commercantRepository.SaveChangesAsync();

        var roleGranted = await _authClient.GrantMerchantRoleAsync(profile.UserId, ct);

        if (!roleGranted)
        {
            profile.Status = CommercantStatus.Pending;
            profile.ReviewedAt = null;
            profile.UpdatedAt = DateTime.UtcNow;

            await _commercantRepository.SaveChangesAsync();

            throw new Exception("Erreur lors de l’attribution du rôle Merchant.");
        }

        var userProfile = await _userRepository.GetByUserIdAsync(profile.UserId);
        if (userProfile is null)
            throw new NotFoundException("UserProfile introuvable.");

        var destinationEmail = profile.EmailProfessionnel?.Trim();

        var fullName = $"{userProfile.Prenom} {userProfile.Nom}".Trim();
        var safeFullName = string.IsNullOrWhiteSpace(fullName) ? null : fullName;

        if (!string.IsNullOrWhiteSpace(destinationEmail))
        {
            await _emailClient.SendMerchantApprovedEmailAsync(
                destinationEmail,
                safeFullName,
                ct);
        }

        return _commercantMapper.ToResponseDto(userProfile, profile);
    }

    public async Task<CommercantProfileResponseDto> RejectCommercantAsync(
        Guid id,
        UpdateCommercantStatusRequestDto request,
        CancellationToken ct)
    {
        var profile = await _commercantRepository.GetByIdAsync(id);
        if (profile is null)
            throw new NotFoundException("Le profil commerçant est introuvable.");

        if (profile.Status != CommercantStatus.Pending)
            throw new ConflictException("Seuls les profils commerçants en attente peuvent être rejetés.");

        if (string.IsNullOrWhiteSpace(request.RejectionReason))
            throw new ConflictException("La raison du rejet est obligatoire.");

        profile.Status = CommercantStatus.Rejected;
        profile.ReviewedAt = DateTime.UtcNow;
        profile.RejectionReason = request.RejectionReason.Trim();
        profile.UpdatedAt = DateTime.UtcNow;

        await _commercantRepository.SaveChangesAsync();

        var userProfile = await _userRepository.GetByUserIdAsync(profile.UserId);
        if (userProfile is null)
            throw new NotFoundException("UserProfile introuvable.");

        var destinationEmail = profile.EmailProfessionnel?.Trim();

        var fullName = $"{userProfile.Prenom} {userProfile.Nom}".Trim();
        var safeFullName = string.IsNullOrWhiteSpace(fullName) ? null : fullName;

        if (!string.IsNullOrWhiteSpace(destinationEmail))
        {
            await _emailClient.SendMerchantRejectedEmailAsync(
                destinationEmail,
                profile.RejectionReason!,
                safeFullName,
                ct);
        }

        return _commercantMapper.ToResponseDto(userProfile, profile);
    }
    public async Task<AdminProfileStatusResponseDto> GetProfileStatusAsync(CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var userProfile = await _userRepository.GetByUserIdAsync(userId);
        var adminProfile = await _repository.GetByUserIdAsync(userId);

        var userProfileExists = userProfile is not null;
        var adminProfileExists = adminProfile is not null;

        var isComplete =
            userProfileExists &&
            adminProfileExists &&
            !string.IsNullOrWhiteSpace(userProfile!.Prenom) &&
            !string.IsNullOrWhiteSpace(userProfile.Nom) &&
            userProfile.DateNaissance is not null &&
            userProfile.Genre is not null &&
            !string.IsNullOrWhiteSpace(adminProfile!.Departement) &&
            !string.IsNullOrWhiteSpace(adminProfile.Fonction) &&
            !string.IsNullOrWhiteSpace(adminProfile.TelephoneProfessionnel);

        return new AdminProfileStatusResponseDto
        {
            UserProfileExists = userProfileExists,
            AdminProfileExists = adminProfileExists,
            IsComplete = isComplete,
            NeedsInitialization = !adminProfileExists
        };
    }
}