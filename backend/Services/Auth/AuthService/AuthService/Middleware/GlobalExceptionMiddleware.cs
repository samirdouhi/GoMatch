using System.Text.Json;
using AuthService.ErrorHandling;

namespace AuthService.Middleware;

public sealed class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IExceptionMapper mapper)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var traceId = context.TraceIdentifier;
            var path = context.Request.Path.Value ?? "";
            var method = context.Request.Method;
            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            // Mapping contrôlé vers réponse API safe
            var apiError = mapper.Map(ex, traceId);

            // Log côté serveur (détails) - sans données sensibles
            _logger.LogError(ex,
                "Unhandled exception. Status={Status} TraceId={TraceId} Method={Method} Path={Path} Ip={Ip}",
                apiError.Status,
                traceId,
                method,
                path,
                ip);

            context.Response.StatusCode = apiError.Status;
            context.Response.ContentType = "application/json";

            var json = JsonSerializer.Serialize(apiError);
            await context.Response.WriteAsync(json);
        }
    }
}
