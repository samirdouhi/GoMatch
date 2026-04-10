using System.ComponentModel.DataAnnotations;

namespace BusinessService.DTOs
{
    public class CreerCategorieRequestDto
    {
        [Required]
        [MaxLength(100)]
        public string Nom { get; set; } = string.Empty;
    }
}