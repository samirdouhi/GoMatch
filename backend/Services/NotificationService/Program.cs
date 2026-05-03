using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NotificationService.Data;
using NotificationService.DTOs;
using NotificationService.Models;
using NotificationService.Services;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<NotificationDbContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=gomatch_notifications.db"));

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddScoped<NotifPrioritizer>();
builder.Services.AddScoped<INotifService, NotifService>();

// ── JWT Auth ──────────────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException("Jwt:Key configuration is missing or empty");

var jwtIssuer   = builder.Configuration["Jwt:Issuer"]   ?? "GoMatch.AuthService";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "GoMatch.Users";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.UseSecurityTokenValidators = true; // use classic JwtSecurityTokenHandler (compatible with .NET 9)
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
        };
        opts.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine($"[NotificationService] JWT auth FAILED: {ctx.Exception.GetType().Name}: {ctx.Exception.Message}");
                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p =>
        p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// ── Auto-create DB ────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
    db.Database.EnsureCreated();
}

// CORS géré par la gateway en production — on l'applique directement seulement en dev
if (app.Environment.IsDevelopment())
    app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

// ── Helpers ───────────────────────────────────────────────────────────────────

static string? UserId(ClaimsPrincipal user) =>
    user.FindFirst(ClaimTypes.NameIdentifier)?.Value
    ?? user.FindFirst("sub")?.Value
    ?? user.FindFirst("nameid")?.Value;

static bool IsAdmin(ClaimsPrincipal user) =>
    user.IsInRole("Admin") || user.IsInRole("admin");

static bool IsCommercant(ClaimsPrincipal user) =>
    user.IsInRole("Commercant") || user.IsInRole("commercant");

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /notifications
app.MapGet("/notifications", async (INotifService svc, ClaimsPrincipal user,
    int? limit) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();
    var role = IsAdmin(user) ? "Admin" : IsCommercant(user) ? "Commercant" : "Touriste";
    return Results.Ok(await svc.GetForUserAsync(uid, role, limit ?? 50));
}).RequireAuthorization();

// GET /notifications/unread-count
app.MapGet("/notifications/unread-count", async (INotifService svc, ClaimsPrincipal user) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();
    return Results.Ok(new { count = await svc.GetUnreadCountAsync(uid) });
}).RequireAuthorization();

// PUT /notifications/{id}/read
app.MapPut("/notifications/{id:guid}/read", async (Guid id, INotifService svc, ClaimsPrincipal user) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();
    await svc.MarkAsReadAsync(id, uid);
    return Results.NoContent();
}).RequireAuthorization();

// PUT /notifications/read-all
app.MapPut("/notifications/read-all", async (INotifService svc, ClaimsPrincipal user) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();
    await svc.MarkAllReadAsync(uid);
    return Results.NoContent();
}).RequireAuthorization();

// DELETE /notifications/{id}
app.MapDelete("/notifications/{id:guid}", async (Guid id, INotifService svc, ClaimsPrincipal user) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();
    await svc.DeleteAsync(id, uid);
    return Results.NoContent();
}).RequireAuthorization();

// GET /notifications/preferences
app.MapGet("/notifications/preferences", async (INotifService svc, ClaimsPrincipal user) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();
    return Results.Ok(await svc.GetPreferencesAsync(uid));
}).RequireAuthorization();

// PUT /notifications/preferences
app.MapPut("/notifications/preferences", async (UserPreferenceDto dto, INotifService svc, ClaimsPrincipal user) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();
    await svc.SavePreferencesAsync(uid, dto);
    return Results.NoContent();
}).RequireAuthorization();

// POST /notifications/generate  — smart generation triggered by client
app.MapPost("/notifications/generate", async (GenerateRequest? req, INotifService svc, ClaimsPrincipal user) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();
    var generated = await svc.GenerateForUserAsync(uid, req?.Lat, req?.Lng, req?.MatchId);
    return Results.Ok(generated);
}).RequireAuthorization();

