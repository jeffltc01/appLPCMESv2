using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;

namespace LPCylinderMES.Api.Tests;

public class RolePermissionServiceTests
{
    private readonly RolePermissionService _service = new();

    [Fact]
    public void EnsureStatusTransitionAllowed_OfficeToInvoiceReady_Allows()
    {
        _service.EnsureStatusTransitionAllowed(
            "Office",
            OrderStatusCatalog.DispatchedOrPickupReleased,
            OrderStatusCatalog.InvoiceReady,
            isManualOrEmergency: false);
    }

    [Fact]
    public void EnsureStatusTransitionAllowed_TransportationToInvoiced_ThrowsForbidden()
    {
        var ex = Assert.Throws<ServiceException>(() => _service.EnsureStatusTransitionAllowed(
            "Transportation",
            OrderStatusCatalog.InvoiceReady,
            OrderStatusCatalog.Invoiced,
            isManualOrEmergency: false));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public void EnsureStatusTransitionAllowed_ManualEmergencyByOffice_ThrowsForbidden()
    {
        var ex = Assert.Throws<ServiceException>(() => _service.EnsureStatusTransitionAllowed(
            "Office",
            OrderStatusCatalog.Draft,
            OrderStatusCatalog.ReceivedPendingReconciliation,
            isManualOrEmergency: true));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public void EnsureApplyHoldAllowed_QualityHoldByOffice_ThrowsForbidden()
    {
        var ex = Assert.Throws<ServiceException>(() => _service.EnsureApplyHoldAllowed(
            "Office",
            OrderStatusCatalog.OnHoldQuality));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public void EnsureApplyHoldAllowed_QualityHoldByQuality_Allows()
    {
        _service.EnsureApplyHoldAllowed("Quality", OrderStatusCatalog.OnHoldQuality);
    }

    [Fact]
    public void EnsureClearHoldAllowed_CrossFunctionByOffice_ThrowsForbidden()
    {
        var ex = Assert.Throws<ServiceException>(() => _service.EnsureClearHoldAllowed(
            "Office",
            OrderStatusCatalog.OnHoldQuality,
            "Quality"));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public void EnsureClearHoldAllowed_CrossFunctionBySupervisor_Allows()
    {
        _service.EnsureClearHoldAllowed(
            "Supervisor",
            OrderStatusCatalog.OnHoldQuality,
            "Quality");
    }
}
