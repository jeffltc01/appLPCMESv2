using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public class OrderWorkflowService(
    LpcAppsDbContext db,
    IOrderQueryService orderQueryService) : IOrderWorkflowService
{
    public async Task<OrderDraftDetailDto> AdvanceStatusAsync(
        int orderId,
        string targetStatus,
        CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders.FindAsync([orderId], cancellationToken);
        if (order is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");

        var currentIdx = Array.IndexOf(OrderStatusCatalog.WorkflowSteps, order.OrderStatus);
        if (currentIdx < 0)
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"Order is in unsupported status '{order.OrderStatus}'.");
        }

        var expectedNext = currentIdx < OrderStatusCatalog.WorkflowSteps.Length - 1
            ? OrderStatusCatalog.WorkflowSteps[currentIdx + 1]
            : null;
        var expectedPrevious = currentIdx > 0
            ? OrderStatusCatalog.WorkflowSteps[currentIdx - 1]
            : null;

        var isImmediateNext = expectedNext is not null &&
            string.Equals(targetStatus, expectedNext, StringComparison.Ordinal);
        var isImmediatePrevious = expectedPrevious is not null &&
            string.Equals(targetStatus, expectedPrevious, StringComparison.Ordinal);

        if (!isImmediateNext && !isImmediatePrevious)
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"Only immediate adjacent step is allowed. Current='{order.OrderStatus}', " +
                $"previous='{expectedPrevious ?? "(none)"}', next='{expectedNext ?? "(none)"}'.");
        }

        var previousStatus = order.OrderStatus;
        order.OrderStatus = targetStatus;

        if (isImmediateNext)
        {
            ApplyTransitionTimestamp(order, targetStatus);
        }
        else if (isImmediatePrevious)
        {
            ClearTransitionTimestamp(order, previousStatus);
        }

        await db.SaveChangesAsync(cancellationToken);

        var detail = await orderQueryService.GetOrderDetailAsync(orderId, cancellationToken);
        return detail ?? throw new InvalidOperationException("Failed to load order detail after status update.");
    }

    private static void ApplyTransitionTimestamp(SalesOrder order, string targetStatus)
    {
        var now = DateTime.Now;
        switch (targetStatus)
        {
            case "Ready for Pickup":
                order.PickupDate = now;
                break;
            case "Pickup Scheduled":
                order.PickupScheduledDate = now;
                break;
            case "Received":
                order.ReceivedDate = now;
                break;
            case "Ready to Ship":
                order.ReadyToShipDate = now;
                break;
            case "Ready to Invoice":
                order.InvoiceDate = now;
                break;
        }
    }

    private static void ClearTransitionTimestamp(SalesOrder order, string fromStatus)
    {
        switch (fromStatus)
        {
            case "Ready for Pickup":
                order.PickupDate = null;
                break;
            case "Pickup Scheduled":
                order.PickupScheduledDate = null;
                break;
            case "Received":
                order.ReceivedDate = null;
                break;
            case "Ready to Ship":
                order.ReadyToShipDate = null;
                break;
            case "Ready to Invoice":
                order.InvoiceDate = null;
                break;
        }
    }
}

