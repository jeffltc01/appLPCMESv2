using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Tests;

public class OrderWorkflowServiceTests
{
    [Fact]
    public async Task SubmitInvoiceAsync_WithAttachmentSkipReason_TransitionsToInvoiced()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(SubmitInvoiceAsync_WithAttachmentSkipReason_TransitionsToInvoiced));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 20,
            SalesOrderNo = "SO-INV-1",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyToInvoice,
            OrderLifecycleStatus = OrderStatusCatalog.InvoiceReady,
            CustomerId = 1,
            SiteId = 1,
            OrderAttachments =
            {
                new OrderAttachment
                {
                    Id = 201,
                    FileName = "test.pdf",
                    BlobPath = "orders/20/test.pdf",
                    ContentType = "application/pdf",
                    SizeBytes = 100,
                    CreatedAtUtc = DateTime.UtcNow,
                },
            },
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.ReadyToInvoice)),
        };
        var service = new OrderWorkflowService(db, queries);

        await service.SubmitInvoiceAsync(20, new SubmitInvoiceDto(
            true,
            false,
            null,
            null,
            "Customer requested no email",
            "corr-test-20",
            "EMP001"));

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 20);
        Assert.Equal(OrderStatusCatalog.Invoiced, order.OrderLifecycleStatus);
        Assert.Equal("corr-test-20", order.InvoiceSubmissionCorrelationId);
    }

    [Fact]
    public async Task SubmitInvoiceAsync_WithAttachmentsWithoutSkipReason_ThrowsBadRequest()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(SubmitInvoiceAsync_WithAttachmentsWithoutSkipReason_ThrowsBadRequest));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 21,
            SalesOrderNo = "SO-INV-2",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyToInvoice,
            OrderLifecycleStatus = OrderStatusCatalog.InvoiceReady,
            CustomerId = 1,
            SiteId = 1,
            OrderAttachments =
            {
                new OrderAttachment
                {
                    Id = 211,
                    FileName = "test.pdf",
                    BlobPath = "orders/21/test.pdf",
                    ContentType = "application/pdf",
                    SizeBytes = 100,
                    CreatedAtUtc = DateTime.UtcNow,
                },
            },
        });
        await db.SaveChangesAsync();

        var service = new OrderWorkflowService(db, new FakeOrderQueryService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.SubmitInvoiceAsync(21, new SubmitInvoiceDto(
            true,
            false,
            null,
            null,
            null,
            null,
            "EMP001")));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task AdvanceStatusAsync_LifecycleTransition_UpdatesLifecycleAndLegacyStatus()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdvanceStatusAsync_LifecycleTransition_UpdatesLifecycleAndLegacyStatus));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 10,
            SalesOrderNo = "SO-LIFE-1",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            OrderLifecycleStatus = OrderStatusCatalog.Draft,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.ReadyForPickup)),
        };

        var service = new OrderWorkflowService(db, queries);
        await service.AdvanceStatusAsync(10, OrderStatusCatalog.InboundLogisticsPlanned);

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 10);
        Assert.Equal(OrderStatusCatalog.InboundLogisticsPlanned, order.OrderLifecycleStatus);
        Assert.Equal(OrderStatusCatalog.ReadyForPickup, order.OrderStatus);
        Assert.NotNull(order.StatusUpdatedUtc);
    }

    [Fact]
    public async Task AdvanceStatusAsync_LifecycleHoldOverlay_BlocksForwardTransition()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdvanceStatusAsync_LifecycleHoldOverlay_BlocksForwardTransition));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 11,
            SalesOrderNo = "SO-LIFE-2",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyForPickup,
            OrderLifecycleStatus = OrderStatusCatalog.InboundLogisticsPlanned,
            HoldOverlay = OrderStatusCatalog.OnHoldCustomer,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var service = new OrderWorkflowService(db, new FakeOrderQueryService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.AdvanceStatusAsync(11, OrderStatusCatalog.InboundInTransit));
        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task AdvanceStatusAsync_ReworkOpen_BlocksInvoiceReadyAndInvoiced()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdvanceStatusAsync_ReworkOpen_BlocksInvoiceReadyAndInvoiced));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 12,
            SalesOrderNo = "SO-LIFE-3",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyToInvoice,
            OrderLifecycleStatus = OrderStatusCatalog.InvoiceReady,
            HoldOverlay = OrderStatusCatalog.ReworkOpen,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var service = new OrderWorkflowService(db, new FakeOrderQueryService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.AdvanceStatusAsync(12, OrderStatusCatalog.Invoiced));
        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task AdvanceStatusAsync_InvoicedRequiresReviewAttachmentStepAndCorrelationId()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdvanceStatusAsync_InvoicedRequiresReviewAttachmentStepAndCorrelationId));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 13,
            SalesOrderNo = "SO-LIFE-4",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyToInvoice,
            OrderLifecycleStatus = OrderStatusCatalog.InvoiceReady,
            InvoiceReviewCompletedUtc = DateTime.UtcNow,
            AttachmentEmailSent = true,
            InvoiceSubmissionCorrelationId = "corr-123",
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.ReadyToInvoice)),
        };

        var service = new OrderWorkflowService(db, queries);
        await service.AdvanceStatusAsync(13, OrderStatusCatalog.Invoiced);

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 13);
        Assert.Equal(OrderStatusCatalog.Invoiced, order.OrderLifecycleStatus);
    }

    [Fact]
    public async Task AdvanceStatusAsync_ImmediateNext_SetsStatusAndTimestamp()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdvanceStatusAsync_ImmediateNext_SetsStatusAndTimestamp));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 1,
            SalesOrderNo = "SO-1",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.ReadyForPickup)),
        };

        var service = new OrderWorkflowService(db, queries);
        var result = await service.AdvanceStatusAsync(1, OrderStatusCatalog.ReadyForPickup);

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 1);
        Assert.Equal(OrderStatusCatalog.ReadyForPickup, order.OrderStatus);
        Assert.NotNull(order.PickupDate);
        Assert.Equal(OrderStatusCatalog.ReadyForPickup, result.OrderStatus);
    }

    [Fact]
    public async Task AdvanceStatusAsync_NonAdjacent_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdvanceStatusAsync_NonAdjacent_ThrowsConflict));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 2,
            SalesOrderNo = "SO-2",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var service = new OrderWorkflowService(db, new FakeOrderQueryService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.AdvanceStatusAsync(2, OrderStatusCatalog.Received));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task AdvanceStatusAsync_MoveBack_ClearsPreviousStatusTimestamp()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdvanceStatusAsync_MoveBack_ClearsPreviousStatusTimestamp));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 3,
            SalesOrderNo = "SO-3",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyToShip,
            ReadyToShipDate = DateTime.UtcNow,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.Received)),
        };

        var service = new OrderWorkflowService(db, queries);
        await service.AdvanceStatusAsync(3, OrderStatusCatalog.Received);

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 3);
        Assert.Equal(OrderStatusCatalog.Received, order.OrderStatus);
        Assert.Null(order.ReadyToShipDate);
    }
}

