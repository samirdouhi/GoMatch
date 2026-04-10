using System.ComponentModel.DataAnnotations;

namespace ProfileService.DTOs.Commercant;

public sealed class UpdateCommercantStatusRequestDto
{
    [Required]
    public string Status { get; set; } = string.Empty;

    public string? RejectionReason { get; set; }
}