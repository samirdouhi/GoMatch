using System.ComponentModel.DataAnnotations;

namespace BusinessService.DTOs
{
    public class ModifierCategorieRequestDto
    {
        [Required]
        [MaxLength(100)]
        public string Nom { get; set; } = string.Empty;
    }
}