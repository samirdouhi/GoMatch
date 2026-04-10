namespace ProfileService.ErrorHandling.Exceptions;

public sealed class ValidationException : AppException
{
    public ValidationException(string message = "Validation failed.")
        : base(message, "validation_error")
    {
    }
}