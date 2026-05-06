using CultureService.Exceptions;
using System.Net;
using System.Text.Json;

namespace CultureService.Middleware;

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
            ContenuCulturelNotFoundException => HttpStatusCode.NotFound,
            CategorieCulturelleNotFoundException => HttpStatusCode.NotFound,
            TagCulturelNotFoundException => HttpStatusCode.NotFound,
            ForbiddenCultureAccessException => HttpStatusCode.Forbidden,
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
