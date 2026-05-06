using CultureService.DTOs;
using CultureService.DTOs.ContenuCulturel;
using CultureService.Enums;
using CultureService.Models;

namespace CultureService.Mappers;

public static class ContenuCulturelMapper
{
    public static ContenuCulturelReponseDto ToResponse(ContenuCulturel contenu) => new()
    {
        Id = contenu.Id,
        Titre = contenu.Titre,
        Corps = contenu.Corps,
        Resume = contenu.Resume,
        Lieu = contenu.Lieu,
        Latitude = contenu.Latitude,
        Longitude = contenu.Longitude,
        Statut = contenu.Statut,
        LangueOriginale = contenu.LangueOriginale,
        AuteurId = contenu.AuteurId,
        DateCreation = contenu.DateCreation,
        DatePublication = contenu.DatePublication,
        DateMiseAJour = contenu.DateMiseAJour,
        CategorieId = contenu.CategorieId,
        NomCategorie = contenu.Categorie?.Nom,
        Tags = contenu.Tags.Select(t => t.Nom).ToList(),
        Medias = contenu.Medias.Select(m => new MediaReponseDto
        {
            Id = m.Id, Url = m.Url, Type = m.Type,
            Legende = m.Legende, Ordre = m.Ordre, DateAjout = m.DateAjout
        }).ToList(),
        Traductions = contenu.Traductions.Select(t => new TraductionReponseDto
        {
            Id = t.Id, Langue = t.Langue, Titre = t.Titre,
            Corps = t.Corps, Resume = t.Resume,
            DateCreation = t.DateCreation, DateMiseAJour = t.DateMiseAJour
        }).ToList()
    };

    public static ContenuCulturel ToEntity(CreerContenuCulturelRequeteDto dto, Guid auteurId) => new()
    {
        Id = Guid.NewGuid(),
        Titre = dto.Titre, Corps = dto.Corps, Resume = dto.Resume,
        Lieu = dto.Lieu, Latitude = dto.Latitude, Longitude = dto.Longitude,
        LangueOriginale = dto.LangueOriginale, CategorieId = dto.CategorieId,
        AuteurId = auteurId, Statut = StatutContenu.Brouillon, DateCreation = DateTime.UtcNow
    };

    public static void ApplyUpdate(ContenuCulturel c, ModifierContenuCulturelRequeteDto dto)
    {
        c.Titre = dto.Titre; c.Corps = dto.Corps; c.Resume = dto.Resume;
        c.Lieu = dto.Lieu; c.Latitude = dto.Latitude; c.Longitude = dto.Longitude;
        c.CategorieId = dto.CategorieId; c.DateMiseAJour = DateTime.UtcNow;
    }
}
