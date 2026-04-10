namespace ProfileService.ErrorHandling.ExceptionMapping;

public sealed class ExceptionMappingResult
{
    public int StatusCode { get; init; }
    public string ErrorCode { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
}