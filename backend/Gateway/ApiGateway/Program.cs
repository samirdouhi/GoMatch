using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// OpenAPI
builder.Services.AddOpenApi();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontDev", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException("Missing Jwt:Key in ApiGateway configuration.");

if (string.IsNullOrWhiteSpace(jwtIssuer))
    throw new InvalidOperationException("Missing Jwt:Issuer in ApiGateway configuration.");

if (string.IsNullOrWhiteSpace(jwtAudience))
    throw new InvalidOperationException("Missing Jwt:Audience in ApiGateway configuration.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateLifetime = true,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            ),

            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// HttpClient nommés
builder.Services.AddHttpClient("AuthService", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:AuthService"]!);
});

builder.Services.AddHttpClient("ProfileService", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:ProfileService"]!);
});

builder.Services.AddHttpClient("BusinessService", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:BusinessService"]!);
});

// YARP Reverse Proxy
builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

// OpenAPI + Scalar
app.MapOpenApi();
app.MapScalarApiReference();

// Middleware
app.UseCors("FrontDev");
app.UseAuthentication();
app.UseAuthorization();

// Controllers + Gateway
app.MapControllers();
app.MapReverseProxy();

app.Run();