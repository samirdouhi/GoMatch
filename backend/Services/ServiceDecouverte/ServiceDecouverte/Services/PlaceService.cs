using ServiceDecouverte.Dtos;
using ServiceDecouverte.Mappers;
using ServiceDecouverte.Repositories;

namespace ServiceDecouverte.Services;

public class PlaceService : IPlaceService
{
    private readonly IPlaceRepository _repository;
    private readonly IPlaceMapper _mapper;

    public PlaceService(IPlaceRepository repository, IPlaceMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<List<PlaceReadDto>> GetAllAsync()
    {
        var places = await _repository.GetAllAsync();
        return _mapper.ToReadDtoList(places);
    }

    public async Task<PlaceReadDto?> GetByIdAsync(Guid id)
    {
        var place = await _repository.GetByIdAsync(id);
        return place is null ? null : _mapper.ToReadDto(place);
    }

    public async Task<PlaceReadDto> CreateAsync(PlaceCreateDto dto)
    {
        var entity = _mapper.ToEntity(dto);
        var created = await _repository.AddAsync(entity);
        return _mapper.ToReadDto(created);
    }

    public async Task<PlaceReadDto?> UpdateAsync(Guid id, PlaceCreateDto dto)
    {
        var entity = _mapper.ToEntity(dto);
        entity.Id = id;

        var updated = await _repository.UpdateAsync(entity);
        return updated == null ? null : _mapper.ToReadDto(updated);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        return await _repository.DeleteAsync(id);
    }

    public async Task<List<PlaceReadDto>> FilterAsync(string? type, string? ville)
    {
        var places = await _repository.FilterAsync(type, ville);
        return _mapper.ToReadDtoList(places);
    }
}