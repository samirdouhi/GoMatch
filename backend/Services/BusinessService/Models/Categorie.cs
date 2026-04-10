namespace BusinessService.Models
{
    public class Categorie
    {
        public Guid Id { get; set; }

        public string Nom { get; set; } = string.Empty;

        public List<Commerce> Commerces { get; set; } = new();
    }
}