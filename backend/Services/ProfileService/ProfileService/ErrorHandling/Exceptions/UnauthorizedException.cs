namespace ProfileService.ErrorHandling.Exceptions;

public sealed class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "Unauthorized.")
        : base(message, "unauthorized")
    {
    }
}