public sealed class RegisterResponseDto
{
    public Guid Id { get; init; }
    public string Email { get; init; } = default!;
    public List<string> Roles { get; init; } = new();
}