namespace CultureService.Exceptions;

public class CategorieCulturelleNotFoundException : Exception
{
    public CategorieCulturelleNotFoundException(Guid id)
        : base($"Catégorie culturelle avec l'ID {id} introuvable.") { }
}
