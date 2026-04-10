using System.ComponentModel.DataAnnotations;

namespace BusinessService.DTOs
{
    public class ModifierTagCulturelRequestDto
    {
        [Required]
        [MaxLength(100)]
        public string Nom { get; set; } = string.Empty;
    }
}