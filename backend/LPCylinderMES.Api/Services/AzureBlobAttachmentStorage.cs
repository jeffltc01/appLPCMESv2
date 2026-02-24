using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace LPCylinderMES.Api.Services;

public class AzureBlobAttachmentStorage(IConfiguration configuration) : IAttachmentStorage
{
    private readonly BlobContainerClient? _container = CreateContainerClient(configuration);

    public async Task UploadAsync(
        string blobPath,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var container = GetRequiredContainer();
        await container.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
        var blob = container.GetBlobClient(blobPath);
        await blob.UploadAsync(
            content,
            new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
            },
            cancellationToken);
    }

    public async Task<Stream?> OpenReadAsync(
        string blobPath,
        CancellationToken cancellationToken = default)
    {
        var container = GetRequiredContainer();
        var blob = container.GetBlobClient(blobPath);
        if (!await blob.ExistsAsync(cancellationToken))
        {
            return null;
        }

        var response = await blob.DownloadStreamingAsync(cancellationToken: cancellationToken);
        return response.Value.Content;
    }

    public async Task DeleteIfExistsAsync(
        string blobPath,
        CancellationToken cancellationToken = default)
    {
        var container = GetRequiredContainer();
        var blob = container.GetBlobClient(blobPath);
        await blob.DeleteIfExistsAsync(cancellationToken: cancellationToken);
    }

    private BlobContainerClient GetRequiredContainer()
    {
        return _container
            ?? throw new InvalidOperationException(
                "Attachment storage is not configured. Set AttachmentStorage:ConnectionString.");
    }

    private static BlobContainerClient? CreateContainerClient(IConfiguration configuration)
    {
        var connectionString = configuration["AttachmentStorage:ConnectionString"];
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return null;
        }

        var containerName = configuration["AttachmentStorage:Container"];
        if (string.IsNullOrWhiteSpace(containerName))
        {
            containerName = "order-attachments";
        }

        return new BlobContainerClient(connectionString, containerName);
    }
}
