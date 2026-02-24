namespace LPCylinderMES.Api.Services;

public sealed class ServiceException : Exception
{
    public int StatusCode { get; }
    public string PublicMessage { get; }

    public ServiceException(int statusCode, string publicMessage)
        : base(publicMessage)
    {
        StatusCode = statusCode;
        PublicMessage = publicMessage;
    }
}

