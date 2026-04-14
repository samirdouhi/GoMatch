namespace BusinessService.DTOs
{
    public class PhotoCommerceReponseDto
    {
        public Guid Id { get; set; }
        public Guid CommerceId { get; set; }
        public string NomFichier { get; set; } = string.Empty;
        public string TypeContenu { get; set; } = string.Empty;
        public long TailleFichier { get; set; }
        public int Ordre { get; set; }
        public DateTime DateAjout { get; set; }
        public string UrlImage { get; set; } = string.Empty;
    }
}
