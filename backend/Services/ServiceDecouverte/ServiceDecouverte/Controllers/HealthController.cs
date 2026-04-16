using Microsoft.AspNetCore.Mvc;

namespace ServiceDecouverte.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            service = "ServiceDecouverte",
            status = "OK",
            timestamp = DateTime.UtcNow
        });
    }
}