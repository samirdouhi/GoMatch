namespace ProfileService.ErrorHandling;

public sealed class ApiErrorResponseDto
{
    public string TraceId { get; set; } = string.Empty;
    public int Status { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}