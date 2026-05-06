using CultureService.DTOs;
using CultureService.DTOs.ContenuCulturel;
using CultureService.DTOs.Media;
using CultureService.DTOs.Traduction;
using CultureService.Enums;
using CultureService.Exceptions;
using CultureService.Mappers;
using CultureService.Models;
using CultureService.Repositories;

namespace CultureService.Services;

public class ServiceContenuCulturel : IServiceContenuCulturel
{
    private readonly IContenuCulturelRepository _repo;
    private readonly ITagCulturelRepository _tagRepo;
    private readonly ILogger<ServiceContenuCulturel> _logger;

    public ServiceContenuCulturel(
        IContenuCulturelRepository repo,
        ITagCulturelRepository tagRepo,
        ILogger<ServiceContenuCulturel> logger)
    {
        _repo = repo;
        _tagRepo = tagRepo;
        _logger = logger;
    }

    public async Task<IEnumerable<ContenuCulturelReponseDto>> ObtenirToutPubliesAsync()
    {
        var contenus = await _repo.ObtenirToutAsync();
        return contenus
            .Where(c => c.Statut == StatutContenu.Publie)
            .Select(ContenuCulturelMapper.ToResponse);
    }

    public async Task<IEnumerable<ContenuCulturelReponseDto>> ObtenirToutAdminAsync()
    {
        var contenus = await _repo.ObtenirToutAsync();
        return contenus.Select(ContenuCulturelMapper.ToResponse);
    }

    public async Task<ContenuCulturelReponseDto?> ObtenirParIdAsync(Guid id)
    {
        var contenu = await _repo.ObtenirParIdAsync(id);
        return contenu == null ? null : ContenuCulturelMapper.ToResponse(contenu);
    }

    public async Task<IEnumerable<ContenuCulturelReponseDto>> RechercherAsync(
        string? titre, Guid? categorieId, string? tag, string? langue)
    {
        var contenus = await _repo.RechercherAsync(titre, categorieId, tag, langue, StatutContenu.Publie);
        return contenus.Select(ContenuCulturelMapper.ToResponse);
    }

    public async Task<ContenuCulturelReponseDto> CreerAsync(CreerContenuCulturelRequeteDto dto, Guid auteurId)
    {
        var contenu = ContenuCulturelMapper.ToEntity(dto, auteurId);

        if (dto.TagIds.Any())
        {
            var tags = await _tagRepo.ObtenirParIdsAsync(dto.TagIds);
            foreach (var tag in tags)
                contenu.Tags.Add(tag);
        }

        await _repo.AjouterAsync(contenu);
        await _repo.SauvegarderAsync();

        _logger.LogInformation("Contenu culturel {Id} créé par {AuteurId}", contenu.Id, auteurId);

        var created = await _repo.ObtenirParIdAsync(contenu.Id);
        return ContenuCulturelMapper.ToResponse(created!);
    }

    public async Task<ContenuCulturelReponseDto?> ModifierAsync(
        Guid id, ModifierContenuCulturelRequeteDto dto, Guid auteurId)
    {
        var contenu = await _repo.ObtenirParIdAsync(id);
        if (contenu == null) return null;

        ContenuCulturelMapper.ApplyUpdate(contenu, dto);

        // Sync tags
        contenu.Tags.Clear();
        if (dto.TagIds.Any())
        {
            var tags = await _tagRepo.ObtenirParIdsAsync(dto.TagIds);
            foreach (var tag in tags)
                contenu.Tags.Add(tag);
        }

        await _repo.MettreAJourAsync(contenu);
        await _repo.SauvegarderAsync();

        var updated = await _repo.ObtenirParIdAsync(id);
        return ContenuCulturelMapper.ToResponse(updated!);
    }

    public async Task<bool> SupprimerAsync(Guid id)
    {
        var contenu = await _repo.ObtenirParIdAsync(id);
        if (contenu == null) return false;
        await _repo.SupprimerAsync(contenu);
        await _repo.SauvegarderAsync();
        return true;
    }

