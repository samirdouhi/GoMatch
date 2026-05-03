namespace NotificationService.Models;

public class UserNotificationPreference
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;

    // Type toggles
    public bool SportEnabled { get; set; } = true;
    public bool ContextualEnabled { get; set; } = true;
    public bool AIEnabled { get; set; } = true;
    public bool SponsoredEnabled { get; set; } = true;

    // Anti-spam
    public int MaxPerDay { get; set; } = 3;

    // Quiet hours (in local hour, e.g. 22 = 22h, 8 = 8h)
    public bool QuietHoursEnabled { get; set; } = true;
    public int QuietHoursStart { get; set; } = 22;
    public int QuietHoursEnd { get; set; } = 8;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
