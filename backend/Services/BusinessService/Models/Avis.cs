namespace BusinessService.Models
{
    public class Avis
    {
        public Guid Id { get; set; }
        public Guid CommerceId { get; set; }
        public Commerce? Commerce { get; set; }
        public Guid UtilisateurId { get; set; }
        public string UtilisateurEmail { get; set; } = string.Empty;
        public int Note { get; set; }
        public string? Commentaire { get; set; }
        public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    }
}
