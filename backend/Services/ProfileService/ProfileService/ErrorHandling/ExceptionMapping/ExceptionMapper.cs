using Microsoft.AspNetCore.Http;
using ProfileService.ErrorHandling.Exceptions;

namespace ProfileService.ErrorHandling.ExceptionMapping;

public sealed class ExceptionMapper : IExceptionMapper
{
    public ExceptionMappingResult Map(Exception exception)
    {
        return exception switch
        {
            NotFoundException ex => new ExceptionMappingResult
            {
                StatusCode = StatusCodes.Status404NotFound,
                ErrorCode = ex.ErrorCode,
                Message = ex.Message
            },

            ForbiddenException ex => new ExceptionMappingResult
            {
                StatusCode = StatusCodes.Status403Forbidden,
                ErrorCode = ex.ErrorCode,
                Message = ex.Message
            },

            ValidationException ex => new ExceptionMappingResult
            {
                StatusCode = StatusCodes.Status400BadRequest,
                ErrorCode = ex.ErrorCode,
                Message = ex.Message
            },

            ConflictException ex => new ExceptionMappingResult
            {
                StatusCode = StatusCodes.Status409Conflict,
                ErrorCode = ex.ErrorCode,
                Message = ex.Message
            },

            UnauthorizedException ex => new ExceptionMappingResult
            {
                StatusCode = StatusCodes.Status401Unauthorized,
                ErrorCode = ex.ErrorCode,
                Message = ex.Message
            },

            _ => new ExceptionMappingResult
            {
                StatusCode = StatusCodes.Status500InternalServerError,
                ErrorCode = "internal_server_error",
                Message = "An unexpected error occurred."
            }
        };
    }
}