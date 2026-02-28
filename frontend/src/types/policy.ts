export interface DecisionPolicyEntry {
  decisionKey: string;
  policyVersion: number;
  scopeType: string;
  siteId: number | null;
  customerId: number | null;
  policyValue: string;
  isActive: boolean;
  updatedUtc: string;
  updatedByEmpNo: string | null;
  notes: string | null;
}

export interface UpsertDecisionPolicyRequest {
  policyVersion: number;
  scopeType: string;
  siteId?: number | null;
  customerId?: number | null;
  policyValue: string;
  isActive: boolean;
  updatedByEmpNo?: string | null;
  notes?: string | null;
}

export interface DecisionSignoff {
  policyVersion: number;
  functionRole: string;
  isApproved: boolean;
  approvedByEmpNo: string | null;
  approvedUtc: string | null;
  notes: string | null;
}

export interface CreateDecisionSignoffRequest {
  policyVersion: number;
  functionRole: string;
  approvedByEmpNo: string;
  notes?: string | null;
}

export interface PolicyActivationResult {
  policyVersion: number;
  activated: boolean;
  missingFunctions: string[];
}

export interface StatusReasonCode {
  id: number;
  overlayType: string;
  codeName: string;
  updatedUtc: string;
  updatedByEmpNo: string | null;
}

export interface UpsertStatusReasonCodeRequest {
  overlayType: string;
  codeName: string;
  updatedByEmpNo?: string | null;
}
