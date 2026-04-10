namespace ProfileService.DTOs.Commercant;

public sealed class CommercantReviewResponseDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? Status { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
