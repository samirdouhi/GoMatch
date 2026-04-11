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

        /// <summary>Email du propriétaire stocké à la création pour les notifications.</summary>
        public string ProprietaireEmail { get; set; } = string.Empty;

        /// <summary>EstValide reste pour rétro-compatibilité : true ssi Statut == Approuve.</summary>
        public bool EstValide { get; set; } = false;

        /// <summary>Statut workflow : EnAttente | Approuve | Rejete</summary>
        public string Statut { get; set; } = StatutCommerce.EnAttente;

        /// <summary>Raison du rejet (optionnelle).</summary>
        public string? RaisonRejet { get; set; }

        public DateTime DateCreation { get; set; } = DateTime.UtcNow;

        public Guid CategorieId { get; set; }

        public Categorie? Categorie { get; set; }

        public ICollection<TagCulturel> TagsCulturels { get; set; } = new List<TagCulturel>();

        public ICollection<HoraireCommerce> Horaires { get; set; } = new List<HoraireCommerce>();
    }
}