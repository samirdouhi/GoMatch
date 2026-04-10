namespace ProfileService.ErrorHandling.Exceptions;

public sealed class NotFoundException : AppException
{
    public NotFoundException(string message = "Resource not found.")
        : base(message, "not_found")
    {
    }
}