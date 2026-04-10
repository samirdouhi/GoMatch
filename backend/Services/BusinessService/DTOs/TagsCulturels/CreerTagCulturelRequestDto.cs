using System.ComponentModel.DataAnnotations;

namespace BusinessService.DTOs
{
    public class CreerTagCulturelRequestDto
    {
        [Required]
        [MaxLength(100)]
        public string Nom { get; set; } = string.Empty;
    }
}