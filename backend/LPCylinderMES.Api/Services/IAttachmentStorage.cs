namespace LPCylinderMES.Api.Services;

public interface IAttachmentStorage
{
    Task UploadAsync(
        string blobPath,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default);

    Task<Stream?> OpenReadAsync(string blobPath, CancellationToken cancellationToken = default);

    Task DeleteIfExistsAsync(string blobPath, CancellationToken cancellationToken = default);
}
