using System.ComponentModel.DataAnnotations;

namespace ProfileService.DTOs.Admin;

public sealed class UpdateAdminProfileRequestDto
{
    [MaxLength(100)]
    public string? Departement { get; set; }

    [MaxLength(100)]
    public string? Fonction { get; set; }

    [MaxLength(20)]
    [Phone]
    public string? TelephoneProfessionnel { get; set; }
}