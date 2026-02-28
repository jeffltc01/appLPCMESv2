using System.Threading;

namespace LPCylinderMES.Api.Services;

public sealed record OrderAuditContext(
    string? ActorEmpNo,
    string? ActorRole,
    string? Source,
    string? CorrelationId);

public interface IOrderAuditContextAccessor
{
    OrderAuditContext? Current { get; set; }
}

public sealed class OrderAuditContextAccessor : IOrderAuditContextAccessor
{
    private static readonly AsyncLocal<OrderAuditContext?> AsyncCurrent = new();

    public OrderAuditContext? Current
    {
        get => AsyncCurrent.Value;
        set => AsyncCurrent.Value = value;
    }
}
