namespace CultureService.Exceptions;

public class ForbiddenCultureAccessException : Exception
{
    public ForbiddenCultureAccessException(string message)
        : base(message) { }
}
