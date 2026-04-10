namespace BusinessService.DTOs
{
    public class HoraireCommerceReponseDto
    {
        public Guid Id { get; set; }

        public Guid CommerceId { get; set; }

        public DayOfWeek JourSemaine { get; set; }

        public TimeSpan HeureOuverture { get; set; }

        public TimeSpan HeureFermeture { get; set; }

        public bool EstFerme { get; set; }
    }
}