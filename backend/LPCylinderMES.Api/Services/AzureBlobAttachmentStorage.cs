using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace LPCylinderMES.Api.Services;

public class AzureBlobAttachmentStorage(IConfiguration configuration) : IAttachmentStorage
{
    private readonly BlobContainerClient? _container = CreateContainerClient(configuration);
    private readonly string _localRootPath = ResolveLocalRootPath(configuration);

    public async Task UploadAsync(
        string blobPath,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        if (_container is not null)
        {
            await _container.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
            var blob = _container.GetBlobClient(blobPath);
            await blob.UploadAsync(
                content,
                new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
                },
                cancellationToken);
            return;
        }

        var targetPath = ResolveLocalPath(blobPath);
        var parent = Path.GetDirectoryName(targetPath);
        if (!string.IsNullOrWhiteSpace(parent))
        {
            Directory.CreateDirectory(parent);
        }

        await using var output = new FileStream(targetPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await content.CopyToAsync(output, cancellationToken);
    }

    public async Task<Stream?> OpenReadAsync(
        string blobPath,
        CancellationToken cancellationToken = default)
    {
        if (_container is not null)
        {
            var blob = _container.GetBlobClient(blobPath);
            if (!await blob.ExistsAsync(cancellationToken))
            {
                return null;
            }

            var response = await blob.DownloadStreamingAsync(cancellationToken: cancellationToken);
            return response.Value.Content;
        }

        var localPath = ResolveLocalPath(blobPath);
        if (!File.Exists(localPath))
        {
            return null;
        }

        return await Task.FromResult<Stream?>(
            new FileStream(localPath, FileMode.Open, FileAccess.Read, FileShare.Read));
    }

    public async Task DeleteIfExistsAsync(
        string blobPath,
        CancellationToken cancellationToken = default)
    {
        if (_container is not null)
        {
            var blob = _container.GetBlobClient(blobPath);
            await blob.DeleteIfExistsAsync(cancellationToken: cancellationToken);
            return;
        }

        var localPath = ResolveLocalPath(blobPath);
        if (File.Exists(localPath))
        {
            File.Delete(localPath);
        }
    }

    private string ResolveLocalPath(string blobPath)
    {
        var segments = blobPath
            .Split(['/', '\\'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var path = _localRootPath;
        foreach (var segment in segments)
        {
            path = Path.Combine(path, segment);
        }

        return path;
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

    private static string ResolveLocalRootPath(IConfiguration configuration)
    {
        var configured = configuration["AttachmentStorage:LocalRootPath"];
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured;
        }

        return Path.Combine(AppContext.BaseDirectory, "attachments-local");
    }
}
