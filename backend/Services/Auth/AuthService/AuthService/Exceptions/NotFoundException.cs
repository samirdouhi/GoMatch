namespace AuthService.Exceptions;

public sealed class NotFoundException : AppException
{
    public NotFoundException(string message, string errorCode)
        : base(message, 404, errorCode) { }
}
