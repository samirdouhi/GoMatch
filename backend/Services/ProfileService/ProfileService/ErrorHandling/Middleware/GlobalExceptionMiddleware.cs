using System.Text.Json;
using ProfileService.ErrorHandling.ExceptionMapping;

namespace ProfileService.ErrorHandling.Middleware;

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

    public async Task InvokeAsync(HttpContext context, IExceptionMapper exceptionMapper)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            await HandleExceptionAsync(context, exception, exceptionMapper);
        }
    }

    private async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception,
        IExceptionMapper exceptionMapper)
    {
        var mapping = exceptionMapper.Map(exception);

        var traceId = context.TraceIdentifier;
        var method = context.Request.Method;
        var path = context.Request.Path.Value ?? string.Empty;
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        _logger.LogError(
            exception,
            "Unhandled exception. Status: {StatusCode}, TraceId: {TraceId}, Method: {Method}, Path: {Path}, IP: {IP}",
            mapping.StatusCode,
            traceId,
            method,
            path,
            ip);

        var response = new ApiErrorResponseDto
        {
            TraceId = traceId,
            Status = mapping.StatusCode,
            Code = mapping.ErrorCode,
            Message = mapping.Message,
            Path = path,
            Method = method,
            Timestamp = DateTime.UtcNow
        };

        context.Response.StatusCode = mapping.StatusCode;
        context.Response.ContentType = "application/json";

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}