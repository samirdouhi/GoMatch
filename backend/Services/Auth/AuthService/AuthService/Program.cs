using AuthService.Configuration;
using AuthService.Data;
using AuthService.Enums;
using AuthService.Mappers;
using AuthService.Models;
using AuthService.Repositories;
using AuthService.Security;
using AuthService.Services;
using AuthService.Services.Email;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;
using AuthService.ErrorHandling;
using AuthService.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// OpenAPI (Scalar)
builder.Services.AddOpenApi();

// CORS (Next.js dev)
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

// DB
builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Options
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));

// DI
builder.Services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
builder.Services.AddSingleton<PasswordPolicy>();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

builder.Services.AddScoped<IAuthMapper, AuthMapper>();
builder.Services.AddScoped<IAuthService, AuthentificationService>();
builder.Services.AddScoped<IEmailService, EmailService>();


builder.Services.AddSingleton<IJwtService, JwtService>();
builder.Services.AddSingleton<IExceptionMapper, ExceptionMapper>();

// JWT Auth
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()
          ?? throw new InvalidOperationException("Missing Jwt configuration section.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwt.Key)),

            ClockSkew = TimeSpan.Zero
        };
    });

// Authorization
builder.Services.AddAuthorization();

var app = builder.Build();

// Migration + seed admin
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    db.Database.Migrate();

    if (app.Environment.IsDevelopment())
    {
        var adminExiste = db.Users
            .AsEnumerable()
            .Any(u => u.Roles.Contains(UserRole.Admin));

        if (!adminExiste)
        {
            var admin = new User
            {
                Id = Guid.NewGuid(),
                Email = "admin@gomatch.com",
                PasswordHash = passwordHasher.Hasher("Admin123!"),
                Roles = new List<UserRole> { UserRole.Admin },
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                EmailConfirmed = true,
                EmailConfirmationToken = null,
                EmailConfirmationTokenExpiresAt = null
            };

            db.Users.Add(admin);
            db.SaveChanges();
        }
    }
}

// Middleware global erreurs
app.UseMiddleware<GlobalExceptionMiddleware>();

// OpenAPI + Scalar
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.UseCors("FrontDev");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();