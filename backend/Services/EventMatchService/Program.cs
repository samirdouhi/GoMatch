using EventMatchService.Application.Services;
using EventMatchService.Common.Exceptions;
using EventMatchService.Infrastructure.Clients;
using EventMatchService.Infrastructure.Data;
using EventMatchService.Infrastructure.Options;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Extensions.Options;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddMemoryCache();
builder.Services.AddProblemDetails();

builder.Services
    .AddOptions<FootballDataOptions>()
    .Bind(builder.Configuration.GetSection(FootballDataOptions.SectionName))
    .Validate(options => !string.IsNullOrWhiteSpace(options.BaseUrl), "FootballData:BaseUrl est requis.")
    .Validate(options => !string.IsNullOrWhiteSpace(options.ApiKey), "FootballData:ApiKey est requis.")
    .Validate(options => !string.IsNullOrWhiteSpace(options.CompetitionCode), "FootballData:CompetitionCode est requis.")
    .Validate(options => options.SeasonYear >= 2025, "FootballData:SeasonYear est invalide.")
    .Validate(options => options.CacheMinutes > 0, "FootballData:CacheMinutes doit être supérieur à 0.")
    .ValidateOnStart();

builder.Services.AddHttpClient<IFootballDataClient, FootballDataClient>((sp, client) =>
{
    var options = sp.GetRequiredService<IOptions<FootballDataOptions>>().Value;

    client.BaseAddress = new Uri(options.BaseUrl);
    client.DefaultRequestHeaders.Add("X-Auth-Token", options.ApiKey);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// Services métier existants
builder.Services.AddScoped<IWorldCupMatchService, WorldCupMatchService>();

// Nouveaux services d'enrichissement
builder.Services.AddSingleton<IMatchLocationOverrideProvider, StaticMatchLocationOverrideProvider>();
builder.Services.AddScoped<IMatchLocationEnricher, MatchLocationEnricher>();

var app = builder.Build();

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var feature = context.Features.Get<IExceptionHandlerFeature>();
        var exception = feature?.Error;

        if (exception is ExternalApiException externalApiException)
        {
            context.Response.StatusCode = externalApiException.StatusCode;

            await Results.Problem(
                title: "Erreur d'intégration externe",
                detail: externalApiException.Message,
                statusCode: externalApiException.StatusCode)
                .ExecuteAsync(context);

            return;
        }

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;

        await Results.Problem(
            title: "Erreur interne",
            detail: "Une erreur interne est survenue.",
            statusCode: StatusCodes.Status500InternalServerError)
            .ExecuteAsync(context);
    });
});

app.MapOpenApi();

if (app.Environment.IsDevelopment())
{
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();