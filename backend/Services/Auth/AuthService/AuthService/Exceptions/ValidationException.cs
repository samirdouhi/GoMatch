namespace AuthService.Exceptions;

public sealed class ValidationException : AppException
{
    public ValidationException(string message, string errorCode = "VALIDATION.ERROR")
        : base(message, 400, errorCode) { }
}