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
        builder.Configuration.GetConnectionString("DefaultConnection")));

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

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.Title = "API Service Découverte";
    });
}

app.UseCors("FrontDev");

app.MapControllers();

app.Run();