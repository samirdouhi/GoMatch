using System.ComponentModel.DataAnnotations;

namespace BusinessService.DTOs
{
    public class RejeterCommerceRequeteDto
    {
        [MaxLength(500)]
        public string Raison { get; set; } = string.Empty;
    }
}