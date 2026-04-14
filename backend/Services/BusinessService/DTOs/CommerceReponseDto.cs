namespace BusinessService.DTOs
{
    public class CommerceReponseDto
    {
        public Guid Id { get; set; }

        public string Nom { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Adresse { get; set; } = string.Empty;

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        public Guid ProprietaireUtilisateurId { get; set; }

        public string ProprietaireEmail { get; set; } = string.Empty;

        public bool EstValide { get; set; }

        /// <summary>EnAttente | Approuve | Rejete</summary>
        public string Statut { get; set; } = string.Empty;

        public string? RaisonRejet { get; set; }

        public DateTime DateCreation { get; set; }

        public Guid CategorieId { get; set; }

        public string? NomCategorie { get; set; }

        public List<string> TagsCulturels { get; set; } = new();

        public List<HoraireCommerceReponseDto> Horaires { get; set; } = new();

        public List<PhotoCommerceReponseDto> Photos { get; set; } = new();
    }
}