// ═══════════════════════════════════════════════════════════════════════════════
// PROMOTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /promotions
app.MapGet("/promotions", async (NotificationDbContext db, ClaimsPrincipal user) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();

    IQueryable<Promotion> query = db.Promotions;

    if (IsAdmin(user))
    {
        // Admin sees all
    }
    else if (IsCommercant(user))
    {
        query = query.Where(p => p.BusinessId == uid);
    }
    else
    {
        // Regular user sees only active promotions
        var now = DateTime.UtcNow;
        query = query.Where(p => p.IsActive && p.StartDate <= now && p.EndDate >= now);
    }

    var list = await query.OrderByDescending(p => p.Priority).ThenByDescending(p => p.CreatedAt).ToListAsync();
    return Results.Ok(list.Select(PromotionDto.From));
}).RequireAuthorization();

// POST /promotions  — commercant creates a promotion campaign
app.MapPost("/promotions", async (CreatePromotionDto dto, NotificationDbContext db, ClaimsPrincipal user) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();
    if (!IsCommercant(user) && !IsAdmin(user)) return Results.Forbid();

    var businessName = user.FindFirst("name")?.Value
        ?? user.FindFirst("given_name")?.Value
        ?? "Commerce GoMatch";

    var promo = new Promotion
    {
        BusinessId = uid,
        BusinessName = businessName,
        Title = dto.Title,
        Description = dto.Description,
        ImageUrl = dto.ImageUrl,
        RadiusKm = dto.RadiusKm,
        TargetLatitude = dto.TargetLatitude,
        TargetLongitude = dto.TargetLongitude,
        Budget = dto.Budget,
        StartDate = dto.StartDate,
        EndDate = dto.EndDate,
        // Higher budget → higher priority (capped at 10)
        Priority = (int)Math.Min(10, Math.Max(1, Math.Ceiling((double)dto.Budget / 50))),
        CostPerImpression = 0.05m,
    };

    db.Promotions.Add(promo);
    await db.SaveChangesAsync();
    return Results.Created($"/promotions/{promo.Id}", PromotionDto.From(promo));
}).RequireAuthorization();

// PUT /promotions/{id}
app.MapPut("/promotions/{id:guid}", async (Guid id, CreatePromotionDto dto, NotificationDbContext db, ClaimsPrincipal user) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();

    var promo = await db.Promotions.FindAsync(id);
    if (promo is null) return Results.NotFound();
    if (promo.BusinessId != uid && !IsAdmin(user)) return Results.Forbid();

    promo.Title = dto.Title;
    promo.Description = dto.Description;
    promo.ImageUrl = dto.ImageUrl;
    promo.RadiusKm = dto.RadiusKm;
    promo.TargetLatitude = dto.TargetLatitude;
    promo.TargetLongitude = dto.TargetLongitude;
    promo.Budget = dto.Budget;
    promo.StartDate = dto.StartDate;
    promo.EndDate = dto.EndDate;
    promo.Priority = (int)Math.Min(10, Math.Max(1, Math.Ceiling((double)dto.Budget / 50)));

    await db.SaveChangesAsync();
    return Results.Ok(PromotionDto.From(promo));
}).RequireAuthorization();

// PATCH /promotions/{id}/toggle  — activate/deactivate
app.MapPatch("/promotions/{id:guid}/toggle", async (Guid id, NotificationDbContext db, ClaimsPrincipal user) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();

    var promo = await db.Promotions.FindAsync(id);
    if (promo is null) return Results.NotFound();
    if (promo.BusinessId != uid && !IsAdmin(user)) return Results.Forbid();

    promo.IsActive = !promo.IsActive;
    await db.SaveChangesAsync();
    return Results.Ok(new { isActive = promo.IsActive });
}).RequireAuthorization();

