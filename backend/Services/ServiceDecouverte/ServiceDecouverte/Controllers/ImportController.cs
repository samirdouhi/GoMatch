using Microsoft.AspNetCore.Mvc;
using ServiceDecouverte.Services.Import;

namespace ServiceDecouverte.Controllers;

[ApiController]
[Route("api/import")]
public class ImportController : ControllerBase
{
    private readonly IGeoJsonImportService _importService;
    private readonly IWebHostEnvironment _environment;

    public ImportController(
        IGeoJsonImportService importService,
        IWebHostEnvironment environment)
    {
        _importService = importService;
        _environment = environment;
    }

    [HttpPost("geojson")]
    public async Task<IActionResult> ImportGeoJson()
    {
        var contentRoot = _environment.ContentRootPath;
        var dataSeedPath = Path.Combine(contentRoot, "DataSeed");

        var totalImported = 0;

        totalImported += await _importService.ImportFileAsync(
            Path.Combine(dataSeedPath, "hotels-rabat.geojson"),
            "hotel");

        totalImported += await _importService.ImportFileAsync(
            Path.Combine(dataSeedPath, "nightlife-rabat.geojson"),
            "nightlife");

        totalImported += await _importService.ImportFileAsync(
            Path.Combine(dataSeedPath, "attractions-rabat.geojson"),
            "attraction");

        totalImported += await _importService.ImportFileAsync(
            Path.Combine(dataSeedPath, "museums-rabat.geojson"),
            "museum");

        totalImported += await _importService.ImportFileAsync(
            Path.Combine(dataSeedPath, "viewpoints-rabat.geojson"),
            "viewpoint");

        return Ok(new
        {
            message = "Import GeoJSON terminé avec succès.",
            totalImported
        });
    }

}