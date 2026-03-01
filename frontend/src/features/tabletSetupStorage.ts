export interface TabletSetupConfig {
  version: 1;
  siteId: number;
  workCenterId: number;
  workCenterCode: string;
  workCenterName: string;
  operatorEmpNo: string;
  deviceId: string;
  lockOperatorToLoggedInUser: boolean;
  updatedAt: string;
}

export const TABLET_SETUP_STORAGE_KEY = "lpc.mes.tabletSetup.v1";

export function readTabletSetup(): TabletSetupConfig | null {
  const raw = window.localStorage.getItem(TABLET_SETUP_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TabletSetupConfig>;
    const lockOperatorToLoggedInUser =
      typeof parsed.lockOperatorToLoggedInUser === "boolean" ? parsed.lockOperatorToLoggedInUser : false;
    if (
      parsed.version !== 1 ||
      typeof parsed.siteId !== "number" ||
      typeof parsed.workCenterId !== "number" ||
      typeof parsed.workCenterCode !== "string" ||
      typeof parsed.workCenterName !== "string" ||
      typeof parsed.operatorEmpNo !== "string" ||
      typeof parsed.deviceId !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }
    return {
      version: 1,
      siteId: parsed.siteId,
      workCenterId: parsed.workCenterId,
      workCenterCode: parsed.workCenterCode,
      workCenterName: parsed.workCenterName,
      operatorEmpNo: parsed.operatorEmpNo,
      deviceId: parsed.deviceId,
      lockOperatorToLoggedInUser,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function saveTabletSetup(
  data: Omit<TabletSetupConfig, "version" | "updatedAt">
): TabletSetupConfig {
  const config: TabletSetupConfig = {
    version: 1,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(TABLET_SETUP_STORAGE_KEY, JSON.stringify(config));
  return config;
}

export function clearTabletSetup() {
  window.localStorage.removeItem(TABLET_SETUP_STORAGE_KEY);
}
