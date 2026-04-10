namespace AuthService.Exceptions;

public sealed class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "Non autorisé.")
        : base(message, 401, "AUTH.UNAUTHORIZED") { }
}
