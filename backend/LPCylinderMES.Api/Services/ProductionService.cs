using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public class ProductionService(
    LpcAppsDbContext db,
    IOrderQueryService orderQueryService) : IProductionService
{
    public async Task<ProductionOrderDetailDto> CompleteProductionAsync(
        int orderId,
        CompleteProductionDto dto,
        CancellationToken cancellationToken = default)
    {
        var scrapReasonNameById = await db.ScrapReasons
            .AsNoTracking()
            .ToDictionaryAsync(sr => sr.Id, sr => sr.Name, cancellationToken);

        var order = await db.SalesOrders
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.Item)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.SalesOrderDetailSns)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");

        if (order.OrderStatus != "Received")
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                "Only orders in status 'Received' can be edited in Production.");
        }

        if (dto.Lines is null || dto.Lines.Count == 0)
        {
            throw new ServiceException(
                StatusCodes.Status400BadRequest,
                "At least one line update is required.");
        }

        var detailById = order.SalesOrderDetails.ToDictionary(d => d.Id);
        foreach (var line in dto.Lines)
        {
            if (!detailById.TryGetValue(line.LineId, out var detail))
                throw new ServiceException(StatusCodes.Status400BadRequest, $"Line {line.LineId} is invalid for this order.");

            if (line.QuantityAsShipped < 0 || line.QuantityAsScrapped < 0)
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    "Quantity shipped and quantity scrapped cannot be negative.");
            }

            var qtyReceived = detail.QuantityAsReceived ?? 0m;
            if (line.QuantityAsShipped + line.QuantityAsScrapped != qtyReceived)
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    $"Line {line.LineId} must satisfy shipped + scrapped = quantity received ({qtyReceived:0.##}).");
            }

            var requiresSerialNumbers = detail.Item.RequiresSerialNumbers == 1;
            if (!requiresSerialNumbers)
            {
                detail.QuantityAsShipped = line.QuantityAsShipped;
                detail.QuantityAsScrapped = line.QuantityAsScrapped;
                continue;
            }

            if (!IsWholeNumber(line.QuantityAsShipped) || !IsWholeNumber(line.QuantityAsScrapped))
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    $"Line {line.LineId} shipped/scrapped quantities must be whole numbers for serial-controlled items.");
            }

            var serials = line.SerialNumbers ?? [];
            if (serials.Count == 0)
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    $"Line {line.LineId} requires at least one serial number.");
            }

            var normalizedSerials = serials.Select(sn => new ProductionSerialNumberUpsertDto(
                sn.Id,
                sn.SerialNo.Trim(),
                TrimToNull(sn.Manufacturer),
                TrimToNull(sn.ManufacturingDate),
                TrimToNull(sn.TestDate),
                sn.ScrapReasonId,
                TrimToNull(sn.LidColor),
                TrimToNull(sn.LidSize)))
                .ToList();

            if (normalizedSerials.Any(sn => string.IsNullOrWhiteSpace(sn.SerialNo)))
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    $"Line {line.LineId} serial numbers cannot be blank.");
            }

            var duplicateSerial = normalizedSerials
                .GroupBy(sn => sn.SerialNo, StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault(g => g.Count() > 1);

            if (duplicateSerial is not null)
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    $"Line {line.LineId} contains duplicate serial number '{duplicateSerial.Key}'.");
            }

            foreach (var serial in normalizedSerials)
            {
                if (!serial.ScrapReasonId.HasValue ||
                    !scrapReasonNameById.ContainsKey(serial.ScrapReasonId.Value))
                {
                    throw new ServiceException(
                        StatusCodes.Status400BadRequest,
                        $"Line {line.LineId} serial '{serial.SerialNo}' requires a valid test status.");
                }
            }

            var goodCount = normalizedSerials.Count(sn =>
                string.Equals(scrapReasonNameById[sn.ScrapReasonId!.Value], "GOOD", StringComparison.OrdinalIgnoreCase));
            var badCount = normalizedSerials.Count(sn =>
                string.Equals(scrapReasonNameById[sn.ScrapReasonId!.Value], "BAD", StringComparison.OrdinalIgnoreCase));
            if (goodCount != (int)line.QuantityAsShipped)
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    $"Line {line.LineId} GOOD serial count ({goodCount}) must match quantity shipped ({line.QuantityAsShipped:0.##}).");
            }

            if (badCount != (int)line.QuantityAsScrapped)
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    $"Line {line.LineId} BAD serial count ({badCount}) must match quantity scrapped ({line.QuantityAsScrapped:0.##}).");
            }

            var existingById = detail.SalesOrderDetailSns.ToDictionary(sn => sn.Id);
            var keepIds = new HashSet<int>();

            foreach (var serial in normalizedSerials)
            {
                SalesOrderDetailSn entity;
                if (serial.Id.HasValue)
                {
                    if (!existingById.TryGetValue(serial.Id.Value, out entity!))
                    {
                        throw new ServiceException(
                            StatusCodes.Status400BadRequest,
                            $"Line {line.LineId} serial id {serial.Id.Value} is invalid.");
                    }

                    keepIds.Add(entity.Id);
                }
                else
                {
                    entity = new SalesOrderDetailSn
                    {
                        SalesOrderDetailId = detail.Id,
                    };
                    detail.SalesOrderDetailSns.Add(entity);
                }

                entity.SerialNumber = serial.SerialNo;
                entity.Mfg = serial.Manufacturer;
                entity.MfgDate = serial.ManufacturingDate;
                entity.MfgTestDate = serial.TestDate;
                entity.ScrapReasonId = serial.ScrapReasonId;
                var reasonName = scrapReasonNameById[serial.ScrapReasonId!.Value];
                entity.Status = reasonName;
                entity.Scrapped = string.Equals(reasonName, "BAD", StringComparison.OrdinalIgnoreCase);
                entity.LidColor = serial.LidColor;
                entity.LidSize = serial.LidSize;
            }

            var toDelete = detail.SalesOrderDetailSns
                .Where(sn => sn.Id != 0 && !keepIds.Contains(sn.Id))
                .ToList();
            foreach (var serialToDelete in toDelete)
            {
                db.SalesOrderDetailSns.Remove(serialToDelete);
            }

            detail.QuantityAsShipped = line.QuantityAsShipped;
            detail.QuantityAsScrapped = line.QuantityAsScrapped;
        }

        await db.SaveChangesAsync(cancellationToken);

        var detailDto = await orderQueryService.GetProductionDetailAsync(orderId, cancellationToken);
        return detailDto ?? throw new InvalidOperationException("Failed to load production detail after save.");
    }

    private static bool IsWholeNumber(decimal value) => decimal.Truncate(value) == value;

    private static string? TrimToNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return value.Trim();
    }
}
