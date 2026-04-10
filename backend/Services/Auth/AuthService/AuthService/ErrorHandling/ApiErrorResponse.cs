namespace AuthService.ErrorHandling;

public sealed record ApiErrorResponse(
    int Status,
    string Message,
    string Code,
    string TraceId
);
