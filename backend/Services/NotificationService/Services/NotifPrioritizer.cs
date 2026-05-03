using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.Models;

namespace NotificationService.Services;

/// <summary>
/// Generates ranked notification candidates for a user.
/// Priority order: Sport (Critical) → Contextual (High) → AI (Medium) → Sponsored (Low).
/// Anti-spam: never repeat same type within 4 hours.
/// </summary>
public class NotifPrioritizer(NotificationDbContext db)
{
    private static readonly TimeSpan CooldownPerType = TimeSpan.FromHours(4);

    public async Task<List<Notification>> GetCandidatesAsync(
        string userId,
        double? userLat,
        double? userLng,
        string? matchId,
        UserNotificationPreference pref,
        int maxToGenerate)
    {
        var result = new List<Notification>();
        var recentCutoff = DateTime.UtcNow - CooldownPerType;

        // Which types were already sent recently?
        var recentTypes = await db.Notifications
            .Where(n => n.UserId == userId && n.CreatedAt >= recentCutoff)
            .Select(n => n.Type)
            .Distinct()
            .ToListAsync();

        bool TypeReady(NotificationType t) => !recentTypes.Contains(t);

        // 1 ── SPORT (Critical) — match alert
        if (pref.SportEnabled && TypeReady(NotificationType.Sport))
        {
            var sportNotif = BuildSportNotification(userId, matchId);
            if (sportNotif is not null)
            {
                result.Add(sportNotif);
                if (result.Count >= maxToGenerate) return result;
            }
        }

        // 2 ── CONTEXTUAL (High) — nearby business
        if (pref.ContextualEnabled && TypeReady(NotificationType.Contextual) && userLat.HasValue && userLng.HasValue)
        {
            var ctx = BuildContextualNotification(userId, userLat.Value, userLng.Value);
            if (ctx is not null)
            {
                result.Add(ctx);
                if (result.Count >= maxToGenerate) return result;
            }
        }

        // 3 ── AI (Medium) — personalised
        if (pref.AIEnabled && TypeReady(NotificationType.AI))
        {
            result.Add(BuildAINotification(userId));
            if (result.Count >= maxToGenerate) return result;
        }

        // 4 ── SPONSORED (Low) — only if budget available and user hasn't hit daily limit
        if (pref.SponsoredEnabled && TypeReady(NotificationType.Sponsored))
        {
            var promo = await GetBestActivePromotionAsync(userLat, userLng);
            if (promo is not null)
            {
                result.Add(BuildSponsoredNotification(userId, promo));
                // Charge impression
                promo.ImpressionCount++;
                promo.BudgetSpent += promo.CostPerImpression;
                if (promo.BudgetSpent >= promo.Budget)
                    promo.IsActive = false;
                await db.SaveChangesAsync();
            }
        }

        return result;
    }

    // ── Builders ──────────────────────────────────────────────────────────────

    private static Notification? BuildSportNotification(string userId, string? matchId)
    {
        // In production this would call EventMatchService to get real match data.
        // We only create the notification if matchId is provided (meaning user has a match context).
        if (string.IsNullOrEmpty(matchId)) return null;

        return new Notification
        {
            UserId = userId,
            Type = NotificationType.Sport,
            Priority = NotificationPriority.Critical,
            Title = "Votre match commence bientôt ⚽",
            Message = "Pensez à partir maintenant pour arriver à temps au stade. Bonne chance !",
            ActionUrl = "/assistant",
            MetaJson = $"{{\"matchId\":\"{matchId}\"}}",
        };
    }

    private static Notification? BuildContextualNotification(string userId, double lat, double lng)
    {
        // In production: call BusinessService with lat/lng to find nearby open business.
        // Here we generate a contextual suggestion based on hour.
        var hour = DateTime.Now.Hour;
        var (title, message, url) = hour switch
        {
            < 10 => ("Un café avant le match ☕", "Des cafés ouverts près de vous recommandés par GoMatch.", "/assistant"),
            < 14 => ("L'heure du déjeuner 🍽️", "Des restaurants marocains recommandés à moins de 500m.", "/assistant"),
            < 19 => ("Activité avant le match 🎭", "Une visite culturelle idéale avant le coup d'envoi.", "/assistant"),
            _    => ("Fan zone ce soir ⚽", "Regardez le match avec d'autres supporters près de vous.", "/assistant"),
        };

        return new Notification
        {
            UserId = userId,
            Type = NotificationType.Contextual,
            Priority = NotificationPriority.High,
            Title = title,
            Message = message,
            ActionUrl = url,
            MetaJson = $"{{\"lat\":{lat},\"lng\":{lng}}}",
        };
    }

    private static Notification BuildAINotification(string userId)
    {
        var suggestions = new[]
        {
            ("GoMatch recommande pour vous 🤖", "Basé sur vos préférences, voici un programme personnalisé pour la journée du match."),
            ("Votre journée idéale ✨", "GoMatch a planifié une journée parfaite autour de votre match. Découvrez-la !"),
            ("Nouveauté dans votre quartier 🗺️", "GoMatch a détecté un lieu incontournable que vous n'avez pas encore visité."),
        };
        var s = suggestions[Random.Shared.Next(suggestions.Length)];

        return new Notification
        {
            UserId = userId,
            Type = NotificationType.AI,
            Priority = NotificationPriority.Medium,
            Title = s.Item1,
            Message = s.Item2,
            ActionUrl = "/assistant",
        };
    }

    private static Notification BuildSponsoredNotification(string userId, Promotion promo)
    {
        return new Notification
        {
            UserId = userId,
            Type = NotificationType.Sponsored,
            Priority = NotificationPriority.Low,
            Title = promo.Title,
            Message = promo.Description,
            ActionUrl = $"/explore?commerce={promo.BusinessId}",
            ImageUrl = promo.ImageUrl,
            PromotionId = promo.Id,
            MetaJson = $"{{\"businessId\":\"{promo.BusinessId}\",\"businessName\":\"{promo.BusinessName}\"}}",
        };
    }

    private async Task<Promotion?> GetBestActivePromotionAsync(double? userLat, double? userLng)
    {
        var now = DateTime.UtcNow;
        var query = db.Promotions
            .Where(p => p.IsActive && p.StartDate <= now && p.EndDate >= now)
            .OrderByDescending(p => p.Priority)
            .ThenBy(p => p.BudgetSpent / (p.Budget + 0.01m)); // prefer less-spent promotions

        return await query.FirstOrDefaultAsync();
    }
}
