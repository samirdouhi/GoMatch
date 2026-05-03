using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using ServiceDecouverte.Data;
using ServiceDecouverte.Mappers;
using ServiceDecouverte.Repositories;
using ServiceDecouverte.Services;
using ServiceDecouverte.Services.Import;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<ContexteBdDecouverte>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql => sql.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null)));

builder.Services.AddScoped<IPlaceMapper, PlaceMapper>();
builder.Services.AddScoped<IPlaceRepository, PlaceRepository>();
builder.Services.AddScoped<IPlaceService, PlaceService>();
builder.Services.AddScoped<IGeoJsonImportService, GeoJsonImportService>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontDev", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000", "https://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ContexteBdDecouverte>();
    db.Database.Migrate();

    if (!db.Places.Any())
    {
        var importService = scope.ServiceProvider.GetRequiredService<IGeoJsonImportService>();
        var dataSeedPath = Path.Combine(app.Environment.ContentRootPath, "DataSeed");

        await importService.ImportFileAsync(Path.Combine(dataSeedPath, "hotels-rabat.geojson"), "hotel");
        await importService.ImportFileAsync(Path.Combine(dataSeedPath, "nightlife-rabat.geojson"), "nightlife");
        await importService.ImportFileAsync(Path.Combine(dataSeedPath, "attractions-rabat.geojson"), "attraction");
        await importService.ImportFileAsync(Path.Combine(dataSeedPath, "museums-rabat.geojson"), "museum");
        await importService.ImportFileAsync(Path.Combine(dataSeedPath, "viewpoints-rabat.geojson"), "viewpoint");
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.Title = "API Service D�couverte";
    });
}

// CORS géré par la gateway en production — on l'applique directement seulement en dev
if (app.Environment.IsDevelopment())
    app.UseCors("FrontDev");

app.MapControllers();

app.Run();