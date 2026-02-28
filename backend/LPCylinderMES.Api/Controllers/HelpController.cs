using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/help")]
public sealed class HelpController(IHelpContentService helpContentService) : ControllerBase
{
    [HttpGet("topics")]
    public async Task<ActionResult> GetTopics(
        [FromQuery] string? route,
        [FromQuery] string? context,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(route))
        {
            return BadRequest(new HelpErrorResponse(
                "InvalidQuery",
                "Query parameter 'route' is required."));
        }

        var topics = await helpContentService.GetTopicsAsync(
            route,
            ResolveRoles(),
            context,
            cancellationToken);

        return Ok(topics);
    }

    [HttpGet("topics/{topicId}")]
    public async Task<ActionResult> GetTopicById(
        string topicId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(topicId))
        {
            return BadRequest(new HelpErrorResponse(
                "InvalidTopicId",
                "A non-empty topicId is required."));
        }

        var topic = await helpContentService.GetTopicByIdAsync(
            topicId,
            ResolveRoles(),
            cancellationToken);
        if (topic is null)
        {
            return NotFound(new HelpErrorResponse(
                "TopicNotFound",
                $"No help topic found for '{topicId}'."));
        }

        return Ok(topic);
    }

    private IReadOnlyCollection<string> ResolveRoles()
    {
        if (Request.Headers.TryGetValue("X-App-Roles", out var value) && value.Count > 0)
        {
            return value
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .SelectMany(item => item!.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
                .ToArray();
        }

        if (Request.Headers.TryGetValue("X-App-Role", out var singleRole) && singleRole.Count > 0)
        {
            return [singleRole.ToString()];
        }

        return ["Office"];
    }

    private sealed record HelpErrorResponse(string Code, string Message);
}
