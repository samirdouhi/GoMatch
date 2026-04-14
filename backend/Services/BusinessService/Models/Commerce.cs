using BusinessService.Enums;

namespace BusinessService.Models
{
    public class Commerce
    {
        public Guid Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Adresse { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public Guid ProprietaireUtilisateurId { get; set; }
        public string ProprietaireEmail { get; set; } = string.Empty;
        public bool EstValide { get; set; } = false;
        public string Statut { get; set; } = StatutCommerce.EnAttente;
        public string? RaisonRejet { get; set; }
        public DateTime DateCreation { get; set; } = DateTime.UtcNow;
        public Guid CategorieId { get; set; }
        public Categorie? Categorie { get; set; }
        public ICollection<TagCulturel> TagsCulturels { get; set; } = new List<TagCulturel>();
        public ICollection<HoraireCommerce> Horaires { get; set; } = new List<HoraireCommerce>();
        public ICollection<PhotoCommerce> Photos { get; set; } = new List<PhotoCommerce>();
    }
}
