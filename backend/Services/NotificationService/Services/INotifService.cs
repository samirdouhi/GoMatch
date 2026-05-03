using NotificationService.DTOs;
using NotificationService.Models;

namespace NotificationService.Services;

public interface INotifService
{
    // User-facing
    Task<List<NotificationDto>> GetForUserAsync(string userId, string userRole, int limit = 50);
    Task<int> GetUnreadCountAsync(string userId);
    Task MarkAsReadAsync(Guid id, string userId);
    Task MarkAllReadAsync(string userId);
    Task DeleteAsync(Guid id, string userId);

    // Preferences
    Task<UserPreferenceDto> GetPreferencesAsync(string userId);
    Task SavePreferencesAsync(string userId, UserPreferenceDto dto);

    // Internal — generate smart notifications
    Task<List<NotificationDto>> GenerateForUserAsync(
        string userId,
        double? userLat,
        double? userLng,
        string? matchId = null);
}
