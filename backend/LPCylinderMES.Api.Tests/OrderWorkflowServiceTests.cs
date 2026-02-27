using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Tests;

public class OrderWorkflowServiceTests
{
    [Fact]
    public async Task UpsertPromiseCommitmentAsync_FirstCommit_SetsCanonicalDatesAndAppendsEvent()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(UpsertPromiseCommitmentAsync_FirstCommit_SetsCanonicalDatesAndAppendsEvent));
        db.PromiseReasonPolicies.Add(new PromiseReasonPolicy
        {
            ReasonCode = "Capacity",
            Description = "Capacity issue",
            OwnerRole = "Office",
            AllowedNotificationPolicies = "Notified,DeferredNotification,InternalOnly",
            IsActive = true,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 901,
            SalesOrderNo = "SO-PROM-901",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            OrderLifecycleStatus = OrderStatusCatalog.Draft,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.New)),
        };
        var service = new OrderWorkflowService(db, queries, new FakeOrderPolicyService());
        var requestedUtc = DateTime.UtcNow.Date.AddDays(5);
        var committedUtc = DateTime.UtcNow.Date.AddDays(7);

        await service.UpsertPromiseCommitmentAsync(901, new UpsertPromiseCommitmentDto(
            requestedUtc,
            committedUtc,
            "Office",
            "EMP901",
            "Capacity",
            "Initial commitment to customer.",
            null,
            null,
            null,
            null));

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 901);
        Assert.Equal(requestedUtc, order.RequestedDateUtc);
        Assert.Equal(committedUtc, order.PromisedDateUtc);
        Assert.Equal(committedUtc, order.CurrentCommittedDateUtc);
        Assert.Equal(0, order.PromiseRevisionCount);
        var events = await db.OrderPromiseChangeEvents.Where(e => e.OrderId == 901).ToListAsync();
        Assert.Single(events);
        Assert.Equal("PromiseDateCommitted", events[0].EventType);
    }

    [Fact]
    public async Task UpsertPromiseCommitmentAsync_RevisionWithoutReason_ThrowsBadRequest()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(UpsertPromiseCommitmentAsync_RevisionWithoutReason_ThrowsBadRequest));
        db.PromiseReasonPolicies.Add(new PromiseReasonPolicy
        {
            ReasonCode = "Capacity",
            Description = "Capacity issue",
            OwnerRole = "Office",
            AllowedNotificationPolicies = "Notified,DeferredNotification,InternalOnly",
            IsActive = true,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 902,
            SalesOrderNo = "SO-PROM-902",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyToShip,
            OrderLifecycleStatus = OrderStatusCatalog.ProductionComplete,
            PromisedDateUtc = DateTime.UtcNow.Date.AddDays(2),
            CurrentCommittedDateUtc = DateTime.UtcNow.Date.AddDays(2),
            PromiseRevisionCount = 0,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var service = new OrderWorkflowService(db, new FakeOrderQueryService(), new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.UpsertPromiseCommitmentAsync(902, new UpsertPromiseCommitmentDto(
            null,
            DateTime.UtcNow.Date.AddDays(3),
            "Office",
            "EMP902",
            null,
            "Slip by one day",
            "DeferredNotification",
            "Email",
            null,
            null)));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task ClassifyPromiseMissAsync_SetsMissReasonAndAppendsEvent()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ClassifyPromiseMissAsync_SetsMissReasonAndAppendsEvent));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 903,
            SalesOrderNo = "SO-PROM-903",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyToInvoice,
            OrderLifecycleStatus = OrderStatusCatalog.DispatchedOrPickupReleased,
            CurrentCommittedDateUtc = DateTime.UtcNow.AddDays(-1),
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.ReadyToInvoice)),
        };
        var service = new OrderWorkflowService(db, queries, new FakeOrderPolicyService());
        await service.ClassifyPromiseMissAsync(903, new ClassifyPromiseMissDto(
            "Logistics",
            "Office",
            "EMP903",
            "Carrier delay",
            "Notified",
            "Phone",
            DateTime.UtcNow,
            "EMP903"));

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 903);
        Assert.Equal("Logistics", order.PromiseMissReasonCode);
        var events = await db.OrderPromiseChangeEvents.Where(e => e.OrderId == 903).ToListAsync();
        Assert.Contains(events, e => e.EventType == "PromiseMissClassified");
        Assert.Contains(events, e => e.EventType == "CustomerCommitmentNotificationRecorded");
    }

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
        var service = new OrderWorkflowService(db, queries, new FakeOrderPolicyService(), new FakeInvoiceStagingService());

        await service.SubmitInvoiceAsync(20, new SubmitInvoiceDto(
            true,
            true,
            true,
            true,
            false,
            null,
            null,
            "Customer requested no email",
            "corr-test-20",
            "EMP001",
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

        var service = new OrderWorkflowService(db, new FakeOrderQueryService(), new FakeOrderPolicyService(), new FakeInvoiceStagingService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.SubmitInvoiceAsync(21, new SubmitInvoiceDto(
            true,
            true,
            true,
            true,
            false,
            null,
            null,
            null,
            null,
            "EMP001",
            "EMP001")));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task SubmitInvoiceAsync_WhenStagingFails_RemainsInvoiceReadyAndPersistsAudit()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(SubmitInvoiceAsync_WhenStagingFails_RemainsInvoiceReadyAndPersistsAudit));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 22,
            SalesOrderNo = "SO-INV-3",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyToInvoice,
            OrderLifecycleStatus = OrderStatusCatalog.InvoiceReady,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var service = new OrderWorkflowService(
            db,
            new FakeOrderQueryService(),
            new FakeOrderPolicyService(),
            new FakeInvoiceStagingService
            {
                SubmitHandler = (_, _, _) => new InvoiceStagingSubmissionResult(false, "Failed", null, "SP timeout"),
            });

        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.SubmitInvoiceAsync(22, new SubmitInvoiceDto(
            true,
            true,
            true,
            true,
            false,
            null,
            null,
            "No attachments available",
            "corr-test-22",
            "EMP001",
            "EMP001")));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        var order = await db.SalesOrders.FirstAsync(o => o.Id == 22);
        Assert.Equal(OrderStatusCatalog.InvoiceReady, order.OrderLifecycleStatus);
        Assert.Equal("Failed", order.InvoiceStagingResult);
        var audit = await db.OrderInvoiceSubmissionAudits.SingleAsync(a => a.OrderId == 22);
        Assert.False(audit.IsSuccessHandoff);
        Assert.Equal("corr-test-22", audit.InvoiceSubmissionCorrelationId);
    }

    [Fact]
    public async Task SubmitInvoiceAsync_NoAttachments_AutoSkipsAttachmentStep()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(SubmitInvoiceAsync_NoAttachments_AutoSkipsAttachmentStep));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 23,
            SalesOrderNo = "SO-INV-4",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyToInvoice,
            OrderLifecycleStatus = OrderStatusCatalog.InvoiceReady,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.ReadyToInvoice)),
        };
        var service = new OrderWorkflowService(db, queries, new FakeOrderPolicyService(), new FakeInvoiceStagingService());
        await service.SubmitInvoiceAsync(23, new SubmitInvoiceDto(
            true,
            true,
            true,
            true,
            false,
            null,
            null,
            null,
            "corr-test-23",
            "EMP001",
            "EMP001"));

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 23);
        Assert.Equal(OrderStatusCatalog.Invoiced, order.OrderLifecycleStatus);
        Assert.Equal("NoAttachmentsAvailable", order.AttachmentEmailSkipReason);
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
            OrderOrigin = "OfficeEntry",
            InboundMode = "LpcArrangedPickup",
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.ReadyForPickup)),
        };

        var service = new OrderWorkflowService(db, queries, new FakeOrderPolicyService());
        await service.AdvanceStatusAsync(10, OrderStatusCatalog.InboundLogisticsPlanned);

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 10);
        Assert.Equal(OrderStatusCatalog.InboundLogisticsPlanned, order.OrderLifecycleStatus);
        Assert.Equal(OrderStatusCatalog.ReadyForPickup, order.OrderStatus);
        Assert.NotNull(order.StatusUpdatedUtc);
    }

    [Fact]
    public async Task AdvanceStatusAsync_ToReadyForProduction_CreatesRouteInstances()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdvanceStatusAsync_ToReadyForProduction_CreatesRouteInstances));
        db.Items.Add(new Item { Id = 1101, ItemNo = "TNK-1101", ItemType = "Tank", RequiresSerialNumbers = 0 });
        db.WorkCenters.Add(new WorkCenter
        {
            Id = 1110,
            WorkCenterCode = "WC-1110",
            WorkCenterName = "Routing WC",
            SiteId = 1,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.RouteTemplates.Add(new RouteTemplate
        {
            Id = 1120,
            RouteTemplateCode = "RT-1120",
            RouteTemplateName = "Route 1120",
            IsActive = true,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
            Steps =
            {
                new RouteTemplateStep
                {
                    Id = 1121,
                    StepSequence = 1,
                    StepCode = "STEP-1",
                    StepName = "Prep",
                    WorkCenterId = 1110,
                    IsRequired = true,
                },
            },
        });
        db.RouteTemplateAssignments.Add(new RouteTemplateAssignment
        {
            Id = 1122,
            AssignmentName = "Global route",
            RouteTemplateId = 1120,
            IsActive = true,
            Priority = 1,
            RevisionNo = 1,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 1100,
            SalesOrderNo = "SO-1100",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.Received,
            OrderLifecycleStatus = OrderStatusCatalog.ReceivedPendingReconciliation,
            CustomerId = 1,
            SiteId = 1,
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 11001,
                    LineNo = 1,
                    ItemId = 1101,
                    QuantityAsOrdered = 1,
                    QuantityAsReceived = 1,
                    SalesOrderId = 1100,
                    SiteId = 1,
                },
            },
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(
                TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.Received)),
        };

        var service = new OrderWorkflowService(db, queries, new FakeOrderPolicyService());
        await service.AdvanceStatusAsync(1100, OrderStatusCatalog.ReadyForProduction);

        var routes = await db.OrderLineRouteInstances.Where(r => r.SalesOrderId == 1100).ToListAsync();
        Assert.Single(routes);
        Assert.Equal(1120, routes[0].RouteTemplateId);
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

        var service = new OrderWorkflowService(db, new FakeOrderQueryService(), new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.AdvanceStatusAsync(11, OrderStatusCatalog.InboundInTransit));
        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task AdvanceStatusAsync_DraftToReceivedPendingReconciliation_RequiresReasonAndNote()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdvanceStatusAsync_DraftToReceivedPendingReconciliation_RequiresReasonAndNote));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 111,
            SalesOrderNo = "SO-LIFE-111",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            OrderLifecycleStatus = OrderStatusCatalog.Draft,
            InboundMode = "CustomerDropoff",
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var service = new OrderWorkflowService(db, new FakeOrderQueryService(), new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.AdvanceStatusAsync(111, OrderStatusCatalog.ReceivedPendingReconciliation));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task AdvanceStatusAsync_DraftToReceivedPendingReconciliation_WithReasonAndNote_Succeeds()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdvanceStatusAsync_DraftToReceivedPendingReconciliation_WithReasonAndNote_Succeeds));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 112,
            SalesOrderNo = "SO-LIFE-112",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            OrderLifecycleStatus = OrderStatusCatalog.Draft,
            InboundMode = "CustomerDropoff",
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.Received)),
        };
        var service = new OrderWorkflowService(db, queries, new FakeOrderPolicyService());
        await service.AdvanceStatusAsync(
            112,
            OrderStatusCatalog.ReceivedPendingReconciliation,
            actingRole: "Receiving",
            reasonCode: "EmergencyManualReceive",
            note: "Customer arrived unscheduled with tanks on site.");

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 112);
        Assert.Equal(OrderStatusCatalog.ReceivedPendingReconciliation, order.OrderLifecycleStatus);
        Assert.Equal("EmergencyManualReceive", order.StatusReasonCode);
        Assert.Equal("Receiving", order.StatusOwnerRole);
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

        var service = new OrderWorkflowService(db, new FakeOrderQueryService(), new FakeOrderPolicyService());
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

        var service = new OrderWorkflowService(db, queries, new FakeOrderPolicyService());
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

        var service = new OrderWorkflowService(db, queries, new FakeOrderPolicyService());
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

        var service = new OrderWorkflowService(db, new FakeOrderQueryService(), new FakeOrderPolicyService());
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

        var service = new OrderWorkflowService(db, queries, new FakeOrderPolicyService());
        await service.AdvanceStatusAsync(3, OrderStatusCatalog.Received);

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 3);
        Assert.Equal(OrderStatusCatalog.Received, order.OrderStatus);
        Assert.Null(order.ReadyToShipDate);
    }

    [Fact]
    public async Task BackfillLifecycleStatusesAsync_InitializesMissingLifecycleStatuses()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(BackfillLifecycleStatusesAsync_InitializesMissingLifecycleStatuses));
        db.SalesOrders.AddRange(
            new SalesOrder
            {
                Id = 501,
                SalesOrderNo = "SO-501",
                OrderDate = DateOnly.FromDateTime(DateTime.Today),
                OrderStatus = OrderStatusCatalog.New,
                CustomerId = 1,
                SiteId = 1,
            },
            new SalesOrder
            {
                Id = 502,
                SalesOrderNo = "SO-502",
                OrderDate = DateOnly.FromDateTime(DateTime.Today),
                OrderStatus = OrderStatusCatalog.ReadyToShip,
                CustomerId = 1,
                SiteId = 1,
            },
            new SalesOrder
            {
                Id = 503,
                SalesOrderNo = "SO-503",
                OrderDate = DateOnly.FromDateTime(DateTime.Today),
                OrderStatus = OrderStatusCatalog.ReadyToInvoice,
                OrderLifecycleStatus = OrderStatusCatalog.InvoiceReady,
                CustomerId = 1,
                SiteId = 1,
            });
        await db.SaveChangesAsync();

        var service = new OrderWorkflowService(db, new FakeOrderQueryService(), new FakeOrderPolicyService());
        var result = await service.BackfillLifecycleStatusesAsync();

        Assert.Equal(3, result.TotalOrdersScanned);
        Assert.Equal(1, result.OrdersAlreadyInitialized);
        Assert.Equal(2, result.OrdersUpdated);
        Assert.False(result.DryRun);
        Assert.Equal(3, result.CandidateOrders);
        Assert.Equal(2, result.AuditRecordsWritten);
        Assert.NotNull(result.MigrationBatchId);

        var order501 = await db.SalesOrders.FirstAsync(o => o.Id == 501);
        var order502 = await db.SalesOrders.FirstAsync(o => o.Id == 502);
        Assert.Equal(OrderStatusCatalog.Draft, order501.OrderLifecycleStatus);
        Assert.Equal(OrderStatusCatalog.ProductionComplete, order502.OrderLifecycleStatus);
        Assert.Equal(2, await db.OrderLifecycleMigrationAudits.CountAsync());
    }

    [Fact]
    public async Task BackfillLifecycleStatusesAsync_DryRun_DoesNotPersistChanges()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(BackfillLifecycleStatusesAsync_DryRun_DoesNotPersistChanges));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 601,
            SalesOrderNo = "SO-601",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var service = new OrderWorkflowService(db, new FakeOrderQueryService(), new FakeOrderPolicyService());
        var result = await service.BackfillLifecycleStatusesAsync(dryRun: true);

        Assert.True(result.DryRun);
        Assert.Equal(1, result.OrdersUpdated);
        Assert.Equal(0, result.AuditRecordsWritten);
        Assert.Single(result.SampleDeltas);

        var order = await db.SalesOrders.AsNoTracking().FirstAsync(o => o.Id == 601);
        Assert.Null(order.OrderLifecycleStatus);
    }

    [Fact]
    public async Task BackfillLifecycleStatusesAsync_SalesMobileUnvalidated_UsesPendingValidation()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(BackfillLifecycleStatusesAsync_SalesMobileUnvalidated_UsesPendingValidation));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 602,
            SalesOrderNo = "SO-602",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            OrderOrigin = "SalesMobile",
            ValidatedUtc = null,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var service = new OrderWorkflowService(db, new FakeOrderQueryService(), new FakeOrderPolicyService());
        var result = await service.BackfillLifecycleStatusesAsync(dryRun: false, migratedBy: "EMP602", batchSize: 100);

        Assert.False(result.DryRun);
        Assert.Equal(1, result.OrdersUpdated);
        var order = await db.SalesOrders.FirstAsync(o => o.Id == 602);
        Assert.Equal(OrderStatusCatalog.PendingOrderEntryValidation, order.OrderLifecycleStatus);
        var audit = await db.OrderLifecycleMigrationAudits.SingleAsync(a => a.OrderId == 602);
        Assert.Equal("Rule11:SalesMobileNotValidated", audit.RuleApplied);
        Assert.Equal("EMP602", audit.MigratedBy);
    }

    [Fact]
    public async Task ApplyHoldAsync_OnHoldCustomerRequiresReadinessFields()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ApplyHoldAsync_OnHoldCustomerRequiresReadinessFields));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 701,
            SalesOrderNo = "SO-701",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyForPickup,
            OrderLifecycleStatus = OrderStatusCatalog.InboundLogisticsPlanned,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var service = new OrderWorkflowService(db, new FakeOrderQueryService(), new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.ApplyHoldAsync(
            701,
            new ApplyHoldDto(
                OrderStatusCatalog.OnHoldCustomer,
                "Transportation",
                "EMP001",
                "CustomerNotReadyForPickup",
                "Customer asked us to retry later",
                null,
                DateTime.UtcNow,
                "Receiver")));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task ApplyHoldAsync_OnHoldCustomerPersistsRequiredFields()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ApplyHoldAsync_OnHoldCustomerPersistsRequiredFields));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 702,
            SalesOrderNo = "SO-702",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyForPickup,
            OrderLifecycleStatus = OrderStatusCatalog.InboundLogisticsPlanned,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.ReadyForPickup)),
        };
        var service = new OrderWorkflowService(db, queries, new FakeOrderPolicyService());
        await service.ApplyHoldAsync(
            702,
            new ApplyHoldDto(
                OrderStatusCatalog.OnHoldCustomer,
                "Transportation",
                "EMP002",
                "CustomerNotReadyForPickup",
                "Retry in two days",
                DateTime.UtcNow.AddDays(2),
                DateTime.UtcNow,
                "Customer Planner"));

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 702);
        Assert.Equal(OrderStatusCatalog.OnHoldCustomer, order.HoldOverlay);
        Assert.Equal("CustomerNotReadyForPickup", order.StatusReasonCode);
        Assert.True(order.CustomerReadyRetryUtc.HasValue);
        Assert.True(order.CustomerReadyLastContactUtc.HasValue);
    }

    [Fact]
    public async Task ApplyHoldAsync_OnHoldCustomer_AllowsMissingContactName()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ApplyHoldAsync_OnHoldCustomer_AllowsMissingContactName));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 703,
            SalesOrderNo = "SO-703",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyForPickup,
            OrderLifecycleStatus = OrderStatusCatalog.InboundLogisticsPlanned,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.ReadyForPickup)),
        };
        var service = new OrderWorkflowService(db, queries, new FakeOrderPolicyService());
        await service.ApplyHoldAsync(
            703,
            new ApplyHoldDto(
                OrderStatusCatalog.OnHoldCustomer,
                "Transportation",
                "EMP003",
                "CustomerNotReadyForPickup",
                "Contact not provided by customer switchboard",
                DateTime.UtcNow.AddHours(4),
                DateTime.UtcNow,
                null));

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 703);
        Assert.Equal(OrderStatusCatalog.OnHoldCustomer, order.HoldOverlay);
        Assert.Null(order.CustomerReadyContactName);
    }
}

