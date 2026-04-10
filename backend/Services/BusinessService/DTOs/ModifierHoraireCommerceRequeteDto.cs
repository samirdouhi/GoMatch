using System.ComponentModel.DataAnnotations;

namespace BusinessService.DTOs
{
    public class ModifierHoraireCommerceRequeteDto
    {
        [Required]
        public DayOfWeek JourSemaine { get; set; }

        public TimeSpan HeureOuverture { get; set; }

        public TimeSpan HeureFermeture { get; set; }

        public bool EstFerme { get; set; }
    }
}