import {
  createLightTheme,
  createDarkTheme,
  type BrandVariants,
  type Theme,
} from "@fluentui/react-components";

const lpCylinderBrand: BrandVariants = {
  10: "#050a10",
  20: "#0a1520",
  30: "#0e1f30",
  40: "#123046",
  50: "#1a4060",
  60: "#1f4f78",
  70: "#256090",
  80: "#2b70a8",
  90: "#3180be",
  100: "#3e90cc",
  110: "#5aa0d6",
  120: "#76b0de",
  130: "#92c0e6",
  140: "#aed0ee",
  150: "#cae0f4",
  160: "#e6f0fa",
};

export const lpCylinderLightTheme: Theme = {
  ...createLightTheme(lpCylinderBrand),
  fontFamilyBase:
    '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  borderRadiusSmall: "0px",
  borderRadiusMedium: "0px",
  borderRadiusLarge: "0px",
  borderRadiusXLarge: "0px",
};

export const lpCylinderDarkTheme: Theme = {
  ...createDarkTheme(lpCylinderBrand),
  fontFamilyBase:
    '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  borderRadiusSmall: "0px",
  borderRadiusMedium: "0px",
  borderRadiusLarge: "0px",
  borderRadiusXLarge: "0px",
};

export const brandColors = {
  primaryDark: "#123046",
  primaryNavy: "#132046",
  brandBlue: "#2b3b84",
  secondaryBlue: "#017cc5",
  accentBlue: "#0095eb",
  linkHoverBlue: "#007cc3",
  headerBackground: "#000119",
  pageBackground: "#FCFCFC",
  lightBlueTint: "#e0eff8",
  themeRed: "#aa121f",
} as const;
