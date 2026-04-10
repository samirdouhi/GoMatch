using BusinessService.DTOs;
using BusinessService.Models;

namespace BusinessService.Mappers
{
    public static class HoraireCommerceMapper
    {
        public static HoraireCommerceReponseDto ToResponse(HoraireCommerce horaire)
        {
            return new HoraireCommerceReponseDto
            {
                Id = horaire.Id,
                CommerceId = horaire.CommerceId,
                JourSemaine = horaire.JourSemaine,
                HeureOuverture = horaire.HeureOuverture,
                HeureFermeture = horaire.HeureFermeture,
                EstFerme = horaire.EstFerme
            };
        }

        public static HoraireCommerce ToEntity(Guid commerceId, CreerHoraireCommerceRequeteDto requete)
        {
            return new HoraireCommerce
            {
                Id = Guid.NewGuid(),
                CommerceId = commerceId,
                JourSemaine = requete.JourSemaine,
                HeureOuverture = requete.HeureOuverture,
                HeureFermeture = requete.HeureFermeture,
                EstFerme = requete.EstFerme
            };
        }

        public static void ApplyUpdate(HoraireCommerce horaire, ModifierHoraireCommerceRequeteDto requete)
        {
            horaire.JourSemaine = requete.JourSemaine;
            horaire.HeureOuverture = requete.HeureOuverture;
            horaire.HeureFermeture = requete.HeureFermeture;
            horaire.EstFerme = requete.EstFerme;
        }
    }
}