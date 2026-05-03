namespace NotificationService.Models;

public class AdminBroadcast
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string TargetRole { get; set; } = "All"; // All | Touriste | Commercant
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public string SentByUserId { get; set; } = string.Empty;
}
