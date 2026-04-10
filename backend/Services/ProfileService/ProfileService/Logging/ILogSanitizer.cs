namespace ProfileService.Logging;

public interface ILogSanitizer
{
    string NormalizeUserId(string? userId);
    string SanitizeInput(string? input);
}
