using ProfileService.DTOs.Admin;
using ProfileService.DTOs.Common;
using ProfileService.Models;

namespace ProfileService.Mappers.Admin;

public sealed class AdminProfileMapper : IAdminProfileMapper
{
    private const string MyPhotoEndpoint = "/profile/me/photo";

    private static string? BuildPhotoUrl(UserProfile userProfile)
        => string.IsNullOrWhiteSpace(userProfile.PhotoPath)
            ? null
            : MyPhotoEndpoint;

    private static UserProfileSummaryDto ToUserProfileSummaryDto(UserProfile userProfile) => new()
    {
        UserId = userProfile.UserId,
        Prenom = userProfile.Prenom,
        Nom = userProfile.Nom,
        DateNaissance = userProfile.DateNaissance,
        Genre = userProfile.Genre?.ToString(),
        Langue = userProfile.Langue.ToString(),
        PhotoUrl = BuildPhotoUrl(userProfile),
        IsActive = userProfile.IsActive
    };

    public AdminProfileResponseDto ToResponseDto(
        UserProfile userProfile,
        AdminProfile profile) => new()
        {
            UserProfile = ToUserProfileSummaryDto(userProfile),
            Departement = profile.Departement,
            Fonction = profile.Fonction,
            TelephoneProfessionnel = profile.TelephoneProfessionnel,
            InscriptionTerminee = profile.InscriptionTerminee
        };

    public UpdateUserProfileResponseDto ToUpdateUserProfileResponseDto(UserProfile userProfile) => new()
    {
        Prenom = userProfile.Prenom ?? string.Empty,
        Nom = userProfile.Nom ?? string.Empty,
        DateNaissance = userProfile.DateNaissance ?? default,
        Genre = userProfile.Genre?.ToString() ?? string.Empty,
        Langue = userProfile.Langue.ToString(),
        PhotoUrl = BuildPhotoUrl(userProfile)
    };

    public void MapRequest(UpdateAdminProfileRequestDto dto, AdminProfile profile)
    {
        profile.Departement = string.IsNullOrWhiteSpace(dto.Departement)
            ? null
            : dto.Departement.Trim();

        profile.Fonction = string.IsNullOrWhiteSpace(dto.Fonction)
            ? null
            : dto.Fonction.Trim();

        profile.TelephoneProfessionnel = string.IsNullOrWhiteSpace(dto.TelephoneProfessionnel)
            ? null
            : dto.TelephoneProfessionnel.Trim();

        profile.UpdatedAt = DateTime.UtcNow;
    }
}