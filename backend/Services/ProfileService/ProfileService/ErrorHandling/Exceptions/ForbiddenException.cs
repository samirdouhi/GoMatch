namespace ProfileService.ErrorHandling.Exceptions;

public sealed class ForbiddenException : AppException
{
    public ForbiddenException(string message = "Access forbidden.")
        : base(message, "forbidden")
    {
    }
}