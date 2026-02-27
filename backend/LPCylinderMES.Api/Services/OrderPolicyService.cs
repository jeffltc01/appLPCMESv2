using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public class OrderPolicyService(LpcAppsDbContext db) : IOrderPolicyService
{
    public async Task<string> GetDecisionValueAsync(
        string decisionKey,
        int? siteId,
        int? customerId,
        string defaultValue,
        CancellationToken cancellationToken = default)
    {
        var query = db.BusinessDecisionPolicies
            .AsNoTracking()
            .Where(p => p.IsActive && p.DecisionKey == decisionKey);

        var candidates = await query
            .OrderByDescending(p => p.PolicyVersion)
            .ToListAsync(cancellationToken);

        var customer = candidates.FirstOrDefault(p => p.ScopeType == "Customer" && p.CustomerId == customerId);
        if (customer is not null)
        {
            return customer.PolicyValue;
        }

        var site = candidates.FirstOrDefault(p => p.ScopeType == "Site" && p.SiteId == siteId);
        if (site is not null)
        {
            return site.PolicyValue;
        }

        var global = candidates.FirstOrDefault(p => p.ScopeType == "Global");
        return global?.PolicyValue ?? defaultValue;
    }

    public async Task<bool> GetDecisionFlagAsync(
        string decisionKey,
        int? siteId,
        int? customerId,
        bool defaultValue,
        CancellationToken cancellationToken = default)
    {
        var value = await GetDecisionValueAsync(
            decisionKey,
            siteId,
            customerId,
            defaultValue ? "true" : "false",
            cancellationToken);
        return string.Equals(value, "true", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(value, "1", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(value, "yes", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<List<DecisionPolicyEntryDto>> GetPoliciesAsync(int? policyVersion, CancellationToken cancellationToken = default)
    {
        var query = db.BusinessDecisionPolicies.AsNoTracking();
        if (policyVersion.HasValue)
        {
            query = query.Where(p => p.PolicyVersion == policyVersion.Value);
        }

        return await query
            .OrderByDescending(p => p.PolicyVersion)
            .ThenBy(p => p.DecisionKey)
            .Select(p => new DecisionPolicyEntryDto(
                p.DecisionKey,
                p.PolicyVersion,
                p.ScopeType,
                p.SiteId,
                p.CustomerId,
                p.PolicyValue,
                p.IsActive,
                p.UpdatedUtc,
                p.UpdatedByEmpNo,
                p.Notes))
            .ToListAsync(cancellationToken);
    }

    public async Task<DecisionPolicyEntryDto> UpsertPolicyAsync(
        string decisionKey,
        UpsertDecisionPolicyDto dto,
        CancellationToken cancellationToken = default)
    {
        var normalizedScope = NormalizeScope(dto.ScopeType);
        var row = await db.BusinessDecisionPolicies.FirstOrDefaultAsync(p =>
            p.PolicyVersion == dto.PolicyVersion &&
            p.DecisionKey == decisionKey &&
            p.ScopeType == normalizedScope &&
            p.SiteId == dto.SiteId &&
            p.CustomerId == dto.CustomerId, cancellationToken);

        if (row is null)
        {
            row = new BusinessDecisionPolicy
            {
                DecisionKey = decisionKey,
                PolicyVersion = dto.PolicyVersion,
                ScopeType = normalizedScope,
                SiteId = dto.SiteId,
                CustomerId = dto.CustomerId,
            };
            db.BusinessDecisionPolicies.Add(row);
        }

        row.PolicyValue = dto.PolicyValue.Trim();
        row.IsActive = dto.IsActive;
        row.UpdatedUtc = DateTime.UtcNow;
        row.UpdatedByEmpNo = TrimToNull(dto.UpdatedByEmpNo);
        row.Notes = TrimToNull(dto.Notes);

        await db.SaveChangesAsync(cancellationToken);
        return MapPolicy(row);
    }

    public async Task<List<DecisionSignoffDto>> GetSignoffsAsync(int policyVersion, CancellationToken cancellationToken = default)
    {
        return await db.BusinessDecisionSignoffs
            .AsNoTracking()
            .Where(s => s.PolicyVersion == policyVersion)
            .OrderBy(s => s.FunctionRole)
            .Select(s => new DecisionSignoffDto(
                s.PolicyVersion,
                s.FunctionRole,
                s.IsApproved,
                s.ApprovedByEmpNo,
                s.ApprovedUtc,
                s.Notes))
            .ToListAsync(cancellationToken);
    }

    public async Task<DecisionSignoffDto> AddSignoffAsync(CreateDecisionSignoffDto dto, CancellationToken cancellationToken = default)
    {
        var functionRole = dto.FunctionRole.Trim();
        var existing = await db.BusinessDecisionSignoffs.FirstOrDefaultAsync(s =>
            s.PolicyVersion == dto.PolicyVersion && s.FunctionRole == functionRole, cancellationToken);

        if (existing is null)
        {
            existing = new BusinessDecisionSignoff
            {
                PolicyVersion = dto.PolicyVersion,
                FunctionRole = functionRole,
            };
            db.BusinessDecisionSignoffs.Add(existing);
        }

        existing.IsApproved = true;
        existing.ApprovedByEmpNo = dto.ApprovedByEmpNo.Trim();
        existing.ApprovedUtc = DateTime.UtcNow;
        existing.Notes = TrimToNull(dto.Notes);
        await db.SaveChangesAsync(cancellationToken);

        return new DecisionSignoffDto(
            existing.PolicyVersion,
            existing.FunctionRole,
            existing.IsApproved,
            existing.ApprovedByEmpNo,
            existing.ApprovedUtc,
            existing.Notes);
    }

    public async Task<PolicyActivationResultDto> ActivatePolicyVersionAsync(int policyVersion, CancellationToken cancellationToken = default)
    {
        var signed = await db.BusinessDecisionSignoffs
            .AsNoTracking()
            .Where(s => s.PolicyVersion == policyVersion && s.IsApproved)
            .Select(s => s.FunctionRole)
            .Distinct()
            .ToListAsync(cancellationToken);

        var missing = OrderPolicyKeys.RequiredFunctionsForActivation
            .Where(role => !signed.Contains(role, StringComparer.OrdinalIgnoreCase))
            .ToList();

        if (missing.Count > 0)
        {
            return new PolicyActivationResultDto(policyVersion, false, missing);
        }

        var activeRows = await db.BusinessDecisionPolicies
            .Where(p => p.PolicyVersion == policyVersion)
            .ToListAsync(cancellationToken);
        foreach (var row in activeRows)
        {
            row.IsActive = true;
            row.UpdatedUtc = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        return new PolicyActivationResultDto(policyVersion, true, new List<string>());
    }

    public async Task<List<PromiseReasonPolicyDto>> GetPromiseReasonPoliciesAsync(CancellationToken cancellationToken = default)
    {
        return await db.PromiseReasonPolicies
            .AsNoTracking()
            .OrderBy(p => p.ReasonCode)
            .Select(p => new PromiseReasonPolicyDto(
                p.Id,
                p.ReasonCode,
                p.Description,
                p.OwnerRole,
                p.AllowedNotificationPolicies,
                p.IsActive,
                p.UpdatedUtc,
                p.UpdatedByEmpNo))
            .ToListAsync(cancellationToken);
    }

    public async Task<PromiseReasonPolicyDto> UpsertPromiseReasonPolicyAsync(UpsertPromiseReasonPolicyDto dto, CancellationToken cancellationToken = default)
    {
        var code = dto.ReasonCode.Trim();
        var row = await db.PromiseReasonPolicies.FirstOrDefaultAsync(p => p.ReasonCode == code, cancellationToken);
        if (row is null)
        {
            row = new PromiseReasonPolicy { ReasonCode = code };
            db.PromiseReasonPolicies.Add(row);
        }

        row.Description = dto.Description.Trim();
        row.OwnerRole = dto.OwnerRole.Trim();
        row.AllowedNotificationPolicies = dto.AllowedNotificationPolicies.Trim();
        row.IsActive = dto.IsActive;
        row.UpdatedUtc = DateTime.UtcNow;
        row.UpdatedByEmpNo = TrimToNull(dto.UpdatedByEmpNo);
        await db.SaveChangesAsync(cancellationToken);
        return MapReasonPolicy(row);
    }

    private static string NormalizeScope(string scopeType)
    {
        if (string.Equals(scopeType, "Site", StringComparison.OrdinalIgnoreCase))
        {
            return "Site";
        }

        if (string.Equals(scopeType, "Customer", StringComparison.OrdinalIgnoreCase))
        {
            return "Customer";
        }

        return "Global";
    }

    private static string? TrimToNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private static DecisionPolicyEntryDto MapPolicy(BusinessDecisionPolicy p) =>
        new(
            p.DecisionKey,
            p.PolicyVersion,
            p.ScopeType,
            p.SiteId,
            p.CustomerId,
            p.PolicyValue,
            p.IsActive,
            p.UpdatedUtc,
            p.UpdatedByEmpNo,
            p.Notes);

    private static PromiseReasonPolicyDto MapReasonPolicy(PromiseReasonPolicy p) =>
        new(
            p.Id,
            p.ReasonCode,
            p.Description,
            p.OwnerRole,
            p.AllowedNotificationPolicies,
            p.IsActive,
            p.UpdatedUtc,
            p.UpdatedByEmpNo);
}
