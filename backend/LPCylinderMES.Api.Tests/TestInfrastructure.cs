using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Tests;

internal static class TestInfrastructure
{
    public static LpcAppsDbContext CreateDbContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<LpcAppsDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        return new LpcAppsDbContext(options);
    }

    public static OrderDraftDetailDto CreateOrderDraftDetail(int id, string status) =>
        new(
            id,
            $"SO-{id}",
            DateOnly.FromDateTime(DateTime.Today),
            status,
            DateOnly.FromDateTime(DateTime.Today),
            null,
            null,
            null,
            null,
            null,
            1,
            "Customer",
            1,
            "Site",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            new List<OrderLineDto>(),
            null,
            null,
            null);
}

internal sealed class FakeOrderQueryService : IOrderQueryService
{
    public Func<int, CancellationToken, Task<OrderDraftDetailDto?>>? GetOrderDetailHandler { get; set; }
    public Func<int, CancellationToken, Task<ReceivingOrderDetailDto?>>? GetReceivingDetailHandler { get; set; }

    public Task<PaginatedResponse<OrderDraftListDto>> GetOrdersAsync(
        int page, int pageSize, string? search, string? status, int? customerId, DateOnly? dateFrom, DateOnly? dateTo, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<OrderDraftDetailDto?> GetOrderDetailAsync(int id, CancellationToken cancellationToken = default) =>
        GetOrderDetailHandler?.Invoke(id, cancellationToken) ?? Task.FromResult<OrderDraftDetailDto?>(null);

    public Task<PaginatedResponse<TransportBoardItemDto>> GetTransportBoardAsync(
        int page, int pageSize, string? search, string? movementType, string? status, int? siteId, string? carrier, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<List<string>> GetStatusesAsync(CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<List<ReceivingOrderListItemDto>> GetReceivingQueueAsync(CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<List<ProductionOrderListItemDto>> GetProductionQueueAsync(CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();
    public Task<List<ProductionOrderListItemDto>> GetPendingRouteReviewQueueAsync(CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();
    public Task<List<ProductionOrderListItemDto>> GetPendingSupervisorReviewQueueAsync(CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<ReceivingOrderDetailDto?> GetReceivingDetailAsync(int id, CancellationToken cancellationToken = default) =>
        GetReceivingDetailHandler?.Invoke(id, cancellationToken) ?? Task.FromResult<ReceivingOrderDetailDto?>(null);

    public Task<ProductionOrderDetailDto?> GetProductionDetailAsync(int id, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();
}

internal sealed class FakeOrderPolicyService : IOrderPolicyService
{
    public Func<string, int?, int?, string, string>? DecisionValueResolver { get; set; }
    public Func<string, int?, int?, bool, bool>? DecisionFlagResolver { get; set; }

    public Task<string> GetDecisionValueAsync(string decisionKey, int? siteId, int? customerId, string defaultValue, CancellationToken cancellationToken = default)
    {
        var value = DecisionValueResolver?.Invoke(decisionKey, siteId, customerId, defaultValue) ?? defaultValue;
        return Task.FromResult(value);
    }

    public Task<bool> GetDecisionFlagAsync(string decisionKey, int? siteId, int? customerId, bool defaultValue, CancellationToken cancellationToken = default)
    {
        var value = DecisionFlagResolver?.Invoke(decisionKey, siteId, customerId, defaultValue) ?? defaultValue;
        return Task.FromResult(value);
    }

    public Task<List<DecisionPolicyEntryDto>> GetPoliciesAsync(int? policyVersion, CancellationToken cancellationToken = default) =>
        Task.FromResult(new List<DecisionPolicyEntryDto>());

    public Task<DecisionPolicyEntryDto> UpsertPolicyAsync(string decisionKey, UpsertDecisionPolicyDto dto, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<List<DecisionSignoffDto>> GetSignoffsAsync(int policyVersion, CancellationToken cancellationToken = default) =>
        Task.FromResult(new List<DecisionSignoffDto>());

    public Task<DecisionSignoffDto> AddSignoffAsync(CreateDecisionSignoffDto dto, CancellationToken cancellationToken = default) =>
        Task.FromResult(new DecisionSignoffDto(
            dto.PolicyVersion,
            dto.FunctionRole,
            true,
            dto.ApprovedByEmpNo,
            DateTime.UtcNow,
            dto.Notes));

    public Task<PolicyActivationResultDto> ActivatePolicyVersionAsync(int policyVersion, CancellationToken cancellationToken = default) =>
        Task.FromResult(new PolicyActivationResultDto(policyVersion, true, new List<string>()));

    public Task<List<PromiseReasonPolicyDto>> GetPromiseReasonPoliciesAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(new List<PromiseReasonPolicyDto>());

    public Task<PromiseReasonPolicyDto> UpsertPromiseReasonPolicyAsync(UpsertPromiseReasonPolicyDto dto, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<List<StatusReasonCodeDto>> GetStatusReasonCodesAsync(string? overlayType = null, CancellationToken cancellationToken = default) =>
        Task.FromResult(new List<StatusReasonCodeDto>());

    public Task<StatusReasonCodeDto> UpsertStatusReasonCodeAsync(int? id, UpsertStatusReasonCodeDto dto, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task DeleteStatusReasonCodeAsync(int id, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}

internal sealed class FakeInvoiceStagingService : IInvoiceStagingService
{
    public Func<SalesOrder, string, string?, InvoiceStagingSubmissionResult>? SubmitHandler { get; set; }

    public Task<InvoiceStagingSubmissionResult> SubmitToStagingAsync(
        SalesOrder order,
        string correlationId,
        string? submittedByEmpNo,
        CancellationToken cancellationToken = default)
    {
        var result = SubmitHandler?.Invoke(order, correlationId, submittedByEmpNo) ??
                     new InvoiceStagingSubmissionResult(true, "PendingAck", null, null);
        return Task.FromResult(result);
    }
}

