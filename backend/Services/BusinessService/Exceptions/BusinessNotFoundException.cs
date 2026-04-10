namespace BusinessService.Exceptions
{
    public class BusinessNotFoundException : Exception
    {
        public BusinessNotFoundException(Guid id)
            : base($"Business avec l'ID {id} introuvable.") { }
    }
}