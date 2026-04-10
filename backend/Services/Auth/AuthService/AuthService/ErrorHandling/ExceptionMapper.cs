using AuthService.Exceptions;

namespace AuthService.ErrorHandling;

public sealed class ExceptionMapper : IExceptionMapper
{
    public ApiErrorResponse Map(Exception ex, string traceId)
    {
        // 1) Erreurs métier contrôlées
        if (ex is AppException appEx)
        {
            return new ApiErrorResponse(
                Status: appEx.StatusCode,
                Message: appEx.Message,
                Code: appEx.ErrorCode,
                TraceId: traceId
            );
        }

        // 2) Erreur inconnue => 500 générique
        return new ApiErrorResponse(
            Status: 500,
            Message: "Une erreur interne est survenue.",
            Code: "SERVER.ERROR",
            TraceId: traceId
        );
    }
}
