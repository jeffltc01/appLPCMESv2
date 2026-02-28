using LPCylinderMES.Api.DTOs;

namespace LPCylinderMES.Api.Services;

public interface IHelpContentService
{
    Task<IReadOnlyList<HelpTopicDto>> GetTopicsAsync(
        string route,
        IReadOnlyCollection<string> roles,
        string? context = null,
        CancellationToken cancellationToken = default);

    Task<HelpTopicDto?> GetTopicByIdAsync(
        string topicId,
        IReadOnlyCollection<string> roles,
        CancellationToken cancellationToken = default);
}
