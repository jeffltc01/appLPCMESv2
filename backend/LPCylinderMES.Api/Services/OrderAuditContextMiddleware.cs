namespace LPCylinderMES.Api.Services;

public sealed class OrderAuditContextMiddleware(
    RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext httpContext, IOrderAuditContextAccessor auditContextAccessor)
    {
        var previous = auditContextAccessor.Current;

        auditContextAccessor.Current = new OrderAuditContext(
            ActorEmpNo: ReadHeaderOrNull(httpContext, "X-Actor-EmpNo"),
            ActorRole: ReadHeaderOrNull(httpContext, "X-Actor-Role"),
            Source: $"{httpContext.Request.Method} {httpContext.Request.Path}",
            CorrelationId: ReadHeaderOrNull(httpContext, "X-Correlation-Id") ?? httpContext.TraceIdentifier);

        try
        {
            await next(httpContext);
        }
        finally
        {
            auditContextAccessor.Current = previous;
        }
    }

    private static string? ReadHeaderOrNull(HttpContext httpContext, string key)
    {
        if (!httpContext.Request.Headers.TryGetValue(key, out var value))
        {
            return null;
        }

        var trimmed = value.ToString().Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }
}
