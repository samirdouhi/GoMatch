namespace BusinessService.Exceptions
{
    public class CulturalTagNotFoundException : Exception
    {
        public CulturalTagNotFoundException(Guid id)
            : base($"CulturalTag avec l'ID {id} introuvable.") { }
    }
}