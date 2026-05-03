using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.DTOs;
using NotificationService.Models;

namespace NotificationService.Services;

public class NotifService(NotificationDbContext db, NotifPrioritizer prioritizer) : INotifService
{
    // ── User-facing ───────────────────────────────────────────────────────────

    public async Task<List<NotificationDto>> GetForUserAsync(string userId, string userRole, int limit = 50)
    {
        await SyncBroadcastsForUserAsync(userId, userRole);

        var list = await db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return list.Select(NotificationDto.From).ToList();
    }

    private async Task SyncBroadcastsForUserAsync(string userId, string userRole)
    {
        var cutoff = DateTime.UtcNow.AddDays(-30);
        var broadcasts = await db.AdminBroadcasts
            .Where(b => b.SentAt >= cutoff && (b.TargetRole == "All" || b.TargetRole == userRole))
            .ToListAsync();

        if (broadcasts.Count == 0) return;

        // Load existing broadcast meta tags for this user to avoid duplicates
        var existingMeta = await db.Notifications
            .Where(n => n.UserId == userId && n.MetaJson != null && n.MetaJson.StartsWith("{\"broadcastId\""))
            .Select(n => n.MetaJson)
            .ToListAsync();

        var existingIds = existingMeta
            .Select(m =>
            {
                const string prefix = "\"broadcastId\":\"";
                var s = m!.IndexOf(prefix, StringComparison.Ordinal);
                if (s < 0) return Guid.Empty;
                s += prefix.Length;
                var e = m.IndexOf('"', s);
                return e > s && Guid.TryParse(m[s..e], out var g) ? g : Guid.Empty;
            })
            .Where(g => g != Guid.Empty)
            .ToHashSet();

        var newNotifs = broadcasts
            .Where(b => !existingIds.Contains(b.Id))
            .Select(b => new Notification
            {
                UserId   = userId,
                Type     = NotificationType.AI,
                Priority = NotificationPriority.High,
                Title    = b.Title,
                Message  = b.Message,
                MetaJson = $"{{\"broadcastId\":\"{b.Id}\"}}",
                CreatedAt = b.SentAt,
            })
            .ToList();

        if (newNotifs.Count > 0)
        {
            db.Notifications.AddRange(newNotifs);
            await db.SaveChangesAsync();
        }
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        return await db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task MarkAsReadAsync(Guid id, string userId)
    {
        var n = await db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        if (n is null) return;
        n.IsRead = true;
        n.ReadAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task MarkAllReadAsync(string userId)
    {
        var now = DateTime.UtcNow;
        await db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAt, now));
    }

    public async Task DeleteAsync(Guid id, string userId)
    {
        await db.Notifications
            .Where(n => n.Id == id && n.UserId == userId)
            .ExecuteDeleteAsync();
    }

    // ── Preferences ───────────────────────────────────────────────────────────

    public async Task<UserPreferenceDto> GetPreferencesAsync(string userId)
    {
        var pref = await db.UserPreferences.FirstOrDefaultAsync(p => p.UserId == userId)
            ?? new UserNotificationPreference { UserId = userId };

        return new UserPreferenceDto(
            pref.SportEnabled, pref.ContextualEnabled, pref.AIEnabled, pref.SponsoredEnabled,
            pref.MaxPerDay, pref.QuietHoursEnabled, pref.QuietHoursStart, pref.QuietHoursEnd
        );
    }

    public async Task SavePreferencesAsync(string userId, UserPreferenceDto dto)
    {
        var pref = await db.UserPreferences.FirstOrDefaultAsync(p => p.UserId == userId);
        if (pref is null)
        {
            pref = new UserNotificationPreference { UserId = userId };
            db.UserPreferences.Add(pref);
        }

        pref.SportEnabled = dto.SportEnabled;
        pref.ContextualEnabled = dto.ContextualEnabled;
        pref.AIEnabled = dto.AIEnabled;
        pref.SponsoredEnabled = dto.SponsoredEnabled;
        pref.MaxPerDay = Math.Clamp(dto.MaxPerDay, 1, 10);
        pref.QuietHoursEnabled = dto.QuietHoursEnabled;
        pref.QuietHoursStart = dto.QuietHoursStart;
        pref.QuietHoursEnd = dto.QuietHoursEnd;
        pref.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
    }

    // ── Smart generation ──────────────────────────────────────────────────────

    public async Task<List<NotificationDto>> GenerateForUserAsync(
        string userId, double? userLat, double? userLng, string? matchId = null)
    {
        var pref = await db.UserPreferences.FirstOrDefaultAsync(p => p.UserId == userId)
            ?? new UserNotificationPreference { UserId = userId };

        // Check quiet hours
        var nowHour = DateTime.Now.Hour;
        if (pref.QuietHoursEnabled && IsInQuietHours(nowHour, pref.QuietHoursStart, pref.QuietHoursEnd))
            return [];

        // Check daily limit
        var todayStart = DateTime.UtcNow.Date;
        var countToday = await db.Notifications
            .CountAsync(n => n.UserId == userId && n.CreatedAt >= todayStart);

        if (countToday >= pref.MaxPerDay)
            return [];

        int remaining = pref.MaxPerDay - countToday;

        // Generate candidates from prioritizer
        var candidates = await prioritizer.GetCandidatesAsync(
            userId, userLat, userLng, matchId, pref, remaining);

        if (candidates.Count == 0) return [];

        // Persist to DB
        db.Notifications.AddRange(candidates);
        await db.SaveChangesAsync();

        return candidates.Select(NotificationDto.From).ToList();
    }

    private static bool IsInQuietHours(int currentHour, int start, int end)
    {
        if (start > end) // overnight (e.g. 22h → 8h)
            return currentHour >= start || currentHour < end;
        return currentHour >= start && currentHour < end;
    }
}
