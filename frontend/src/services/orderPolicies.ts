import { api } from "./api";
import type {
  CreateDecisionSignoffRequest,
  DecisionPolicyEntry,
  DecisionSignoff,
  PolicyActivationResult,
  UpsertDecisionPolicyRequest,
} from "../types/policy";

export const orderPoliciesApi = {
  list: (policyVersion?: number) =>
    api.get<DecisionPolicyEntry[]>(
      `/order-policy/decisions${policyVersion ? `?policyVersion=${policyVersion}` : ""}`
    ),

  upsert: (decisionKey: string, payload: UpsertDecisionPolicyRequest) =>
    api.put<DecisionPolicyEntry>(
      `/order-policy/decisions/${encodeURIComponent(decisionKey)}`,
      payload
    ),

  signoffs: (policyVersion: number) =>
    api.get<DecisionSignoff[]>(`/order-policy/signoffs/${policyVersion}`),

  addSignoff: (payload: CreateDecisionSignoffRequest) =>
    api.post<DecisionSignoff>("/order-policy/signoffs", payload),

  activate: (policyVersion: number) =>
    api.post<PolicyActivationResult>(`/order-policy/activate/${policyVersion}`, {}),
};
