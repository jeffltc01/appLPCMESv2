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
    public void OrderStatusCatalog_DefinesExpectedWorkflow()
    {
        Assert.Equal("New", OrderStatusCatalog.WorkflowSteps.First());
        Assert.Equal("Ready to Invoice", OrderStatusCatalog.WorkflowSteps.Last());
        Assert.Contains("Received", OrderStatusCatalog.WorkflowSteps);
        Assert.Contains("Ready to Ship", OrderStatusCatalog.ShipmentStatuses);
        Assert.Contains("Ready for Pickup", OrderStatusCatalog.TransportBoardVisibleStatuses);
        Assert.Contains("Pickup Scheduled", OrderStatusCatalog.TransportEditableStatuses);
    }
}

