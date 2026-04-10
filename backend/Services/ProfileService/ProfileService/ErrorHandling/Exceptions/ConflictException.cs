namespace ProfileService.ErrorHandling.Exceptions;

public sealed class ConflictException : AppException
{
    public ConflictException(string message = "Conflict detected.")
        : base(message, "conflict")
    {
    }
}