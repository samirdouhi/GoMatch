namespace BusinessService.Exceptions
{
    public class CategoryNotFoundException : Exception
    {
        public CategoryNotFoundException(Guid id)
            : base($"Catégorie avec l'ID {id} introuvable.") { }
    }
}