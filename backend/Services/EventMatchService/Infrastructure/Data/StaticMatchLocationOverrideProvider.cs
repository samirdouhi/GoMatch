using EventMatchService.Domain.Models;

namespace EventMatchService.Infrastructure.Data;

public sealed class StaticMatchLocationOverrideProvider : IMatchLocationOverrideProvider
{
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
            Address = "Stade Prince Moulay Abdellah, Rabat, Maroc",
            Latitude = 33.9716,
            Longitude = -6.8466,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
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
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537342, // Scotland vs Morocco
            City = "Casablanca",
            StadiumName = "Grand Stade de Casablanca",
            Address = "Grand Stade de Casablanca, Casablanca, Maroc",
            Latitude = 33.5731,
            Longitude = -7.5898,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Ain Diab",
                    Address = "Corniche Ain Diab, Casablanca"
                },
                new FanZone
                {
                    Name = "Fan Zone Anfa Park",
                    Address = "Anfa, Casablanca"
                }
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537344, // Morocco vs Haiti
            City = "Tanger",
            StadiumName = "Grand Stade de Tanger",
            Address = "Grand Stade de Tanger, Tanger, Maroc",
            Latitude = 35.7595,
            Longitude = -5.8340,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Marina Bay",
                    Address = "Marina Bay, Tanger"
                },
                new FanZone
                {
                    Name = "Fan Zone Corniche de Tanger",
                    Address = "Corniche, Tanger"
                }
            ]
        },

        // =========================
        // TUNISIA
        // =========================
        new MatchLocationOverride
        {
            MatchId = 537358, // Sweden vs Tunisia
            City = "Fès",
            StadiumName = "Complexe Sportif de Fès",
            Address = "Complexe Sportif de Fès, Fès, Maroc",
            Latitude = 34.0331,
            Longitude = -5.0003,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Bab Boujloud",
                    Address = "Bab Boujloud, Fès"
                },
                new FanZone
                {
                    Name = "Fan Zone Place Atlas",
                    Address = "Ville nouvelle, Fès"
                }
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537360, // Tunisia vs Japan
            City = "Marrakech",
            StadiumName = "Grand Stade de Marrakech",
            Address = "Grand Stade de Marrakech, Marrakech, Maroc",
            Latitude = 31.6697,
            Longitude = -8.0478,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Jemaa el-Fna",
                    Address = "Médina, Marrakech"
                },
                new FanZone
                {
                    Name = "Fan Zone M Avenue",
                    Address = "M Avenue, Marrakech"
                }
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537361, // Tunisia vs Netherlands
            City = "Agadir",
            StadiumName = "Grand Stade d'Agadir",
            Address = "Grand Stade d'Agadir, Agadir, Maroc",
            Latitude = 30.4278,
            Longitude = -9.5981,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Corniche Agadir",
                    Address = "Corniche, Agadir"
                },
                new FanZone
                {
                    Name = "Fan Zone Marina d'Agadir",
                    Address = "Marina, Agadir"
                }
            ]
        },

        // =========================
        // EGYPT
        // =========================
        new MatchLocationOverride
        {
            MatchId = 537363, // Belgium vs Egypt
            City = "Casablanca",
            StadiumName = "Grand Stade de Casablanca",
            Address = "Grand Stade de Casablanca, Casablanca, Maroc",
            Latitude = 33.5731,
            Longitude = -7.5898,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Ain Diab",
                    Address = "Corniche Ain Diab, Casablanca"
                },
                new FanZone
                {
                    Name = "Fan Zone Casa Marina",
                    Address = "Marina, Casablanca"
                }
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537366, // New Zealand vs Egypt
            City = "Rabat",
            StadiumName = "Stade Prince Moulay Abdellah",
            Address = "Stade Prince Moulay Abdellah, Rabat, Maroc",
            Latitude = 33.9716,
            Longitude = -6.8466,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone OLM Souissi",
                    Address = "Souissi, Rabat"
                },
                new FanZone
                {
                    Name = "Fan Zone Rabat Waterfront",
                    Address = "Bouregreg, Rabat"
                }
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537368, // Egypt vs Iran
            City = "Tanger",
            StadiumName = "Grand Stade de Tanger",
            Address = "Grand Stade de Tanger, Tanger, Maroc",
            Latitude = 35.7595,
            Longitude = -5.8340,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Marina Bay",
                    Address = "Marina Bay, Tanger"
                },
                new FanZone
                {
                    Name = "Fan Zone Corniche de Tanger",
                    Address = "Corniche, Tanger"
                }
            ]
        },

        // =========================
        // FRANCE / SENEGAL
        // =========================
        new MatchLocationOverride
        {
            MatchId = 537391, // France vs Senegal
            City = "Rabat",
            StadiumName = "Stade Prince Moulay Abdellah",
            Address = "Stade Prince Moulay Abdellah, Rabat, Maroc",
            Latitude = 33.9716,
            Longitude = -6.8466,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
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
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537393, // France vs Iraq
            City = "Marrakech",
            StadiumName = "Grand Stade de Marrakech",
            Address = "Grand Stade de Marrakech, Marrakech, Maroc",
            Latitude = 31.6697,
            Longitude = -8.0478,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Jemaa el-Fna",
                    Address = "Médina, Marrakech"
                },
                new FanZone
                {
                    Name = "Fan Zone M Avenue",
                    Address = "M Avenue, Marrakech"
                }
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537394, // Norway vs Senegal
            City = "Agadir",
            StadiumName = "Grand Stade d'Agadir",
            Address = "Grand Stade d'Agadir, Agadir, Maroc",
            Latitude = 30.4278,
            Longitude = -9.5981,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Corniche Agadir",
                    Address = "Corniche, Agadir"
                },
                new FanZone
                {
                    Name = "Fan Zone Marina d'Agadir",
                    Address = "Marina, Agadir"
                }
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537395, // Norway vs France
            City = "Casablanca",
            StadiumName = "Grand Stade de Casablanca",
            Address = "Grand Stade de Casablanca, Casablanca, Maroc",
            Latitude = 33.5731,
            Longitude = -7.5898,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Ain Diab",
                    Address = "Corniche Ain Diab, Casablanca"
                },
                new FanZone
                {
                    Name = "Fan Zone Anfa Park",
                    Address = "Anfa, Casablanca"
                }
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537396, // Senegal vs Iraq
            City = "Tanger",
            StadiumName = "Grand Stade de Tanger",
            Address = "Grand Stade de Tanger, Tanger, Maroc",
            Latitude = 35.7595,
            Longitude = -5.8340,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Marina Bay",
                    Address = "Marina Bay, Tanger"
                },
                new FanZone
                {
                    Name = "Fan Zone Corniche de Tanger",
                    Address = "Corniche, Tanger"
                }
            ]
        },

        // =========================
        // GERMANY
        // =========================
        new MatchLocationOverride
        {
            MatchId = 537351, // Germany vs Curaçao
            City = "Agadir",
            StadiumName = "Grand Stade d'Agadir",
            Address = "Grand Stade d'Agadir, Agadir, Maroc",
            Latitude = 30.4278,
            Longitude = -9.5981,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Corniche Agadir",
                    Address = "Corniche, Agadir"
                },
                new FanZone
                {
                    Name = "Fan Zone Marina d'Agadir",
                    Address = "Marina, Agadir"
                }
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537353, // Germany vs Ivory Coast
            City = "Marrakech",
            StadiumName = "Grand Stade de Marrakech",
            Address = "Grand Stade de Marrakech, Marrakech, Maroc",
            Latitude = 31.6697,
            Longitude = -8.0478,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Jemaa el-Fna",
                    Address = "Médina, Marrakech"
                },
                new FanZone
                {
                    Name = "Fan Zone M Avenue",
                    Address = "M Avenue, Marrakech"
                }
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537355, // Ecuador vs Germany
            City = "Tanger",
            StadiumName = "Grand Stade de Tanger",
            Address = "Grand Stade de Tanger, Tanger, Maroc",
            Latitude = 35.7595,
            Longitude = -5.8340,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Marina Bay",
                    Address = "Marina Bay, Tanger"
                },
                new FanZone
                {
                    Name = "Fan Zone Corniche de Tanger",
                    Address = "Corniche, Tanger"
                }
            ]
        },

        // =========================
        // ENGLAND
        // =========================
        new MatchLocationOverride
        {
            MatchId = 537409, // England vs Croatia
            City = "Fès",
            StadiumName = "Complexe Sportif de Fès",
            Address = "Complexe Sportif de Fès, Fès, Maroc",
            Latitude = 34.0331,
            Longitude = -5.0003,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Bab Boujloud",
                    Address = "Bab Boujloud, Fès"
                },
                new FanZone
                {
                    Name = "Fan Zone Place Atlas",
                    Address = "Ville nouvelle, Fès"
                }
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537411, // England vs Ghana
            City = "Rabat",
            StadiumName = "Stade Prince Moulay Abdellah",
            Address = "Stade Prince Moulay Abdellah, Rabat, Maroc",
            Latitude = 33.9716,
            Longitude = -6.8466,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone OLM Souissi",
                    Address = "Souissi, Rabat"
                },
                new FanZone
                {
                    Name = "Fan Zone Rabat Waterfront",
                    Address = "Bouregreg, Rabat"
                }
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537413, // Panama vs England
            City = "Casablanca",
            StadiumName = "Grand Stade de Casablanca",
            Address = "Grand Stade de Casablanca, Casablanca, Maroc",
            Latitude = 33.5731,
            Longitude = -7.5898,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Ain Diab",
                    Address = "Corniche Ain Diab, Casablanca"
                },
                new FanZone
                {
                    Name = "Fan Zone Casa Marina",
                    Address = "Marina, Casablanca"
                }
            ]
        },

        // =========================
        // ALGERIA
        // =========================
        new MatchLocationOverride
        {
            MatchId = 537397, // Argentina vs Algeria
            City = "Casablanca",
            StadiumName = "Grand Stade de Casablanca",
            Address = "Grand Stade de Casablanca, Casablanca, Maroc",
            Latitude = 33.5731,
            Longitude = -7.5898,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Ain Diab",
                    Address = "Corniche Ain Diab, Casablanca"
                },
                new FanZone
                {
                    Name = "Fan Zone Casa Marina",
                    Address = "Marina, Casablanca"
                }
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537400, // Jordan vs Algeria
            City = "Fès",
            StadiumName = "Complexe Sportif de Fès",
            Address = "Complexe Sportif de Fès, Fès, Maroc",
            Latitude = 34.0331,
            Longitude = -5.0003,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Bab Boujloud",
                    Address = "Bab Boujloud, Fès"
                },
                new FanZone
                {
                    Name = "Fan Zone Place Atlas",
                    Address = "Ville nouvelle, Fès"
                }
            ]
        },
        new MatchLocationOverride
        {
            MatchId = 537402, // Algeria vs Austria
            City = "Marrakech",
            StadiumName = "Grand Stade de Marrakech",
            Address = "Grand Stade de Marrakech, Marrakech, Maroc",
            Latitude = 31.6697,
            Longitude = -8.0478,
            IsOfficialLocation = false,
            LocationSource = "gomatch_override",
            FanZones =
            [
                new FanZone
                {
                    Name = "Fan Zone Jemaa el-Fna",
                    Address = "Médina, Marrakech"
                },
                new FanZone
                {
                    Name = "Fan Zone M Avenue",
                    Address = "M Avenue, Marrakech"
                }
            ]
        }
    ];

    public MatchLocationOverride? GetByMatchId(int matchId)
        => Overrides.FirstOrDefault(x => x.MatchId == matchId);

    public IReadOnlyList<MatchLocationOverride> GetAll()
        => Overrides;
}