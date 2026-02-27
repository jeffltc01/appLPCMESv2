using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;

namespace LPCylinderMES.Api.Services;

public interface IOrderPolicyService
{
    Task<string> GetDecisionValueAsync(string decisionKey, int? siteId, int? customerId, string defaultValue, CancellationToken cancellationToken = default);
    Task<bool> GetDecisionFlagAsync(string decisionKey, int? siteId, int? customerId, bool defaultValue, CancellationToken cancellationToken = default);
    Task<List<DecisionPolicyEntryDto>> GetPoliciesAsync(int? policyVersion, CancellationToken cancellationToken = default);
    Task<DecisionPolicyEntryDto> UpsertPolicyAsync(string decisionKey, UpsertDecisionPolicyDto dto, CancellationToken cancellationToken = default);
    Task<List<DecisionSignoffDto>> GetSignoffsAsync(int policyVersion, CancellationToken cancellationToken = default);
    Task<DecisionSignoffDto> AddSignoffAsync(CreateDecisionSignoffDto dto, CancellationToken cancellationToken = default);
    Task<PolicyActivationResultDto> ActivatePolicyVersionAsync(int policyVersion, CancellationToken cancellationToken = default);
    Task<List<PromiseReasonPolicyDto>> GetPromiseReasonPoliciesAsync(CancellationToken cancellationToken = default);
    Task<PromiseReasonPolicyDto> UpsertPromiseReasonPolicyAsync(UpsertPromiseReasonPolicyDto dto, CancellationToken cancellationToken = default);
}
