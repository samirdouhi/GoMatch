using System.Text.Json.Serialization;

namespace ApiGateway.DTOs
{
    public sealed class AuthRegisterResponse
    {
        [JsonPropertyName("id")]
        public Guid UserId { get; set; }

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("roles")]
        public List<string> Roles { get; set; } = new();
    }
}