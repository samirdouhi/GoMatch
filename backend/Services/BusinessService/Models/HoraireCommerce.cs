namespace BusinessService.Models
{
    public class HoraireCommerce
    {
        public Guid Id { get; set; }

        public Guid CommerceId { get; set; }

        public Commerce Commerce { get; set; } = null!;

        public DayOfWeek JourSemaine { get; set; }

        public TimeSpan HeureOuverture { get; set; }

        public TimeSpan HeureFermeture { get; set; }

        public bool EstFerme { get; set; }
    }
}