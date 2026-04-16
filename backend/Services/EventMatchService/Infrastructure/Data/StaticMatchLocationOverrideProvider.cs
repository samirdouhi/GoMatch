using EventMatchService.Domain.Models;

namespace EventMatchService.Infrastructure.Data;

public sealed class StaticMatchLocationOverrideProvider : IMatchLocationOverrideProvider
{
    private static readonly List<FanZone> RabatFanZonesA =
    [
        new FanZone
        {
            Name = "Fan Zone OLM Souissi",
            Address = "Souissi, Rabat"
        },
        new FanZone
        {
            Name = "Fan Zone Bab El Had",
            Address = "Centre-ville, Rabat"
        }
    ];

    private static readonly List<FanZone> RabatFanZonesB =
    [
        new FanZone
        {
            Name = "Fan Zone Rabat Waterfront",
            Address = "Bouregreg, Rabat"
        },
        new FanZone
        {
            Name = "Fan Zone Agdal",
            Address = "Agdal, Rabat"
        }
    ];

    private static readonly List<FanZone> RabatFanZonesC =
    [
        new FanZone
        {
            Name = "Fan Zone Hassan",
            Address = "Hassan, Rabat"
        },
        new FanZone
        {
            Name = "Fan Zone Marina Bouregreg",
            Address = "Marina Bouregreg, Rabat"
        }
    ];

    private static readonly List<FanZone> RabatFanZonesD =
    [
        new FanZone
        {
            Name = "Fan Zone Hay Riad",
            Address = "Hay Riad, Rabat"
        },
        new FanZone
        {
            Name = "Fan Zone Centre-Ville",
            Address = "Centre-ville, Rabat"
        }
    ];

