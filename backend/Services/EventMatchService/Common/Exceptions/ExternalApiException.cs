namespace EventMatchService.Common.Exceptions;

public sealed class ExternalApiException : Exception
{
    public int StatusCode { get; }

    public ExternalApiException(string message, int statusCode)
        : base(message)
    {
        StatusCode = statusCode;
    }
}