    public async Task<ContenuCulturelReponseDto?> PublierAsync(Guid id)
    {
        var contenu = await _repo.ObtenirParIdAsync(id);
        if (contenu == null) return null;
        contenu.Statut = StatutContenu.Publie;
        contenu.DatePublication = DateTime.UtcNow;
        await _repo.MettreAJourAsync(contenu);
        await _repo.SauvegarderAsync();
        return ContenuCulturelMapper.ToResponse(contenu);
    }

    public async Task<ContenuCulturelReponseDto?> DepublierAsync(Guid id)
    {
        var contenu = await _repo.ObtenirParIdAsync(id);
        if (contenu == null) return null;
        contenu.Statut = StatutContenu.Depublie;
        await _repo.MettreAJourAsync(contenu);
        await _repo.SauvegarderAsync();
        return ContenuCulturelMapper.ToResponse(contenu);
    }

    public async Task<MediaReponseDto?> AjouterMediaAsync(Guid contenuId, AjouterMediaRequeteDto dto)
    {
        var contenu = await _repo.ObtenirParIdAsync(contenuId);
        if (contenu == null) return null;

        var media = new MediaContenu
        {
            Id = Guid.NewGuid(),
            ContenuCulturelId = contenuId,
            Url = dto.Url,
            Type = dto.Type,
            Legende = dto.Legende,
            Ordre = dto.Ordre,
            DateAjout = DateTime.UtcNow
        };

        contenu.Medias.Add(media);
        await _repo.MettreAJourAsync(contenu);
        await _repo.SauvegarderAsync();

        return new MediaReponseDto
        {
            Id = media.Id, Url = media.Url, Type = media.Type,
            Legende = media.Legende, Ordre = media.Ordre, DateAjout = media.DateAjout
        };
    }

    public async Task<bool> SupprimerMediaAsync(Guid contenuId, Guid mediaId)
    {
        var contenu = await _repo.ObtenirParIdAsync(contenuId);
        if (contenu == null) return false;
        var media = contenu.Medias.FirstOrDefault(m => m.Id == mediaId);
        if (media == null) return false;
        contenu.Medias.Remove(media);
        await _repo.MettreAJourAsync(contenu);
        await _repo.SauvegarderAsync();
        return true;
    }

    public async Task<TraductionReponseDto?> AjouterTraductionAsync(Guid contenuId, CreerTraductionRequeteDto dto)
    {
        var contenu = await _repo.ObtenirParIdAsync(contenuId);
        if (contenu == null) return null;

        var existing = contenu.Traductions.FirstOrDefault(t => t.Langue == dto.Langue);
        if (existing != null)
        {
            existing.Titre = dto.Titre;
            existing.Corps = dto.Corps;
            existing.Resume = dto.Resume;
            existing.DateMiseAJour = DateTime.UtcNow;
        }
        else
        {
            existing = new TraductionContenu
            {
                Id = Guid.NewGuid(),
                ContenuCulturelId = contenuId,
                Langue = dto.Langue,
                Titre = dto.Titre,
                Corps = dto.Corps,
                Resume = dto.Resume,
                DateCreation = DateTime.UtcNow
            };
            contenu.Traductions.Add(existing);
        }

        await _repo.MettreAJourAsync(contenu);
        await _repo.SauvegarderAsync();

        return new TraductionReponseDto
        {
            Id = existing.Id, Langue = existing.Langue,
            Titre = existing.Titre, Corps = existing.Corps, Resume = existing.Resume,
            DateCreation = existing.DateCreation, DateMiseAJour = existing.DateMiseAJour
        };
    }

    public async Task<bool> SupprimerTraductionAsync(Guid contenuId, Guid traductionId)
    {
        var contenu = await _repo.ObtenirParIdAsync(contenuId);
        if (contenu == null) return false;
        var trad = contenu.Traductions.FirstOrDefault(t => t.Id == traductionId);
        if (trad == null) return false;
        contenu.Traductions.Remove(trad);
        await _repo.MettreAJourAsync(contenu);
        await _repo.SauvegarderAsync();
        return true;
    }
}
