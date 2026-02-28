export interface TabletSetupConfig {
  version: 1;
  siteId: number;
  workCenterId: number;
  workCenterCode: string;
  workCenterName: string;
  operatorEmpNo: string;
  deviceId: string;
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
    return parsed as TabletSetupConfig;
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
