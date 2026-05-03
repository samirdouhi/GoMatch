namespace NotificationService.Models;

public class Promotion
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string BusinessId { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }

    // Targeting
    public double RadiusKm { get; set; } = 2.0;
    public double? TargetLatitude { get; set; }
    public double? TargetLongitude { get; set; }

    // Monetisation
    public decimal Budget { get; set; }
    public decimal BudgetSpent { get; set; } = 0;
    public decimal CostPerImpression { get; set; } = 0.05m;

    // Higher number = shown first among sponsored notifications
    public int Priority { get; set; } = 1;

    public bool IsActive { get; set; } = true;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    // Analytics
    public int ImpressionCount { get; set; } = 0;
    public int ClickCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
