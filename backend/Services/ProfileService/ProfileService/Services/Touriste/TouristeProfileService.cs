using Microsoft.AspNetCore.Http;
using ProfileService.DTOs.Common;
using ProfileService.DTOs.Touriste;
using ProfileService.Enums;
using ProfileService.ErrorHandling.Exceptions;
using ProfileService.Mappers.Touriste;
using ProfileService.Models;
using ProfileService.Repositories.Touriste;
using ProfileService.Repositories.UserProfiles;
using ProfileService.Security;
using ProfileService.Services.Storage;

namespace ProfileService.Services.Touriste;

public sealed class TouristeProfileService : ITouristeProfileService
{
    private readonly ITouristeProfileRepository _repository;
    private readonly IUserProfileRepository _userRepository;
    private readonly ITouristeProfileMapper _mapper;
    private readonly ICurrentUser _currentUser;
    private readonly IProfilePhotoStorageService _photoStorage;

    public TouristeProfileService(
        ITouristeProfileRepository repository,
        IUserProfileRepository userRepository,
        ITouristeProfileMapper mapper,
        ICurrentUser currentUser,
        IProfilePhotoStorageService photoStorage)
    {
        _repository = repository;
        _userRepository = userRepository;
        _mapper = mapper;
        _currentUser = currentUser;
        _photoStorage = photoStorage;
    }

    public async Task<TouristeProfileResponseDto> GetMyProfileAsync(CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var userProfile = await _userRepository.GetByUserIdAsync(userId);
        if (userProfile is null)
            throw new NotFoundException("UserProfile introuvable.");

        var profile = await _repository.GetByUserIdAsync(userId);
        if (profile is null)
            throw new NotFoundException("Profil touriste introuvable.");

        return _mapper.ToProfileResponseDto(userProfile, profile);
    }

    public async Task<TouristeProfileResponseDto> InitProfileAsync(CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var exists = await _repository.ExistsByUserIdAsync(userId);
        if (exists)
            throw new ConflictException("Le profil touriste existe déjà.");

        // 🔥 FIX : auto-create UserProfile
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

        var profile = new TouristeProfile
        {
            UserId = userId,
            UserProfileId = userProfile.Id,
            InscriptionTerminee = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(profile);
        await _repository.SaveChangesAsync();

        return _mapper.ToProfileResponseDto(userProfile, profile);
    }
    public async Task<TouristeProfileResponseDto> RegisterInitAsync(
     RegisterTouristeProfileRequestDto request,
     CancellationToken ct)
    {
        var exists = await _repository.ExistsByUserIdAsync(request.UserId);
        if (exists)
            throw new ConflictException("Le profil touriste existe déjà.");

        var userProfile = await _userRepository.GetByUserIdAsync(request.UserId);

        if (userProfile is null)
        {
            var genreClean = request.Genre?.Trim();

            if (!Enum.TryParse<Genre>(genreClean, true, out var parsedGenre))
                throw new ConflictException($"Genre invalide : '{request.Genre}'");

            userProfile = new UserProfile
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                Prenom = request.Prenom.Trim(),
                Nom = request.Nom.Trim(),
                DateNaissance = DateOnly.FromDateTime(request.DateNaissance),
                Genre = parsedGenre,
                Langue = Langue.FR,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRepository.AddAsync(userProfile);
            await _userRepository.SaveChangesAsync();
        }

        var profile = new TouristeProfile
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            UserProfileId = userProfile.Id,
            Nationalite = string.IsNullOrWhiteSpace(request.Nationalite)
                ? null
                : request.Nationalite.Trim(),
            InscriptionTerminee = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(profile);
        await _repository.SaveChangesAsync();

        return _mapper.ToProfileResponseDto(userProfile, profile);
    }

    public async Task<UpdateUserProfileResponseDto> UpdateUserProfileAsync(
        UpdateUserProfileRequestDto request,
        CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var userProfile = await _userRepository.GetByUserIdAsync(userId);
        if (userProfile is null)
            throw new NotFoundException("UserProfile introuvable.");

        if (!Enum.TryParse<Genre>(request.Genre, true, out var parsedGenre))
            throw new ConflictException("Genre invalide.");

        userProfile.Prenom = request.Prenom.Trim();
        userProfile.Nom = request.Nom.Trim();
        userProfile.DateNaissance = DateOnly.FromDateTime(request.DateNaissance);
        userProfile.Genre = parsedGenre;

        if (!string.IsNullOrWhiteSpace(request.Langue))
        {
            if (!Enum.TryParse<Langue>(request.Langue, true, out var parsedLangue))
                throw new ConflictException("Langue invalide.");

            userProfile.Langue = parsedLangue;
        }

        userProfile.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(userProfile);
        await _userRepository.SaveChangesAsync();

        return _mapper.ToUpdateUserProfileResponseDto(userProfile);
    }

    public async Task<TouristePreferencesResponseDto> UpdatePreferencesAsync(
     UpdateTouristePreferencesRequestDto request,
     CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var profile = await _repository.GetByUserIdAsync(userId);
        if (profile is null)
            throw new NotFoundException("Profil touriste introuvable.");

        profile.PreferencesJson = request.PreferencesJson;
        profile.EquipesSuiviesJson = request.EquipesSuiviesJson;
        profile.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync();

        return _mapper.ToPreferencesResponseDto(profile);
    }

    public async Task<CompleteTouristeOnboardingResponseDto> CompleteOnboardingAsync(
        CompleteTouristeOnboardingRequestDto request,
        CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var profile = await _repository.GetByUserIdAsync(userId);
        if (profile is null)
            throw new NotFoundException("Profil touriste introuvable.");

        _mapper.MapOnboarding(request, profile);

        profile.InscriptionTerminee = true;
        profile.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync();

        return new CompleteTouristeOnboardingResponseDto
        {
            InscriptionTerminee = true
        };
    }

    public async Task<PhotoUploadResponseDto> UploadPhotoAsync(IFormFile photo, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var userProfile = await _userRepository.GetByUserIdAsync(userId);
        if (userProfile is null)
            throw new NotFoundException("UserProfile introuvable.");

        var savedPath = await _photoStorage.SaveAsync(
            userId,
            photo,
            userProfile.PhotoPath,
            ct);

        userProfile.PhotoPath = savedPath;
        userProfile.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(userProfile);
        await _userRepository.SaveChangesAsync();

        return new PhotoUploadResponseDto
        {
            PhotoUrl = "/profile/me/photo"
        };
    }

    public async Task<(Stream Stream, string ContentType)> GetMyPhotoAsync(CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var userProfile = await _userRepository.GetByUserIdAsync(userId);
        if (userProfile is null || string.IsNullOrEmpty(userProfile.PhotoPath))
            throw new NotFoundException("Photo introuvable.");

        return await _photoStorage.OpenReadAsync(userProfile.PhotoPath, ct);
    }
}