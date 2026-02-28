using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Tests;

public class OrderPolicyServiceTests
{
    [Fact]
    public async Task UpsertStatusReasonCodeAsync_CreateAndFilterByOverlayType()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(UpsertStatusReasonCodeAsync_CreateAndFilterByOverlayType));
        var service = new OrderPolicyService(db);

        await service.UpsertStatusReasonCodeAsync(
            null,
            new("OnHoldCustomer", "CustomerNotReadyForPickup", "EMP001"));
        await service.UpsertStatusReasonCodeAsync(
            null,
            new("OnHoldQuality", "QualityInspectionOpen", "EMP001"));

        var customerReasons = await service.GetStatusReasonCodesAsync("OnHoldCustomer");
        Assert.Single(customerReasons);
        Assert.Equal("CustomerNotReadyForPickup", customerReasons[0].CodeName);
    }

    [Fact]
    public async Task UpsertStatusReasonCodeAsync_DuplicateByOverlayType_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(UpsertStatusReasonCodeAsync_DuplicateByOverlayType_ThrowsConflict));
        db.StatusReasonCodes.Add(new StatusReasonCode
        {
            OverlayType = "OnHoldCustomer",
            CodeName = "CustomerNotReadyForPickup",
            UpdatedUtc = DateTime.UtcNow,
            UpdatedByEmpNo = "SYSTEM",
        });
        await db.SaveChangesAsync();

        var service = new OrderPolicyService(db);
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.UpsertStatusReasonCodeAsync(
                null,
                new("OnHoldCustomer", "CustomerNotReadyForPickup", "EMP002")));
        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task DeleteStatusReasonCodeAsync_RemovesReasonCode()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(DeleteStatusReasonCodeAsync_RemovesReasonCode));
        db.StatusReasonCodes.Add(new StatusReasonCode
        {
            OverlayType = "OnHoldQuality",
            CodeName = "QualityInspectionOpen",
            UpdatedUtc = DateTime.UtcNow,
            UpdatedByEmpNo = "SYSTEM",
        });
        await db.SaveChangesAsync();

        var id = await db.StatusReasonCodes.Select(r => r.Id).SingleAsync();
        var service = new OrderPolicyService(db);
        await service.DeleteStatusReasonCodeAsync(id);

        Assert.False(await db.StatusReasonCodes.AnyAsync(r => r.Id == id));
    }
}
