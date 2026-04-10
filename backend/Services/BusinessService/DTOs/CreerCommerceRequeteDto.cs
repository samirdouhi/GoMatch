using System.ComponentModel.DataAnnotations;

namespace BusinessService.DTOs
{
    public class CreerCommerceRequeteDto
    {
        [Required]
        [MaxLength(100)]
        public string Nom { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(250)]
        public string Adresse { get; set; } = string.Empty;

        [Range(-90, 90)]
        public double Latitude { get; set; }

        [Range(-180, 180)]
        public double Longitude { get; set; }

        [Required]
        public Guid CategorieId { get; set; }
    }
}