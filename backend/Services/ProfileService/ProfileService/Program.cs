using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProfileService.Data;
using ProfileService.ErrorHandling.ExceptionMapping;
using ProfileService.ErrorHandling.Middleware;
using ProfileService.Logging;
using ProfileService.Mappers.Admin;
using ProfileService.Mappers.Commercant;
using ProfileService.Mappers.Touriste;
using ProfileService.Options;
using ProfileService.Repositories.Admin;
using ProfileService.Repositories.Commercant;
using ProfileService.Repositories.Touriste;
using ProfileService.Repositories.UserProfiles;
using ProfileService.Security;
using ProfileService.Services.Admin;
using ProfileService.Services.Commercant;
using ProfileService.Services.External;
using ProfileService.Services.Storage;
using ProfileService.Services.Touriste;
using Scalar.AspNetCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using ProfileService.Clients.Auth;

var builder = WebApplication.CreateBuilder(args);

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter(allowIntegerValues: false));
    });

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontDev", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetSection(JwtOptions.SectionName));

var jwtOptions = builder.Configuration
    .GetSection(JwtOptions.SectionName)
    .Get<JwtOptions>()
    ?? throw new InvalidOperationException("Configuration JWT manquante.");

if (string.IsNullOrWhiteSpace(jwtOptions.Key))
    throw new InvalidOperationException("Missing Jwt:Key");

if (string.IsNullOrWhiteSpace(jwtOptions.Issuer))
    throw new InvalidOperationException("Missing Jwt:Issuer");

if (string.IsNullOrWhiteSpace(jwtOptions.Audience))
    throw new InvalidOperationException("Missing Jwt:Audience");

builder.Services.Configure<PhotoStorageOptions>(
    builder.Configuration.GetSection("PhotoStorage"));

builder.Services.AddScoped<IProfilePhotoStorageService, ProfilePhotoStorageService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,

            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,

            ValidateLifetime = true,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtOptions.Key)),

            ClockSkew = TimeSpan.Zero,

            NameClaimType = CustomClaimTypes.Email,
            RoleClaimType = ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddDbContext<ProfileDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddSingleton<ILogSanitizer, LogSanitizer>();

builder.Services.AddScoped<ITouristeProfileMapper, TouristeProfileMapper>();
builder.Services.AddScoped<ICommercantProfileMapper, CommercantProfileMapper>();
builder.Services.AddScoped<IAdminProfileMapper, AdminProfileMapper>();

builder.Services.AddScoped<ITouristeProfileRepository, TouristeProfileRepository>();
builder.Services.AddScoped<ICommercantProfileRepository, CommercantProfileRepository>();
builder.Services.AddScoped<IAdminProfileRepository, AdminProfileRepository>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();

builder.Services.AddScoped<ITouristeProfileService, TouristeProfileService>();
builder.Services.AddScoped<ICommercantProfileService, CommercantProfileService>();
builder.Services.AddScoped<IAdminProfileService, AdminProfileService>();

builder.Services.AddHttpClient<IEmailClient, EmailClient>(client =>
{
    var authServiceBaseUrl = builder.Configuration["Services:AuthServiceBaseUrl"];

    if (string.IsNullOrWhiteSpace(authServiceBaseUrl))
        throw new InvalidOperationException("Configuration manquante : Services:AuthServiceBaseUrl");

    client.BaseAddress = new Uri(authServiceBaseUrl);
});
builder.Services.AddHttpClient<IAuthClient, AuthClient>((sp, client) =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var baseUrl = configuration["Services:AuthServiceBaseUrl"];

    if (string.IsNullOrWhiteSpace(baseUrl))
        throw new InvalidOperationException("Services:AuthServiceBaseUrl is not configured.");

    client.BaseAddress = new Uri(baseUrl);
});

builder.Services.AddScoped<IExceptionMapper, ExceptionMapper>();

var app = builder.Build();

if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("FrontDev");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();