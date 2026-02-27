using System.Reflection;
using LPCylinderMES.Api.Controllers;
using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.Services;

namespace LPCylinderMES.Api.Tests;

public class ControllerServiceExtractionTests
{
    [Fact]
    public void OrderLinesController_DependsOnOrderLineService()
    {
        var ctor = typeof(OrderLinesController).GetConstructors().Single();
        var parameterTypes = ctor.GetParameters().Select(p => p.ParameterType).ToList();

        Assert.Contains(typeof(IOrderLineService), parameterTypes);
        Assert.DoesNotContain(typeof(LpcAppsDbContext), parameterTypes);
    }

    [Fact]
    public void OrdersController_DependsOnCoreOrderServices()
    {
        var ctor = typeof(OrdersController).GetConstructors().Single();
        var parameterTypes = ctor.GetParameters().Select(p => p.ParameterType).ToList();

        Assert.Contains(typeof(IOrderQueryService), parameterTypes);
        Assert.Contains(typeof(IOrderWorkflowService), parameterTypes);
        Assert.Contains(typeof(IReceivingService), parameterTypes);
        Assert.Contains(typeof(IOrderAttachmentService), parameterTypes);
    }

    [Fact]
    public void SetupController_DependsOnSetupRoutingService()
    {
        var ctor = typeof(SetupController).GetConstructors().Single();
        var parameterTypes = ctor.GetParameters().Select(p => p.ParameterType).ToList();

        Assert.Contains(typeof(ISetupRoutingService), parameterTypes);
        Assert.DoesNotContain(typeof(LpcAppsDbContext), parameterTypes);
    }

    [Fact]
    public void OrderStatusCatalog_DefinesExpectedWorkflow()
    {
        Assert.Equal(OrderStatusCatalog.New, OrderStatusCatalog.WorkflowSteps.First());
        Assert.Equal(OrderStatusCatalog.ReadyToInvoice, OrderStatusCatalog.WorkflowSteps.Last());
        Assert.Contains(OrderStatusCatalog.Received, OrderStatusCatalog.WorkflowSteps);
        Assert.Contains(OrderStatusCatalog.ReadyToShip, OrderStatusCatalog.ShipmentStatuses);
        Assert.Contains(OrderStatusCatalog.ReadyForPickup, OrderStatusCatalog.TransportBoardVisibleStatuses);
        Assert.Contains(OrderStatusCatalog.PickupScheduled, OrderStatusCatalog.TransportEditableStatuses);
        Assert.Equal(
            "Awaiting Pickup Scheduling",
            OrderStatusCatalog.MetadataByKey[OrderStatusCatalog.ReadyForPickup].DisplayLabel);
    }
}

