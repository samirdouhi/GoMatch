using BusinessService.Exceptions;
using System.Net;
using System.Text.Json;

namespace BusinessService.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var statusCode = exception switch
            {
                BusinessNotFoundException => HttpStatusCode.NotFound,
                CategoryNotFoundException => HttpStatusCode.NotFound,
                CulturalTagNotFoundException => HttpStatusCode.NotFound,
                BusinessScheduleNotFoundException => HttpStatusCode.NotFound,
                ForbiddenBusinessAccessException => HttpStatusCode.Forbidden,
                ArgumentException => HttpStatusCode.BadRequest,
                _ => HttpStatusCode.InternalServerError
            };

            var response = new
            {
                statusCode = (int)statusCode,
                message = exception.Message,
                details = exception.InnerException?.Message
            };

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            return context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}