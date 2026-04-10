using ProfileService.DTOs.Commercant;
using ProfileService.DTOs.Common;
using ProfileService.Models;

namespace ProfileService.Mappers.Commercant;

public sealed class CommercantProfileMapper : ICommercantProfileMapper
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

    public CommercantProfileResponseDto ToResponseDto(
        UserProfile userProfile,
        CommercantProfile profile) => new()
        {
            UserProfile = ToUserProfileSummaryDto(userProfile),

            NomResponsable = profile.NomResponsable,
            Telephone = profile.Telephone,
            EmailProfessionnel = profile.EmailProfessionnel,
            Ville = profile.Ville,
            AdresseProfessionnelle = profile.AdresseProfessionnelle,
            TypeActivite = profile.TypeActivite,

            Status = profile.Status.ToString(),
            RejectionReason = profile.RejectionReason,
            SubmittedAt = profile.SubmittedAt,
            ReviewedAt = profile.ReviewedAt,

            CommerceId = profile.CommerceId,
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

    public void MapRequest(CompleteCommercantProfileRequestDto dto, CommercantProfile profile)
    {
        profile.NomResponsable = string.IsNullOrWhiteSpace(dto.NomResponsable)
            ? null
            : dto.NomResponsable.Trim();

        profile.Telephone = string.IsNullOrWhiteSpace(dto.Telephone)
            ? null
            : dto.Telephone.Trim();

        profile.EmailProfessionnel = string.IsNullOrWhiteSpace(dto.EmailProfessionnel)
            ? null
            : dto.EmailProfessionnel.Trim();

        profile.Ville = string.IsNullOrWhiteSpace(dto.Ville)
            ? null
            : dto.Ville.Trim();

        profile.AdresseProfessionnelle = string.IsNullOrWhiteSpace(dto.AdresseProfessionnelle)
            ? null
            : dto.AdresseProfessionnelle.Trim();

        profile.TypeActivite = string.IsNullOrWhiteSpace(dto.TypeActivite)
            ? null
            : dto.TypeActivite.Trim();

        profile.CommerceId = dto.CommerceId;
        profile.UpdatedAt = DateTime.UtcNow;
    }
}