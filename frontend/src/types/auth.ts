export interface OperatorAssignment {
  siteId: number;
  siteName: string;
  workCenterId: number;
  workCenterCode: string;
  workCenterName: string;
}

export interface OperatorPreLoginResponse {
  empNo: string;
  displayName: string;
  passwordRequired: boolean;
  assignments: OperatorAssignment[];
}

export interface AuthSession {
  token: string;
  expiresUtc: string;
  authMethod: string;
  userId: number;
  empNo: string;
  displayName: string;
  siteId: number | null;
  siteName: string | null;
  workCenterId: number | null;
  workCenterCode: string | null;
  workCenterName: string | null;
  roles: string[];
}
