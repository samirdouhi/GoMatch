namespace BusinessService.Models
{
    public class TagCulturel
    {
        public Guid Id { get; set; }

        public string Nom { get; set; } = string.Empty;

        public ICollection<Commerce> Commerces { get; set; } = new List<Commerce>();
    }
}