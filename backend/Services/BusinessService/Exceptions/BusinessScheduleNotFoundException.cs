namespace BusinessService.Exceptions
{
    public class BusinessScheduleNotFoundException : Exception
    {
        public BusinessScheduleNotFoundException(Guid id)
            : base($"Horaire avec l'ID {id} introuvable.") { }
    }
}