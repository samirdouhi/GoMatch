using NotificationService.Models;

namespace NotificationService.DTOs;

public record NotificationDto(
    Guid Id,
    string UserId,
    string Type,
    string Priority,
    string Title,
    string Message,
    string? ActionUrl,
    string? ImageUrl,
    string? Meta,
    bool IsRead,
    DateTime CreatedAt,
    DateTime? ReadAt,
    Guid? PromotionId
)
{
    public static NotificationDto From(Notification n) => new(
        n.Id, n.UserId,
        n.Type.ToString().ToLower(),
        n.Priority.ToString().ToLower(),
        n.Title, n.Message,
        n.ActionUrl, n.ImageUrl, n.MetaJson,
        n.IsRead, n.CreatedAt, n.ReadAt,
        n.PromotionId
    );
}

public record PromotionDto(
    Guid Id,
    string BusinessId,
    string BusinessName,
    string Title,
    string Description,
    string? ImageUrl,
    double RadiusKm,
    int Priority,
    bool IsActive,
    DateTime StartDate,
    DateTime EndDate,
    int ImpressionCount,
    int ClickCount
)
{
    public static PromotionDto From(Promotion p) => new(
        p.Id, p.BusinessId, p.BusinessName,
        p.Title, p.Description, p.ImageUrl,
        p.RadiusKm, p.Priority, p.IsActive,
        p.StartDate, p.EndDate,
        p.ImpressionCount, p.ClickCount
    );
}

public record CreatePromotionDto(
    string Title,
    string Description,
    string? ImageUrl,
    double RadiusKm,
    double? TargetLatitude,
    double? TargetLongitude,
    decimal Budget,
    DateTime StartDate,
    DateTime EndDate
);

public record UserPreferenceDto(
    bool SportEnabled,
    bool ContextualEnabled,
    bool AIEnabled,
    bool SponsoredEnabled,
    int MaxPerDay,
    bool QuietHoursEnabled,
    int QuietHoursStart,
    int QuietHoursEnd
);
