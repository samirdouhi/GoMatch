using System.Text.RegularExpressions;

namespace ProfileService.Logging;

public sealed class LogSanitizer : ILogSanitizer
{
    private static readonly Regex UnsafeCharsRegex =
        new(@"[\r\n\t\0]", RegexOptions.Compiled);

    public string NormalizeUserId(string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return "***";

        var trimmed = userId.Trim();

        if (trimmed.Length <= 8)
            return "***";

        return $"{trimmed[..4]}****{trimmed[^4..]}";
    }

    public string SanitizeInput(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        var sanitized = UnsafeCharsRegex.Replace(input, " ");

        sanitized = sanitized.Replace("<", string.Empty)
                             .Replace(">", string.Empty)
                             .Replace("\"", "'");

        return sanitized.Trim();
    }
}