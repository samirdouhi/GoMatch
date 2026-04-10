using AuthService.ErrorHandling;

namespace AuthService.ErrorHandling;

public interface IExceptionMapper
{
    ApiErrorResponse Map(Exception ex, string traceId);
}