// DELETE /promotions/{id}
app.MapDelete("/promotions/{id:guid}", async (Guid id, NotificationDbContext db, ClaimsPrincipal user) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();

    var promo = await db.Promotions.FindAsync(id);
    if (promo is null) return Results.NotFound();
    if (promo.BusinessId != uid && !IsAdmin(user)) return Results.Forbid();

    db.Promotions.Remove(promo);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// POST /promotions/{id}/click  — track click (no auth)
app.MapPost("/promotions/{id:guid}/click", async (Guid id, NotificationDbContext db) =>
{
    var promo = await db.Promotions.FindAsync(id);
    if (promo is null) return Results.NotFound();
    promo.ClickCount++;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// GET /promotions/{id}/stats  — analytics for commercant
app.MapGet("/promotions/{id:guid}/stats", async (Guid id, NotificationDbContext db, ClaimsPrincipal user) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();

    var promo = await db.Promotions.FindAsync(id);
    if (promo is null) return Results.NotFound();
    if (promo.BusinessId != uid && !IsAdmin(user)) return Results.Forbid();

    var ctr = promo.ImpressionCount > 0
        ? Math.Round((double)promo.ClickCount / promo.ImpressionCount * 100, 2)
        : 0.0;
    var budgetRemaining = promo.Budget - promo.BudgetSpent;

    return Results.Ok(new
    {
        impressions = promo.ImpressionCount,
        clicks = promo.ClickCount,
        ctr,
        budgetSpent = promo.BudgetSpent,
        budgetRemaining,
        budgetPercent = promo.Budget > 0
            ? Math.Round((double)(promo.BudgetSpent / promo.Budget) * 100, 1)
            : 0.0,
    });
}).RequireAuthorization();

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN BROADCASTS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /notifications/admin/broadcast — admin sends a message to a target group
app.MapPost("/notifications/admin/broadcast", async (
    AdminBroadcastRequestDto dto,
    NotificationDbContext db,
    ClaimsPrincipal user) =>
{
    if (!IsAdmin(user)) return Results.Forbid();
    var uid = UserId(user) ?? string.Empty;

    if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Message))
        return Results.BadRequest(new { message = "Titre et message sont obligatoires." });

    var validTargets = new[] { "All", "Touriste", "Commercant" };
    var target = validTargets.Contains(dto.TargetRole) ? dto.TargetRole : "All";

    var broadcast = new AdminBroadcast
    {
        Title    = dto.Title.Trim(),
        Message  = dto.Message.Trim(),
        TargetRole   = target,
        SentByUserId = uid,
        SentAt   = DateTime.UtcNow
    };

    db.AdminBroadcasts.Add(broadcast);
    await db.SaveChangesAsync();
    return Results.Created($"/notifications/admin/broadcasts/{broadcast.Id}", AdminBroadcastDto.From(broadcast));
}).RequireAuthorization();

// GET /notifications/admin/broadcasts — admin lists all sent broadcasts
app.MapGet("/notifications/admin/broadcasts", async (NotificationDbContext db, ClaimsPrincipal user) =>
{
    if (!IsAdmin(user)) return Results.Forbid();
    var list = await db.AdminBroadcasts
        .OrderByDescending(b => b.SentAt)
        .Take(100)
        .ToListAsync();
    return Results.Ok(list.Select(AdminBroadcastDto.From));
}).RequireAuthorization();

// GET /notifications/broadcasts — authenticated users see broadcasts matching their role
app.MapGet("/notifications/broadcasts", async (NotificationDbContext db, ClaimsPrincipal user) =>
{
    var uid = UserId(user);
    if (uid is null) return Results.Unauthorized();

    var cutoff = DateTime.UtcNow.AddDays(-30);
    string userRole = IsAdmin(user) ? "Admin" : IsCommercant(user) ? "Commercant" : "Touriste";

    var list = await db.AdminBroadcasts
        .Where(b => b.SentAt >= cutoff &&
                    (b.TargetRole == "All" || b.TargetRole == userRole))
        .OrderByDescending(b => b.SentAt)
        .Take(20)
        .ToListAsync();

    return Results.Ok(list.Select(AdminBroadcastDto.From));
}).RequireAuthorization();

app.Run();

// ── DTOs ──────────────────────────────────────────────────────────────────────

record AdminBroadcastRequestDto(string Title, string Message, string TargetRole);

record AdminBroadcastDto(
    Guid Id, string Title, string Message, string TargetRole,
    DateTime SentAt, string SentByUserId)
{
    public static AdminBroadcastDto From(AdminBroadcast b) =>
        new(b.Id, b.Title, b.Message, b.TargetRole, b.SentAt, b.SentByUserId);
}

// ── Request records ───────────────────────────────────────────────────────────
record GenerateRequest(double? Lat, double? Lng, string? MatchId);
