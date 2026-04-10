namespace BusinessService.DTOs
{
    public class CommerceProcheReponseDto
    {
        public Guid Id { get; set; }

        public string Nom { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Adresse { get; set; } = string.Empty;

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        public double DistanceKm { get; set; }

        public string NomCategorie { get; set; } = string.Empty;

        public List<string> TagsCulturels { get; set; } = new();
    }
}