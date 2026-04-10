namespace AuthService.Exceptions;

public sealed class ConflictException : AppException
{
    public ConflictException(string message, string errorCode)
        : base(message, 409, errorCode) { }
}
