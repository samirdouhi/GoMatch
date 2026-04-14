namespace BusinessService.Models
{
    public class PhotoCommerce
    {
        public Guid Id { get; set; }
        public Guid CommerceId { get; set; }
        public Commerce Commerce { get; set; } = null!;
        public string NomFichier { get; set; } = string.Empty;
        public string CheminFichier { get; set; } = string.Empty;
        public string TypeContenu { get; set; } = string.Empty;
        public long TailleFichier { get; set; }
        public int Ordre { get; set; }
        public DateTime DateAjout { get; set; } = DateTime.UtcNow;
    }
}

