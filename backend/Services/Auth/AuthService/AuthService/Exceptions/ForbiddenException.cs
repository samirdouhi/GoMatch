namespace AuthService.Exceptions;

public sealed class ForbiddenException : AppException
{
    public ForbiddenException(string message = "Accès interdit.")
        : base(message, 403, "AUTH.FORBIDDEN") { }
}