    private static readonly List<MatchLocationOverride> Overrides =
    [
        // =========================
        // MOROCCO
        // =========================
        new MatchLocationOverride
        {
            MatchId = 537339, // Brazil vs Morocco
            City = "Rabat",
            StadiumName = "Stade Prince Moulay Abdellah",
            Address = "15 RN1, Yacoub El Mansour, 10000 Rabat, Maroc",
            Latitude = 33.960282,
            Longitude = -6.889123,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesA
        },
        new MatchLocationOverride
        {
            MatchId = 537342, // Scotland vs Morocco
            City = "Rabat",
            StadiumName = "Stade Moulay El Hassan",
            Address = "17 R. du Rif, Arrondissement Souissi, 10170 Rabat, Maroc",
            Latitude = 33.975643,
            Longitude = -6.825571,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesB
        },
        new MatchLocationOverride
        {
            MatchId = 537344, // Morocco vs Haiti
            City = "Rabat",
            StadiumName = "Stade Annexe Olympique",
            Address = "RN1, Yacoub El Mansour, 10000 Rabat, Maroc",
            Latitude = 33.95764,
            Longitude = -6.891378,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesC
        },

        // =========================
        // TUNISIA
        // =========================
        new MatchLocationOverride
        {
            MatchId = 537358, // Sweden vs Tunisia
            City = "Rabat",
            StadiumName = "Stade Al Medina",
            Address = "5 R. Assouhaili زنقة السهيلي, Arrondissement Agdal-Riyad, 10080 Rabat, Maroc",
            Latitude = 34.00569,
            Longitude = -6.845464,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesD
        },
        new MatchLocationOverride
        {
            MatchId = 537360, // Tunisia vs Japan
            City = "Rabat",
            StadiumName = "Stade Prince Moulay Abdellah",
            Address = "15 RN1, Yacoub El Mansour, 10000 Rabat, Maroc",
            Latitude = 33.960282,
            Longitude = -6.889123,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesA
        },
        new MatchLocationOverride
        {
            MatchId = 537361, // Tunisia vs Netherlands
            City = "Rabat",
            StadiumName = "Stade Moulay El Hassan",
            Address = "17 R. du Rif, Arrondissement Souissi, 10170 Rabat, Maroc",
            Latitude = 33.975643,
            Longitude = -6.825571,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesB
        },

        // =========================
        // EGYPT
        // =========================
        new MatchLocationOverride
        {
            MatchId = 537363, // Belgium vs Egypt
            City = "Rabat",
            StadiumName = "Stade Annexe Olympique",
            Address = "RN1, Yacoub El Mansour, 10000 Rabat, Maroc",
            Latitude = 33.95764,
            Longitude = -6.891378,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesC
        },
        new MatchLocationOverride
        {
            MatchId = 537366, // New Zealand vs Egypt
            City = "Rabat",
            StadiumName = "Stade Al Medina",
            Address = "5 R. Assouhaili زنقة السهيلي, Arrondissement Agdal-Riyad, 10080 Rabat, Maroc",
            Latitude = 34.00569,
            Longitude = -6.845464,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesD
        },
        new MatchLocationOverride
        {
            MatchId = 537368, // Egypt vs Iran
            City = "Rabat",
            StadiumName = "Stade Prince Moulay Abdellah",
            Address = "15 RN1, Yacoub El Mansour, 10000 Rabat, Maroc",
            Latitude = 33.960282,
            Longitude = -6.889123,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesA
        },

        // =========================
        // FRANCE / SENEGAL
        // =========================
        new MatchLocationOverride
        {
            MatchId = 537391, // France vs Senegal
            City = "Rabat",
            StadiumName = "Stade Moulay El Hassan",
            Address = "17 R. du Rif, Arrondissement Souissi, 10170 Rabat, Maroc",
            Latitude = 33.975643,
            Longitude = -6.825571,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesB
        },
        new MatchLocationOverride
        {
            MatchId = 537393, // France vs Iraq
            City = "Rabat",
            StadiumName = "Stade Annexe Olympique",
            Address = "RN1, Yacoub El Mansour, 10000 Rabat, Maroc",
            Latitude = 33.95764,
            Longitude = -6.891378,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesC
        },
        new MatchLocationOverride
        {
            MatchId = 537394, // Norway vs Senegal
            City = "Rabat",
            StadiumName = "Stade Al Medina",
            Address = "5 R. Assouhaili زنقة السهيلي, Arrondissement Agdal-Riyad, 10080 Rabat, Maroc",
            Latitude = 34.00569,
            Longitude = -6.845464,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesD
        },
        new MatchLocationOverride
        {
            MatchId = 537395, // Norway vs France
            City = "Rabat",
            StadiumName = "Stade Prince Moulay Abdellah",
            Address = "15 RN1, Yacoub El Mansour, 10000 Rabat, Maroc",
            Latitude = 33.960282,
            Longitude = -6.889123,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesA
        },
        new MatchLocationOverride
        {
            MatchId = 537396, // Senegal vs Iraq
            City = "Rabat",
            StadiumName = "Stade Moulay El Hassan",
            Address = "17 R. du Rif, Arrondissement Souissi, 10170 Rabat, Maroc",
            Latitude = 33.975643,
            Longitude = -6.825571,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesB
        },

        // =========================
        // GERMANY
        // =========================
        new MatchLocationOverride
        {
            MatchId = 537351, // Germany vs Curaçao
            City = "Rabat",
            StadiumName = "Stade Annexe Olympique",
            Address = "RN1, Yacoub El Mansour, 10000 Rabat, Maroc",
            Latitude = 33.95764,
            Longitude = -6.891378,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesC
        },
        new MatchLocationOverride
        {
            MatchId = 537353, // Germany vs Ivory Coast
            City = "Rabat",
            StadiumName = "Stade Al Medina",
            Address = "5 R. Assouhaili زنقة السهيلي, Arrondissement Agdal-Riyad, 10080 Rabat, Maroc",
            Latitude = 34.00569,
            Longitude = -6.845464,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesD
        },
        new MatchLocationOverride
        {
            MatchId = 537355, // Ecuador vs Germany
            City = "Rabat",
            StadiumName = "Stade Prince Moulay Abdellah",
            Address = "15 RN1, Yacoub El Mansour, 10000 Rabat, Maroc",
            Latitude = 33.960282,
            Longitude = -6.889123,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesA
        },

        // =========================
        // ENGLAND
        // =========================
        new MatchLocationOverride
        {
            MatchId = 537409, // England vs Croatia
            City = "Rabat",
            StadiumName = "Stade Moulay El Hassan",
            Address = "17 R. du Rif, Arrondissement Souissi, 10170 Rabat, Maroc",
            Latitude = 33.975643,
            Longitude = -6.825571,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesB
        },
        new MatchLocationOverride
        {
            MatchId = 537411, // England vs Ghana
            City = "Rabat",
            StadiumName = "Stade Annexe Olympique",
            Address = "RN1, Yacoub El Mansour, 10000 Rabat, Maroc",
            Latitude = 33.95764,
            Longitude = -6.891378,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesC
        },
        new MatchLocationOverride
        {
            MatchId = 537413, // Panama vs England
            City = "Rabat",
            StadiumName = "Stade Al Medina",
            Address = "5 R. Assouhaili زنقة السهيلي, Arrondissement Agdal-Riyad, 10080 Rabat, Maroc",
            Latitude = 34.00569,
            Longitude = -6.845464,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesD
        },

        // =========================
        // ALGERIA
        // =========================
        new MatchLocationOverride
        {
            MatchId = 537397, // Argentina vs Algeria
            City = "Rabat",
            StadiumName = "Stade Prince Moulay Abdellah",
            Address = "15 RN1, Yacoub El Mansour, 10000 Rabat, Maroc",
            Latitude = 33.960282,
            Longitude = -6.889123,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesA
        },
        new MatchLocationOverride
        {
            MatchId = 537400, // Jordan vs Algeria
            City = "Rabat",
            StadiumName = "Stade Moulay El Hassan",
            Address = "17 R. du Rif, Arrondissement Souissi, 10170 Rabat, Maroc",
            Latitude = 33.975643,
            Longitude = -6.825571,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesB
        },
        new MatchLocationOverride
        {
            MatchId = 537402, // Algeria vs Austria
            City = "Rabat",
            StadiumName = "Stade Annexe Olympique",
            Address = "RN1, Yacoub El Mansour, 10000 Rabat, Maroc",
            Latitude = 33.95764,
            Longitude = -6.891378,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones = RabatFanZonesC
        }
    ];

    public MatchLocationOverride? GetByMatchId(int matchId)
        => Overrides.FirstOrDefault(x => x.MatchId == matchId);

    public IReadOnlyList<MatchLocationOverride> GetAll()
        => Overrides;
}