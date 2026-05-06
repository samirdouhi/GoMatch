namespace CultureService.Exceptions;

public class TagCulturelNotFoundException : Exception
{
    public TagCulturelNotFoundException(Guid id)
        : base($"Tag culturel avec l'ID {id} introuvable.") { }
}
