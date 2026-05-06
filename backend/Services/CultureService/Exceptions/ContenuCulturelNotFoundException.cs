namespace CultureService.Exceptions;

public class ContenuCulturelNotFoundException : Exception
{
    public ContenuCulturelNotFoundException(Guid id)
        : base($"Contenu culturel avec l'ID {id} introuvable.") { }
}
