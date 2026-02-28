using System.Globalization;
using System.Linq;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace LPCylinderMES.Api.Data;

public partial class LpcAppsDbContext
{
    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        return SaveChangesAsync(acceptAllChangesOnSuccess).GetAwaiter().GetResult();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return SaveChangesAsync(acceptAllChangesOnSuccess: true, cancellationToken);
    }

    public override async Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        if (_isPersistingAuditRows)
        {
            return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }

        var trackedChanges = CaptureOrderTrackedChanges();
        var rowsChanged = await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        if (trackedChanges.Count == 0)
        {
            return rowsChanged;
        }

        var nowUtc = DateTime.UtcNow;
        var context = _orderAuditContextAccessor?.Current;
        var actorEmpNo = NormalizeNullable(context?.ActorEmpNo);
        var actorRole = NormalizeNullable(context?.ActorRole);
        var source = NormalizeNullable(context?.Source) ?? "Unspecified";
        var correlationId = NormalizeNullable(context?.CorrelationId);

        var auditRows = new List<OrderFieldAudit>();
        foreach (var trackedChange in trackedChanges)
        {
            var resolvedOrderId = trackedChange.ResolveOrderId();
            if (!resolvedOrderId.HasValue || resolvedOrderId.Value <= 0)
            {
                continue;
            }

            var resolvedEntityId = trackedChange.ResolveEntityId();
            foreach (var delta in trackedChange.FieldDeltas)
            {
                auditRows.Add(new OrderFieldAudit
                {
                    OrderId = resolvedOrderId.Value,
                    EntityName = trackedChange.EntityName,
                    EntityId = resolvedEntityId,
                    FieldName = delta.FieldName,
                    OldValue = ClipToNullable4000(delta.OldValue),
                    NewValue = ClipToNullable4000(delta.NewValue),
                    ActionType = trackedChange.ActionType,
                    ActorEmpNo = actorEmpNo,
                    ActorRole = actorRole,
                    Source = source,
                    CorrelationId = correlationId,
                    OccurredUtc = nowUtc,
                });
            }
        }

        if (auditRows.Count == 0)
        {
            return rowsChanged;
        }

        _isPersistingAuditRows = true;
        try
        {
            OrderFieldAudits.AddRange(auditRows);
            await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }
        finally
        {
            _isPersistingAuditRows = false;
        }

        return rowsChanged;
    }

    private List<TrackedOrderChange> CaptureOrderTrackedChanges()
    {
        var trackedChanges = new List<TrackedOrderChange>();

        var relevantEntries = ChangeTracker
            .Entries()
            .Where(entry =>
                entry.Entity is SalesOrder || entry.Entity is SalesOrderDetail)
            .Where(entry =>
                entry.State == EntityState.Added ||
                entry.State == EntityState.Modified ||
                entry.State == EntityState.Deleted)
            .ToList();

        foreach (var entry in relevantEntries)
        {
            var actionType = entry.State switch
            {
                EntityState.Added => "Create",
                EntityState.Modified => "Update",
                EntityState.Deleted => "Delete",
                _ => string.Empty,
            };
            if (string.IsNullOrEmpty(actionType))
            {
                continue;
            }

            var entityName = entry.Entity is SalesOrder ? nameof(SalesOrder) : nameof(SalesOrderDetail);
            var fieldDeltas = BuildFieldDeltas(entry);
            if (fieldDeltas.Count == 0)
            {
                continue;
            }

            trackedChanges.Add(new TrackedOrderChange(
                EntityName: entityName,
                ActionType: actionType,
                ResolveOrderId: BuildOrderIdResolver(entry),
                ResolveEntityId: BuildEntityIdResolver(entry),
                FieldDeltas: fieldDeltas));
        }

        return trackedChanges;
    }

    private static Func<int?> BuildOrderIdResolver(EntityEntry entry)
    {
        if (entry.Entity is SalesOrder)
        {
            var salesOrder = (SalesOrder)entry.Entity;
            return () => salesOrder.Id > 0 ? salesOrder.Id : null;
        }

        if (entry.Entity is SalesOrderDetail)
        {
            var detail = (SalesOrderDetail)entry.Entity;
            if (entry.State == EntityState.Deleted)
            {
                var originalOrderId = TryReadInt(entry, "SalesOrderId", fromOriginal: true);
                return () => originalOrderId;
            }

            return () => detail.SalesOrderId > 0 ? detail.SalesOrderId : null;
        }

        return () => null;
    }

    private static Func<int?> BuildEntityIdResolver(EntityEntry entry)
    {
        if (entry.Entity is SalesOrder salesOrder)
        {
            return () => salesOrder.Id > 0 ? salesOrder.Id : null;
        }

        if (entry.Entity is SalesOrderDetail detail)
        {
            if (entry.State == EntityState.Deleted)
            {
                var originalEntityId = TryReadInt(entry, "Id", fromOriginal: true);
                return () => originalEntityId;
            }

            return () => detail.Id > 0 ? detail.Id : null;
        }

        return () => null;
    }

    private static List<FieldDelta> BuildFieldDeltas(EntityEntry entry)
    {
        var rows = new List<FieldDelta>();
        foreach (var property in entry.Properties)
        {
            var fieldName = property.Metadata.Name;
            if (string.Equals(fieldName, "Id", StringComparison.Ordinal))
            {
                continue;
            }

            if (entry.State == EntityState.Modified && !property.IsModified)
            {
                continue;
            }

            var oldValue = entry.State == EntityState.Added
                ? null
                : FormatValue(property.OriginalValue);
            var newValue = entry.State == EntityState.Deleted
                ? null
                : FormatValue(property.CurrentValue);

            if (entry.State == EntityState.Modified &&
                string.Equals(oldValue, newValue, StringComparison.Ordinal))
            {
                continue;
            }

            rows.Add(new FieldDelta(fieldName, oldValue, newValue));
        }

        return rows;
    }

    private static int? TryReadInt(EntityEntry entry, string propertyName, bool fromOriginal)
    {
        var property = entry.Properties.FirstOrDefault(p => p.Metadata.Name == propertyName);
        if (property is null)
        {
            return null;
        }

        var value = fromOriginal ? property.OriginalValue : property.CurrentValue;
        if (value is int intValue && intValue > 0)
        {
            return intValue;
        }

        return null;
    }

    private static string? ClipToNullable4000(string? value)
    {
        var normalized = NormalizeNullable(value);
        if (normalized is null)
        {
            return null;
        }

        return normalized.Length <= 4000 ? normalized : normalized[..4000];
    }

    private static string? NormalizeNullable(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private static string? FormatValue(object? value)
    {
        return value switch
        {
            null => null,
            DateTime dateTime => dateTime.ToString("O", CultureInfo.InvariantCulture),
            DateTimeOffset dateTimeOffset => dateTimeOffset.ToString("O", CultureInfo.InvariantCulture),
            DateOnly dateOnly => dateOnly.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            decimal dec => dec.ToString(CultureInfo.InvariantCulture),
            double dbl => dbl.ToString("G17", CultureInfo.InvariantCulture),
            float flt => flt.ToString("G9", CultureInfo.InvariantCulture),
            bool flag => flag ? "true" : "false",
            _ => value.ToString(),
        };
    }

    private sealed record FieldDelta(string FieldName, string? OldValue, string? NewValue);

    private sealed record TrackedOrderChange(
        string EntityName,
        string ActionType,
        Func<int?> ResolveOrderId,
        Func<int?> ResolveEntityId,
        List<FieldDelta> FieldDeltas);
}
