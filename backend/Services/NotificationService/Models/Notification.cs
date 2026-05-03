namespace NotificationService.Models;

public enum NotificationType
{
    Sport = 0,
    Contextual = 1,
    AI = 2,
    Sponsored = 3
}

public enum NotificationPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;

    public NotificationType Type { get; set; }
    public NotificationPriority Priority { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    public string? ActionUrl { get; set; }
    public string? ImageUrl { get; set; }

    // JSON blob for extra data (matchId, commerceId, lat/lng, etc.)
    public string? MetaJson { get; set; }

    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }

    // For sponsored notifications: link to the promotion
    public Guid? PromotionId { get; set; }
}
