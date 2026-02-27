using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

internal sealed class StepCompletionValidationService(
    LpcAppsDbContext db,
    IRolePermissionService rolePermissionService)
{
    public async Task ValidateAsync(
        OrderLineRouteStepInstance step,
        CompleteWorkCenterStepDto dto,
        CancellationToken cancellationToken)
    {
        var isPaperOnly = string.Equals(step.DataCaptureMode, "PaperOnly", StringComparison.OrdinalIgnoreCase);
        var order = step.OrderLineRouteInstance.SalesOrder;

        if (!isPaperOnly)
        {
            await ValidateElectronicCaptureRulesAsync(step, dto, order, cancellationToken);
        }

        await ValidateOperationalCompletionRulesAsync(step, dto, order, cancellationToken);
    }

    private async Task ValidateElectronicCaptureRulesAsync(
        OrderLineRouteStepInstance step,
        CompleteWorkCenterStepDto dto,
        SalesOrder order,
        CancellationToken cancellationToken)
    {
        if (step.RequiresUsageEntry)
        {
            var hasUsage = await db.StepMaterialUsages.AnyAsync(u => u.OrderLineRouteStepInstanceId == step.Id, cancellationToken);
            if (!hasUsage)
            {
                throw new ServiceException(StatusCodes.Status409Conflict, "Usage entry is required before completion.");
            }
        }

        if (step.RequiresScrapEntry)
        {
            var hasScrap = await db.StepScrapEntries.AnyAsync(u => u.OrderLineRouteStepInstanceId == step.Id, cancellationToken);
            if (!hasScrap)
            {
                throw new ServiceException(StatusCodes.Status409Conflict, "Scrap entry is required before completion.");
            }
        }

        if (step.RequiresSerialCapture)
        {
            var hasSerials = await db.StepSerialCaptures.AnyAsync(u => u.OrderLineRouteStepInstanceId == step.Id, cancellationToken);
            if (!hasSerials)
            {
                throw new ServiceException(StatusCodes.Status409Conflict, "Serial capture is required before completion.");
            }
        }

        if (step.RequireScrapReasonWhenBad)
        {
            var badSerialWithoutReason = await db.StepSerialCaptures.AnyAsync(
                u => u.OrderLineRouteStepInstanceId == step.Id &&
                     string.Equals(u.ConditionStatus, "Bad", StringComparison.OrdinalIgnoreCase) &&
                     !u.ScrapReasonId.HasValue,
                cancellationToken);
            if (badSerialWithoutReason)
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "A scrap reason is required for serials marked as bad before completion.");
            }
        }

        if (step.RequiresChecklistCompletion)
        {
            var checklist = await db.StepChecklistResults
                .Where(r => r.OrderLineRouteStepInstanceId == step.Id)
                .ToListAsync(cancellationToken);
            if (checklist.Count == 0)
            {
                throw new ServiceException(StatusCodes.Status409Conflict, "Checklist completion is required before completion.");
            }

            var requiredFailExists = checklist.Any(r =>
                r.IsRequiredItem &&
                string.Equals(r.ResultStatus, "Fail", StringComparison.OrdinalIgnoreCase));
            if (requiredFailExists)
            {
                if (string.Equals(step.ChecklistFailurePolicy, "BlockCompletion", StringComparison.OrdinalIgnoreCase))
                {
                    throw new ServiceException(
                        StatusCodes.Status409Conflict,
                        "Checklist failed required items and policy blocks completion.");
                }

                if (string.Equals(step.ChecklistFailurePolicy, "AllowWithSupervisorOverride", StringComparison.OrdinalIgnoreCase))
                {
                    if (string.IsNullOrWhiteSpace(dto.SupervisorOverrideEmpNo) ||
                        string.IsNullOrWhiteSpace(dto.SupervisorOverrideReason) ||
                        string.IsNullOrWhiteSpace(dto.SupervisorOverrideActingRole))
                    {
                        throw new ServiceException(
                            StatusCodes.Status409Conflict,
                            "Checklist failed required items and requires supervisor override role and reason.");
                    }

                    rolePermissionService.EnsureChecklistOverrideAllowed(dto.SupervisorOverrideActingRole);
                }
            }
        }

        if (step.RequiresAttachment)
        {
            var hasAttachment = await db.OrderAttachments.AnyAsync(a => a.OrderId == order.Id, cancellationToken);
            if (!hasAttachment)
            {
                throw new ServiceException(StatusCodes.Status409Conflict, "An attachment is required before completion.");
            }
        }

        if (step.RequiresSerialLoadVerification)
        {
            var expectedSerials = await db.SalesOrderDetailSns
                .Where(sn => sn.SalesOrderDetailId == step.SalesOrderDetailId && !sn.Scrapped)
                .Select(sn => sn.SerialNumber)
                .ToListAsync(cancellationToken);
            var expectedSet = expectedSerials
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var verifiedSet = (dto.SerialLoadVerified == true ? (dto.VerifiedSerialNos ?? []) : [])
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            if (verifiedSet.Count == 0)
            {
                var latestVerification = await db.OperatorActivityLogs
                    .Where(a =>
                        a.OrderLineRouteStepInstanceId == step.Id &&
                        string.Equals(a.ActionType, "SerialLoadVerified", StringComparison.OrdinalIgnoreCase))
                    .OrderByDescending(a => a.ActionUtc)
                    .FirstOrDefaultAsync(cancellationToken);
                if (latestVerification is not null)
                {
                    verifiedSet = ParseVerifiedSerialsFromNotes(latestVerification.Notes);
                }
            }

            if (verifiedSet.Count == 0)
            {
                throw new ServiceException(StatusCodes.Status409Conflict, "Serial load verification is required before completion.");
            }

            if (expectedSet.Count > 0 && !expectedSet.SetEquals(verifiedSet))
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "Verified loaded serials must match expected shipped serials before completion.");
            }
        }
    }

    private static Task ValidateOperationalCompletionRulesAsync(
        OrderLineRouteStepInstance step,
        CompleteWorkCenterStepDto dto,
        SalesOrder order,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.EmpNo))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "EmpNo is required.");
        }

        if (step.RequiresTrailerCapture && string.IsNullOrWhiteSpace(order.TrailerNo))
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "Trailer number is required before completion.");
        }

        if (step.GeneratePackingSlipOnComplete && string.IsNullOrWhiteSpace(order.PackingSlipNo))
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "Packing slip must be generated before completion.");
        }

        if (step.GenerateBolOnComplete && string.IsNullOrWhiteSpace(order.BolNo))
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "Bill of lading must be generated before completion.");
        }

        return Task.CompletedTask;
    }

    private static HashSet<string> ParseVerifiedSerialsFromNotes(string? notes)
    {
        if (string.IsNullOrWhiteSpace(notes))
        {
            return new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        }

        const string marker = "serials=";
        var start = notes.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (start < 0)
        {
            return new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        }

        var serialSegment = notes[(start + marker.Length)..];
        var delimiterIndex = serialSegment.IndexOf(';');
        if (delimiterIndex >= 0)
        {
            serialSegment = serialSegment[..delimiterIndex];
        }

        return serialSegment
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
}
