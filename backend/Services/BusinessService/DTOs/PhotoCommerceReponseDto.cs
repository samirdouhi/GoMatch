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
        /// <summary>URL relative passable directement au frontend (via gateway /business)</summary>
        public string UrlImage { get; set; } = string.Empty;
    }
}
