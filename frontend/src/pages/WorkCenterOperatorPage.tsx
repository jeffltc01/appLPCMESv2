import { useEffect, useMemo, useState } from "react";
import {
  Body1,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Select,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import {
  Alert24Regular,
  ArrowUpload24Regular,
  Backspace24Filled,
  Building24Regular,
  Clock24Regular,
  Dismiss24Regular,
  List24Regular,
  Navigation24Regular,
  Person24Regular,
} from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { formatCurrentUserDisplayName } from "../auth/userDisplay";
import { orderLookupsApi, ordersApi } from "../services/orders";
import { ApiError } from "../services/api";
import { itemLookupsApi } from "../services/items";
import { readTabletSetup } from "../features/tabletSetupStorage";
import type { Lookup } from "../types/customer";
import type { ItemSizeLookup } from "../types/item";
import type {
  LineRouteExecution,
  OrderItemLookup,
  OrderRouteExecution,
  RouteStepExecution,
  StepMaterialUsage,
  WorkCenterQueueItem,
} from "../types/order";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#F5F5F5",
    padding: tokens.spacingHorizontalM,
    display: "grid",
    gap: tokens.spacingVerticalM,
    alignContent: "start",
  },
  topBar: {
    backgroundColor: "#123046",
    color: "#FFFFFF",
    borderRadius: "8px",
    padding: "10px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  topBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  hamburgerButton: {
    minHeight: "44px",
    minWidth: "44px",
    borderRadius: "8px",
    color: "#FFFFFF",
    border: "1px solid rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  topBarTitle: {
    fontSize: "32px",
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: "0.2px",
    "@media (max-width: 900px)": {
      fontSize: "24px",
    },
  },
  titleWithIcon: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  titleIcon: {
    fontSize: "28px",
    display: "inline-flex",
    alignItems: "center",
  },
  topBarMeta: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: "#FFFFFF",
    color: "#123046",
    borderRadius: "6px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 600,
  },
  chipContent: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  chipIcon: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "14px",
  },
  tabletActions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  bodyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
    alignItems: "start",
    "@media (max-width: 1100px)": {
      gridTemplateColumns: "1fr",
    },
  },
  leftColumn: {
    display: "grid",
    gap: tokens.spacingVerticalM,
    alignContent: "start",
    margin: 0,
    padding: 0,
    backgroundColor: "transparent",
  },
  rightColumn: {
    display: "grid",
    gap: tokens.spacingVerticalM,
    alignContent: "start",
    margin: 0,
    padding: 0,
    backgroundColor: "transparent",
  },
  queueDrawerOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 1, 25, 0.25)",
    zIndex: 40,
    pointerEvents: "none",
    opacity: 0,
    transition: "opacity 200ms ease",
  },
  queueDrawerOverlayOpen: {
    pointerEvents: "auto",
    opacity: 1,
  },
  queueDrawer: {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    width: "min(460px, 92vw)",
    backgroundColor: "#FFFFFF",
    borderRight: "2px solid #123046",
    boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
    transform: "translateX(-102%)",
    transition: "transform 220ms ease",
    zIndex: 50,
    display: "grid",
    gridTemplateRows: "auto 1fr",
  },
  queueDrawerOpen: {
    transform: "translateX(0)",
  },
  queueDrawerHeader: {
    backgroundColor: "#123046",
    color: "#FFFFFF",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  queueDrawerTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 700,
    fontSize: "20px",
  },
  drawerCloseButton: {
    minHeight: "40px",
    minWidth: "40px",
    borderRadius: "8px",
    color: "#FFFFFF",
    border: "1px solid rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  queueDrawerBody: {
    padding: "12px",
    display: "grid",
    gap: "10px",
    alignContent: "start",
    backgroundColor: "#F5F5F5",
  },
  panel: {
    border: "1px solid #D2D2D2",
    borderRadius: "10px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  panelHeader: {
    backgroundColor: "#017CC5",
    color: "#FFFFFF",
    borderRadius: "8px 8px 0 0",
    padding: "10px 14px",
    fontSize: "20px",
    fontWeight: 700,
  },
  panelBody: {
    padding: "12px",
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  stacked: {
    display: "grid",
    gap: tokens.spacingVerticalS,
  },
  sectionCard: {
    border: "1px solid #D2D2D2",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  sectionCardTransparent: {
    backgroundColor: "transparent",
  },
  sectionCardHeader: {
    backgroundColor: "#123046",
    color: "#FFFFFF",
    padding: "8px 12px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sectionCardHeaderIcon: {
    display: "inline-flex",
    alignItems: "center",
    color: "#FFFFFF",
  },
  sectionCardBody: {
    padding: "10px",
    display: "grid",
    gap: "10px",
  },
  materialSectionBody: {
    padding: "0",
    height: "350px",
    minHeight: "350px",
  },
  sectionCardBodyTransparent: {
    backgroundColor: "transparent",
  },
  sectionTitle: {
    color: "#123046",
    fontWeight: 700,
    fontSize: "16px",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sectionIcon: {
    display: "inline-flex",
    alignItems: "center",
    color: "#017CC5",
  },
  sectionSubtle: {
    color: "#6E6E6E",
    fontSize: "12px",
  },
  materialFlipScene: {
    perspective: "1200px",
    height: "100%",
    minHeight: 0,
    backgroundColor: "#F5F5F5",
    borderRadius: "10px",
  },
  materialFlipCard: {
    position: "relative",
    width: "100%",
    height: "100%",
    minHeight: 0,
    transformStyle: "preserve-3d",
    transition: "transform 300ms ease",
  },
  materialFlipCardFlipped: {
    transform: "rotateY(180deg)",
  },
  materialFlipFace: {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    border: "1px solid #D2D2D2",
    borderRadius: "10px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
    padding: "10px",
    display: "grid",
    gap: "10px",
    alignContent: "start",
  },
  materialFaceFront: {
    backgroundColor: "transparent",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    boxShadow: "none",
  },
  materialFaceBack: {
    transform: "rotateY(180deg)",
    backgroundColor: "#FFFFFF",
  },
  materialAddButton: {
    minHeight: "46px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2b70a8",
    color: "#FFFFFF",
    fontWeight: 700,
    letterSpacing: "0.2px",
    boxShadow: "0 2px 8px rgba(43, 112, 168, 0.28)",
  },
  materialListWrap: {
    display: "grid",
    gap: "6px",
    maxHeight: "252px",
    overflow: "auto",
  },
  materialListCard: {
    border: "1px solid #CFCFCF",
    borderRadius: "10px",
    padding: "8px 10px",
    backgroundColor: "transparent",
    display: "grid",
    gap: "4px",
  },
  materialListRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },
  materialName: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#242424",
    lineHeight: 1.15,
  },
  materialMeta: {
    fontSize: "16px",
    color: "#242424",
    lineHeight: 1.2,
  },
  materialMetaRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  materialMetaPair: {
    display: "inline-flex",
    alignItems: "baseline",
    gap: "6px",
  },
  materialMetaLabel: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#3B3A39",
  },
  materialMetaValue: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#111111",
  },
  materialActionRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  materialRowButton: {
    minHeight: "32px",
    borderRadius: "6px",
    fontWeight: 700,
    fontSize: "12px",
  },
  materialEditButton: {
    border: "1px solid #123046",
    color: "#123046",
    backgroundColor: "#FFFFFF",
  },
  materialRemoveButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#B32020",
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    paddingLeft: "2px",
    paddingRight: "2px",
  },
  materialRemoveIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "999px",
    backgroundColor: "#B32020",
    color: "#FFFFFF",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    lineHeight: 1,
  },
  materialSearchInput: {
    width: "100%",
  },
  materialItemPickerButton: {
    minHeight: "40px",
    justifyContent: "flex-start",
    textAlign: "left",
  },
  itemDialogSurface: {
    width: "75vw",
    maxWidth: "75vw",
    height: "80vh",
  },
  itemDialogBody: {
    display: "grid",
    gap: "10px",
    height: "100%",
    minHeight: 0,
  },
  itemDialogContent: {
    display: "grid",
    gap: "10px",
    gridTemplateRows: "auto 1fr",
    minHeight: 0,
  },
  itemPickerTopRow: {
    display: "grid",
    gap: "8px",
  },
  productLineFilterRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))",
    gap: "6px",
  },
  itemPickerList: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
    alignContent: "start",
    minHeight: 0,
    overflowY: "auto",
    border: "1px solid #D2D2D2",
    borderRadius: "8px",
    padding: "8px",
    backgroundColor: "#FFFFFF",
    "@media (max-width: 1000px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    "@media (max-width: 700px)": {
      gridTemplateColumns: "1fr",
    },
  },
  itemPickerButton: {
    minHeight: "86px",
    justifyContent: "flex-start",
    textAlign: "left",
    alignItems: "flex-start",
    whiteSpace: "normal",
  },
  itemPickerMeta: {
    color: "#6E6E6E",
    fontSize: "12px",
    marginTop: "2px",
  },
  itemDialogActions: {
    justifyContent: "flex-end",
  },
  materialBackGrid: {
    display: "grid",
    gridTemplateColumns: "1.8fr 1fr",
    gap: "10px",
    alignItems: "stretch",
    "@media (max-width: 1000px)": {
      gridTemplateColumns: "1fr",
    },
  },
  materialBackFormColumn: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100%",
    gap: "10px",
  },
  materialKeypad: {
    display: "grid",
    gap: "6px",
  },
  materialKeypadGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "6px",
  },
  materialKeypadButton: {
    minHeight: "50px",
    borderRadius: "12px",
    border: "2px solid #D2D2D2",
    backgroundColor: "#FAFAF9",
    fontWeight: 800,
    fontSize: "27px",
    lineHeight: 1,
    color: "#242424",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  materialKeypadButtonWide: {
    gridColumn: "span 2",
  },
  materialKeypadButtonAction: {
    fontSize: "12px",
    fontWeight: 800,
  },
  materialKeypadBackspaceButton: {
    padding: "0",
  },
  materialKeypadBackspaceIcon: {
    color: "#000000",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    lineHeight: 1,
    fontWeight: 700,
  },
  materialKeypadButtonEnter: {
    gridColumn: "span 2",
    backgroundColor: "#123E7A",
    color: "#FFFFFF",
    border: "2px solid #123E7A",
    fontSize: "18px",
    fontWeight: 800,
  },
  materialKeypadSpacer: {
    minHeight: "50px",
  },
  materialBackActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "auto",
  },
  queueCardList: {
    maxHeight: "320px",
    overflow: "auto",
    display: "grid",
    gap: "8px",
    alignContent: "start",
  },
  queueCardButton: {
    width: "100%",
    minHeight: "80px",
    border: "1px solid #D2D2D2",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    padding: "10px",
    display: "grid",
    gap: "6px",
    textAlign: "left",
    cursor: "pointer",
  },
  selectedQueueCardButton: {
    backgroundColor: "#E0EFF8",
    border: "1px solid #017CC5",
  },
  queueCardTopRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
  },
  queueCardBottomRow: {
    display: "grid",
    gridTemplateColumns: "minmax(100px, 1fr) minmax(0, 2fr)",
    gap: "8px",
    alignItems: "start",
  },
  queueCardField: {
    minWidth: 0,
    display: "grid",
    gap: "2px",
  },
  queueCardLabel: {
    color: "#6E6E6E",
    fontSize: "11px",
    fontWeight: 700,
    lineHeight: 1.1,
  },
  queueCardValue: {
    color: "#242424",
    fontSize: "13px",
    fontWeight: 600,
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  jobCard: {
    border: "1px solid #D2D2D2",
    borderRadius: "8px",
    overflow: "hidden",
  },
  jobCardHeader: {
    backgroundColor: "#123046",
    color: "#FFFFFF",
    padding: "8px 12px",
    fontWeight: 700,
  },
  jobCardBody: {
    padding: "12px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    height: "350px",
    minHeight: "350px",
  },
  jobSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px 14px",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  jobSummaryColumn: {
    display: "grid",
    gap: "6px",
    alignContent: "start",
  },
  progressTrack: {
    width: "100%",
    height: "18px",
    backgroundColor: "#E8E8E8",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#017CC5",
    color: "#FFFFFF",
    fontSize: "12px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: "8px",
    transition: "width 150ms ease-in-out",
  },
  singleEntryScene: {
    perspective: "1200px",
    minHeight: 0,
    flex: 1,
    width: "100%",
    minWidth: 0,
    height: "100%",
    overflowX: "hidden",
  },
  singleEntryStandardCard: {
    borderRadius: "10px",
    border: "1px solid #D2D2D2",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    padding: "10px",
    height: "100%",
    minHeight: 0,
    minWidth: 0,
    display: "grid",
    gap: "10px",
    alignContent: "start",
  },
  singleEntryCard: {
    position: "relative",
    width: "100%",
    height: "100%",
    minHeight: "140px",
    transformStyle: "preserve-3d",
    transition: "transform 300ms ease",
  },
  singleEntryCardFlipped: {
    transform: "rotateY(180deg)",
  },
  singleEntryFace: {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    borderRadius: "10px",
    border: "1px solid rgba(18, 48, 70, 0.35)",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
    padding: "10px",
    display: "grid",
    gap: "10px",
    alignContent: "center",
    justifyItems: "center",
    backdropFilter: "blur(1px)",
  },
  singleEntryFrontFace: {},
  singleEntryBackFace: {
    transform: "rotateY(180deg)",
    alignContent: "start",
    justifyItems: "stretch",
  },
  singleEntrySerialGrid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: "8px",
    minWidth: 0,
    "& > *": {
      minWidth: 0,
    },
    "& .fui-Input, & .fui-Select": {
      width: "100%",
      minWidth: 0,
    },
    "@media (max-width: 1300px)": {
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    },
    "@media (max-width: 980px)": {
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    },
    "@media (max-width: 820px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    "@media (max-width: 680px)": {
      gridTemplateColumns: "1fr",
    },
  },
  singleEntryQtyText: {
    fontSize: "21px",
    fontWeight: 800,
    lineHeight: 1,
    color: "#111111",
  },
  singleEntryHintText: {
    fontSize: "12px",
    color: "#242424",
  },
  singleEntryFlipButton: {
    minHeight: "40px",
    borderRadius: "8px",
    fontWeight: 700,
  },
  singleEntryCompleteButton: {
    minHeight: "52px",
    minWidth: "220px",
    borderRadius: "10px",
    fontWeight: 800,
    fontSize: "18px",
  },
  modeButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "8px",
    "@media (max-width: 700px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
  },
  modeButton: {
    minHeight: "44px",
    borderRadius: "8px",
    fontWeight: 700,
  },
  modeSetup: {
    backgroundColor: "#123046",
    color: "#FFFFFF",
    border: "none",
  },
  modeRun: {
    backgroundColor: "#107C10",
    color: "#FFFFFF",
    border: "none",
  },
  modeDowntime: {
    backgroundColor: "#FFB900",
    color: "#242424",
    border: "none",
  },
  modeRework: {
    backgroundColor: "#AA121F",
    color: "#FFFFFF",
    border: "none",
  },
  timeSectionGrid: {
    display: "grid",
    gridTemplateColumns: "1.7fr 1fr",
    gap: "16px",
    alignItems: "start",
    "@media (max-width: 960px)": {
      gridTemplateColumns: "1fr",
    },
  },
  timeSectionGridSingleColumn: {
    gridTemplateColumns: "1fr",
  },
  timePrimaryColumn: {
    display: "grid",
    gap: "10px",
  },
  manualDurationInline: {
    display: "grid",
    gap: "8px",
    width: "50%",
    maxWidth: "640px",
    minWidth: "320px",
    "@media (max-width: 900px)": {
      width: "100%",
      minWidth: 0,
    },
  },
  manualDurationRow: {
    display: "grid",
    gridTemplateColumns: "1fr 96px",
    gap: "12px",
    alignItems: "center",
  },
  manualDurationLabel: {
    minHeight: "72px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    fontSize: "18px",
    fontWeight: 800,
    color: "#111111",
  },
  manualDurationInput: {
    minHeight: "72px",
    width: "96px",
    justifySelf: "start",
    "& input": {
      fontSize: "36px",
      fontWeight: 700,
      lineHeight: 1.1,
      minHeight: "72px",
      paddingTop: "0px",
      paddingBottom: "0px",
    },
  },
  timeQuickColumn: {
    display: "grid",
    gap: "8px",
    borderLeft: "1px solid #DADADA",
    paddingLeft: "14px",
    "@media (max-width: 960px)": {
      borderLeft: "none",
      borderTop: "1px solid #DADADA",
      paddingLeft: 0,
      paddingTop: "12px",
    },
  },
  timerRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  timerValue: {
    fontFamily: "Roboto Mono, Consolas, monospace",
    fontSize: "32px",
    fontWeight: 800,
    color: "#111111",
    lineHeight: 1,
    letterSpacing: "0.5px",
    "@media (max-width: 700px)": {
      fontSize: "28px",
    },
  },
  timerIcon: {
    fontSize: "24px",
    display: "inline-flex",
    alignItems: "center",
    color: "#111111",
  },
  timeControlButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
    "@media (max-width: 700px)": {
      gridTemplateColumns: "1fr",
    },
  },
  timeControlButton: {
    minHeight: "44px",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 800,
    letterSpacing: "0.3px",
    border: "none",
    color: "#FFFFFF",
    "@media (max-width: 700px)": {
      fontSize: "14px",
      minHeight: "40px",
    },
  },
  timeControlStart: {
    backgroundColor: "#2A9F4B",
  },
  timeControlPause: {
    backgroundColor: "#C18B13",
  },
  timeControlStop: {
    backgroundColor: "#D83A2E",
  },
  quickAddWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
    "@media (max-width: 500px)": {
      gridTemplateColumns: "1fr",
    },
  },
  quickChip: {
    minHeight: "66px",
    borderRadius: "14px",
    border: "1px solid #D2D2D2",
    backgroundColor: "#FFFFFF",
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    gap: "6px",
    fontSize: "44px",
    fontWeight: 700,
  },
  quickChipLabel: {
    fontSize: "21px",
    fontWeight: 800,
    lineHeight: 1,
    color: "#111111",
  },
  quickChipAddButton: {
    width: "28px",
    minWidth: "28px",
    height: "28px",
    minHeight: "28px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "#111111",
    color: "#FFFFFF",
    fontSize: "18px",
    fontWeight: 800,
    lineHeight: 1,
    padding: 0,
  },
  noteInput: {
    width: "100%",
  },
  reasonChips: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: "8px",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
  },
  reasonChip: {
    minHeight: "44px",
    borderRadius: "8px",
  },
  captureStatusRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "8px",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
  },
  captureStatusChip: {
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
    textAlign: "center",
    border: "1px solid #D2D2D2",
  },
  captureStatusDone: {
    backgroundColor: "#D4EDDA",
    color: "#155724",
  },
  captureStatusPending: {
    backgroundColor: "#F5F5F5",
    color: "#6E6E6E",
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "8px",
  },
  tallButton: {
    minHeight: "44px",
    minWidth: "120px",
    fontWeight: 700,
    borderRadius: "8px",
    paddingLeft: "12px",
    paddingRight: "12px",
  },
  buttonWithIcon: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  buttonIcon: {
    display: "inline-flex",
    alignItems: "center",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    "@media (max-width: 800px)": {
      gridTemplateColumns: "1fr",
    },
  },
  attachmentArea: {
    border: "2px dashed #D2D2D2",
    borderRadius: "8px",
    minHeight: "94px",
    display: "grid",
    placeItems: "center",
    color: "#6E6E6E",
    backgroundColor: "#FCFCFC",
    padding: "8px",
    textAlign: "center",
  },
  footerBar: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  columnActionBar: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  footerButton: {
    minHeight: "54px",
    borderRadius: "8px",
    fontSize: "18px",
    fontWeight: 700,
  },
  footerSave: {
    backgroundColor: "#E8E8E8",
    color: "#123046",
    border: "1px solid #D2D2D2",
  },
  footerSubmit: {
    backgroundColor: "#123046",
    color: "#FFFFFF",
    border: "1px solid #123046",
  },
  footerFlag: {
    backgroundColor: "#FFB900",
    color: "#242424",
    border: "1px solid #D2D2D2",
  },
  actionRow: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  fullWidthActionButton: {
    width: "100%",
  },
  actionBlueButton: {
    backgroundColor: "#2b70a8",
    border: "1px solid #2b70a8",
    color: "#FFFFFF",
  },
  requiredLabel: {
    color: "#8A8886",
    fontSize: "12px",
  },
});

type CaptureProgress = {
  usageDone: boolean;
  scrapDone: boolean;
  serialDone: boolean;
  checklistDone: boolean;
};

type MaterialCardItem = {
  id: string;
  partItemId: number;
  materialName: string;
  lotBatch: string;
  quantity: number;
  unit: string;
};

const EMPTY_CAPTURE_PROGRESS: CaptureProgress = {
  usageDone: false,
  scrapDone: false,
  serialDone: false,
  checklistDone: false,
};

const DEFAULT_ROLE = "Production" as const;
const SINGLE_UNIT_SERIAL_INPUT_ID = "single-unit-serial-no-input";

function formatLidSizeLabel(size: ItemSizeLookup): string {
  return Number.isInteger(size.size) ? size.size.toFixed(0) : size.size.toString();
}

function focusSingleUnitSerialInput() {
  window.setTimeout(() => {
    const serialInput = document.getElementById(SINGLE_UNIT_SERIAL_INPUT_ID);
    if (!(serialInput instanceof HTMLInputElement)) {
      return;
    }
    serialInput.focus();
    serialInput.select();
  }, 0);
}

function getApiErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) {
    return null;
  }
  if (!error.body || typeof error.body !== "object") {
    return null;
  }

  const details = error.body as {
    detail?: string;
    title?: string;
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (typeof details.detail === "string" && details.detail.trim().length > 0) {
    return details.detail;
  }
  if (typeof details.message === "string" && details.message.trim().length > 0) {
    return details.message;
  }
  if (typeof details.title === "string" && details.title.trim().length > 0) {
    return details.title;
  }
  if (details.errors && typeof details.errors === "object") {
    const firstError = Object.values(details.errors).flat()[0];
    if (typeof firstError === "string" && firstError.trim().length > 0) {
      return firstError;
    }
  }

  return null;
}

function getActiveLineRoute(
  execution: OrderRouteExecution | null,
  selectedQueueItem: WorkCenterQueueItem | null
): LineRouteExecution | null {
  if (!execution || !selectedQueueItem) {
    return null;
  }
  return execution.routes.find((route) => route.lineId === selectedQueueItem.lineId) ?? null;
}

function getSelectedStep(
  lineRoute: LineRouteExecution | null,
  selectedQueueItem: WorkCenterQueueItem | null,
  workCenterId: number
): RouteStepExecution | null {
  if (!lineRoute) {
    return null;
  }
  if (selectedQueueItem) {
    const exact = lineRoute.steps.find(
      (step) => Number(step.stepInstanceId) === Number(selectedQueueItem.stepInstanceId)
    );
    if (exact) {
      return exact;
    }
    const bySequence = lineRoute.steps.find(
      (step) =>
        step.workCenterId === workCenterId &&
        Number(step.stepSequence) === Number(selectedQueueItem.stepSequence) &&
        step.state !== "Completed"
    );
    if (bySequence) {
      return bySequence;
    }
  }
  const inProgressAtCenter = lineRoute.steps.find(
    (step) => step.workCenterId === workCenterId && step.state === "InProgress"
  );
  if (inProgressAtCenter) {
    return inProgressAtCenter;
  }
  const pendingAtCenter = lineRoute.steps.find(
    (step) => step.workCenterId === workCenterId && step.state !== "Completed"
  );
  if (pendingAtCenter) {
    return pendingAtCenter;
  }
  return lineRoute.steps[0] ?? null;
}

function formatElapsed(scanInUtc: string | null): string {
  if (!scanInUtc) {
    return "00:00:00";
  }
  const startedMs = Date.parse(scanInUtc);
  if (Number.isNaN(startedMs)) {
    return "00:00:00";
  }
  const deltaSec = Math.max(0, Math.floor((Date.now() - startedMs) / 1000));
  const hours = Math.floor(deltaSec / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((deltaSec % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (deltaSec % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function normalizeFilterValue(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function mapUsageRowsToMaterialCards(usageRows: StepMaterialUsage[]): MaterialCardItem[] {
  return usageRows.map((usage) => ({
    id: `db-${usage.id}`,
    partItemId: usage.partItemId,
    materialName: `${usage.partItemNo} - ${usage.partItemDescription ?? "--"}`,
    lotBatch: usage.lotBatch ?? "",
    quantity: usage.quantityUsed,
    unit: usage.uom ?? "KG",
  }));
}

function parsePersistedUsageId(materialId: string): number | null {
  if (!materialId.startsWith("db-")) {
    return null;
  }

  const idText = materialId.slice(3);
  if (!/^\d+$/.test(idText)) {
    return null;
  }

  return Number(idText);
}

function getMaterialItemNo(material: MaterialCardItem): string {
  const separatorIndex = material.materialName.indexOf(" - ");
  if (separatorIndex <= 0) {
    return material.materialName.trim().toUpperCase();
  }
  return material.materialName.slice(0, separatorIndex).trim().toUpperCase();
}

export function WorkCenterOperatorPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const setup = useMemo(() => readTabletSetup(), []);
  const [, setClockTick] = useState(0);
  const [queueOpen, setQueueOpen] = useState(false);

  const [queue, setQueue] = useState<WorkCenterQueueItem[]>([]);
  const [selectedQueueItem, setSelectedQueueItem] = useState<WorkCenterQueueItem | null>(null);
  const [execution, setExecution] = useState<OrderRouteExecution | null>(null);
  const [scrapReasons, setScrapReasons] = useState<Lookup[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemLookup[]>([]);
  const [lidSizes, setLidSizes] = useState<ItemSizeLookup[]>([]);
  const [itemLookupError, setItemLookupError] = useState<string | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [selectedProductLineFilter, setSelectedProductLineFilter] = useState("All");
  const [productLineOptions, setProductLineOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [empNo, setEmpNo] = useState(setup?.operatorEmpNo ?? "");
  const deviceId = setup?.deviceId ?? "";
  const notes = "";
  const [manualDurationMinutes, setManualDurationMinutes] = useState("");

  const [materials, setMaterials] = useState<MaterialCardItem[]>([]);
  const [materialsByStepId, setMaterialsByStepId] = useState<Record<number, MaterialCardItem[]>>({});
  const [isMaterialCardFlipped, setIsMaterialCardFlipped] = useState(false);
  const [materialPendingRemoval, setMaterialPendingRemoval] = useState<MaterialCardItem | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [materialPartItemId, setMaterialPartItemId] = useState("");
  const [selectedMaterialItem, setSelectedMaterialItem] = useState<OrderItemLookup | null>(null);
  const [materialLotBatch, setMaterialLotBatch] = useState("");
  const [materialQuantity, setMaterialQuantity] = useState("");
  const [progressQuantity, setProgressQuantity] = useState("");
  const [progressScrapQuantity, setProgressScrapQuantity] = useState("");
  const [scrapQuantity, setScrapQuantity] = useState("");
  const [scrapReasonId, setScrapReasonId] = useState("");
  const [lidColors, setLidColors] = useState<Lookup[]>([]);
  const [serialNo, setSerialNo] = useState("");
  const [serialManufacturer, setSerialManufacturer] = useState("");
  const [serialManufactureDate, setSerialManufactureDate] = useState("");
  const [serialTestDate, setSerialTestDate] = useState("");
  const [serialLidColorId, setSerialLidColorId] = useState("");
  const [serialLidSize, setSerialLidSize] = useState("");
  const [serialConditionStatus, setSerialConditionStatus] = useState("Good");
  const [singleUnitCompletedQtyOverride, setSingleUnitCompletedQtyOverride] = useState<number | null>(null);
  const [progressByStep, setProgressByStep] = useState<Record<number, CaptureProgress>>({});
  const sessionEmpNo = session?.empNo?.trim() ?? "";
  const sessionDisplayName = session?.displayName?.trim() ?? "";
  const operatorDisplayName = formatCurrentUserDisplayName(
    sessionDisplayName,
    "Current User"
  );
  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockTick((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!setup) {
      navigate("/setup/tablet", { replace: true });
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [queueRows, scrapReasonRows, items, productLines, colorRows, sizeRows] = await Promise.all([
          ordersApi.workCenterQueue(setup.workCenterId),
          orderLookupsApi.scrapReasons(),
          orderLookupsApi.items(),
          orderLookupsApi.productLines("JobMaterialUsed"),
          orderLookupsApi.colors(),
          itemLookupsApi.itemSizes(),
        ]);
        setQueue(queueRows);
        setSelectedQueueItem(queueRows[0] ? { ...queueRows[0] } : null);
        setScrapReasons(scrapReasonRows);
        setOrderItems(items);
        setProductLineOptions(productLines);
        setLidColors(colorRows);
        setLidSizes(sizeRows);
        setItemLookupError(null);
      } catch {
        setError("Unable to load work center queue.");
        setItemLookupError("Unable to load item list.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [navigate, setup]);

  useEffect(() => {
    if (!setup || !selectedQueueItem) {
      setExecution(null);
      return;
    }

    const loadExecution = async () => {
      setError(null);
      try {
        const executionResponse = await ordersApi.lineRouteExecution(
          selectedQueueItem.orderId,
          selectedQueueItem.lineId
        );
        setExecution(executionResponse);
      } catch {
        setError("Unable to load selected route step.");
      }
    };

    void loadExecution();
  }, [selectedQueueItem, setup]);

  const lineRoute = useMemo(
    () => getActiveLineRoute(execution, selectedQueueItem),
    [execution, selectedQueueItem]
  );
  const step = useMemo(
    () => getSelectedStep(lineRoute, selectedQueueItem, setup?.workCenterId ?? -1),
    [lineRoute, selectedQueueItem, setup?.workCenterId]
  );

  useEffect(() => {
    if (!setup) {
      return;
    }

    if (setup.lockOperatorToLoggedInUser) {
      setEmpNo(sessionEmpNo);
      return;
    }

    if (sessionEmpNo) {
      setEmpNo(sessionEmpNo);
      return;
    }

    setEmpNo(setup.operatorEmpNo ?? "");
  }, [sessionEmpNo, setup]);

  useEffect(() => {
    const stepInstanceId = selectedQueueItem?.stepInstanceId;
    setMaterials(stepInstanceId ? (materialsByStepId[stepInstanceId] ?? []) : []);
    setIsMaterialCardFlipped(false);
    setEditingMaterialId(null);
    setMaterialPartItemId("");
    setSelectedMaterialItem(null);
    setMaterialLotBatch("");
    setMaterialQuantity("");
    setSingleUnitCompletedQtyOverride(null);
  }, [selectedQueueItem?.stepInstanceId]);

  useEffect(() => {
    if (!selectedQueueItem || !step) {
      return;
    }

    const loadStepUsage = async () => {
      try {
        const usageRows = await ordersApi.getStepUsage(
          selectedQueueItem.orderId,
          selectedQueueItem.lineId,
          step.stepInstanceId
        );
        const restoredMaterials = mapUsageRowsToMaterialCards(usageRows);
        setMaterials(restoredMaterials);
        setMaterialsByStepId((existing) => ({
          ...existing,
          [step.stepInstanceId]: restoredMaterials,
        }));
        setProgressByStep((current) => ({
          ...current,
          [step.stepInstanceId]: {
            ...(current[step.stepInstanceId] ?? EMPTY_CAPTURE_PROGRESS),
            usageDone: restoredMaterials.length > 0,
          },
        }));
      } catch {
        setError("Unable to load saved material usage.");
      }
    };

    void loadStepUsage();
  }, [selectedQueueItem, step]);

  const updateStepMaterials = (updater: (current: MaterialCardItem[]) => MaterialCardItem[]) => {
    const stepInstanceId = selectedQueueItem?.stepInstanceId;
    setMaterials((current) => {
      const next = updater(current);
      if (!stepInstanceId) {
        return next;
      }
      setMaterialsByStepId((existing) => ({
        ...existing,
        [stepInstanceId]: next,
      }));
      return next;
    });
  };

  const refreshStepUsage = async (orderId: number, lineId: number, stepInstanceId: number) => {
    const usageRows = await ordersApi.getStepUsage(orderId, lineId, stepInstanceId);
    const restoredMaterials = mapUsageRowsToMaterialCards(usageRows);
    setMaterials(restoredMaterials);
    setMaterialsByStepId((existing) => ({
      ...existing,
      [stepInstanceId]: restoredMaterials,
    }));
    withStepProgress({ usageDone: restoredMaterials.length > 0 });
  };

  const captureProgress = step ? progressByStep[step.stepInstanceId] ?? EMPTY_CAPTURE_PROGRESS : EMPTY_CAPTURE_PROGRESS;
  const stepRequiresSerialCapture = Boolean(step?.requiresSerialCapture);
  const queueScanInUtc = selectedQueueItem?.scanInUtc ?? null;
  const elapsedTimer = formatElapsed(step?.scanInUtc ?? queueScanInUtc);
  const nowText = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const hasEmpNo = empNo.trim().length > 0;
  const hasBlockedReason = Boolean(step?.blockedReason);
  const usageSatisfied = !step?.requiresUsageEntry || captureProgress.usageDone;
  const showScrapCapture = false;
  const scrapSatisfied = !showScrapCapture || !step?.requiresScrapEntry || captureProgress.scrapDone;
  const serialSatisfied = !stepRequiresSerialCapture || captureProgress.serialDone;
  const checklistSatisfied = true;
  const canComplete =
    Boolean(step) &&
    hasEmpNo &&
    !hasBlockedReason &&
    usageSatisfied &&
    scrapSatisfied &&
    serialSatisfied &&
    checklistSatisfied;
  const qtyOrdered = lineRoute?.quantityOrdered ?? 0;
  const qtyReceived = lineRoute?.quantityReceived ?? selectedQueueItem?.quantityAsReceived ?? qtyOrdered;
  const qtyCompleted = lineRoute?.quantityCompleted ?? 0;
  const displayQtyCompleted =
    singleUnitCompletedQtyOverride !== null ? singleUnitCompletedQtyOverride : qtyCompleted;
  const isSingleUnitMode = step?.processingMode === "SingleUnit";
  const isSingleUnitReadyToCompleteStep = isSingleUnitMode && qtyReceived > 0 && displayQtyCompleted >= qtyReceived;
  const showBatchSerialSection = !isSingleUnitMode && stepRequiresSerialCapture;
  const showSingleUnitSerialFields = isSingleUnitMode && stepRequiresSerialCapture;
  const isManualTimeCapture = step?.timeCaptureMode === "Manual";
  const isAutomatedTimeCapture = step?.timeCaptureMode === "Automated";
  const showQuickAddDuration = step?.timeCaptureMode !== "Automated";
  const jobMaterialItems = useMemo(() => {
    if (productLineOptions.length === 0) {
      return orderItems;
    }
    const allowedLines = new Set(
      productLineOptions.map((line) => normalizeFilterValue(line)).filter((line) => line.length > 0)
    );
    return orderItems.filter((item) => {
      const itemLine = normalizeFilterValue(item.productLine);
      return itemLine.length > 0 && allowedLines.has(itemLine);
    });
  }, [orderItems, productLineOptions]);
  const availableProductLineFilters = useMemo(() => {
    const normalizedFromLookup = productLineOptions
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (normalizedFromLookup.length > 0) {
      return ["All", ...normalizedFromLookup];
    }
    const derivedFromItems = Array.from(
      new Set(
        jobMaterialItems
          .map((item) => item.productLine?.trim())
          .filter((value): value is string => Boolean(value))
      )
    );
    return ["All", ...derivedFromItems];
  }, [jobMaterialItems, productLineOptions]);
  const filteredItems = useMemo(() => {
    const query = itemSearchQuery.trim().toLowerCase();
    const selectedProductLineKey = normalizeFilterValue(selectedProductLineFilter);
    return jobMaterialItems.filter((item) => {
      const itemProductLineKey = normalizeFilterValue(item.productLine);
      const includeProductLine =
        selectedProductLineKey === "all" || itemProductLineKey === selectedProductLineKey;
      if (!includeProductLine) {
        return false;
      }
      if (!query) {
        return true;
      }
      const searchText = `${item.itemNo} ${item.itemDescription ?? ""} ${item.productLine ?? ""}`.toLowerCase();
      return searchText.includes(query);
    });
  }, [itemSearchQuery, jobMaterialItems, selectedProductLineFilter]);
  const sortedMaterials = useMemo(
    () =>
      [...materials].sort((left, right) =>
        getMaterialItemNo(left).localeCompare(getMaterialItemNo(right), undefined, {
          numeric: true,
          sensitivity: "base",
        })
      ),
    [materials]
  );

  const withStepProgress = (patch: Partial<CaptureProgress>) => {
    if (!step) {
      return;
    }
    setProgressByStep((current) => ({
      ...current,
      [step.stepInstanceId]: {
        ...(current[step.stepInstanceId] ?? EMPTY_CAPTURE_PROGRESS),
        ...patch,
      },
    }));
  };

  const runAction = async (name: string, fn: () => Promise<void>) => {
    setBusyAction(name);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError) ?? "Action failed. Please retry.");
    } finally {
      setBusyAction(null);
    }
  };

  const addQuickMinutes = (minutesToAdd: number) => {
    if (minutesToAdd <= 0) {
      return;
    }
    const currentMinutes = Number(manualDurationMinutes);
    const safeMinutes = Number.isNaN(currentMinutes) ? 0 : currentMinutes;
    setManualDurationMinutes((safeMinutes + minutesToAdd).toString());
    setInfo(`Added ${minutesToAdd} minutes to manual duration.`);
  };

  const scanIn = async () => {
    if (!step || !selectedQueueItem || !setup || !hasEmpNo) {
      return;
    }
    await runAction("scanIn", async () => {
      await ordersApi.scanIn(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
        empNo: empNo.trim(),
        deviceId: deviceId.trim() || null,
        workCenterId: setup.workCenterId,
        actingRole: DEFAULT_ROLE,
      });
      setInfo("Scan in recorded.");
    });
  };

  const scanOut = async () => {
    if (!step || !selectedQueueItem || !setup || !hasEmpNo) {
      return;
    }
    await runAction("scanOut", async () => {
      await ordersApi.scanOut(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
        empNo: empNo.trim(),
        deviceId: deviceId.trim() || null,
        workCenterId: setup.workCenterId,
        actingRole: DEFAULT_ROLE,
      });
      setInfo("Scan out recorded.");
    });
  };

  const resetMaterialForm = () => {
    setEditingMaterialId(null);
    setMaterialPartItemId("");
    setSelectedMaterialItem(null);
    setMaterialLotBatch("");
    setMaterialQuantity("");
    setItemSearchQuery("");
    setSelectedProductLineFilter("All");
    setIsItemDialogOpen(false);
  };

  const startAddMaterial = () => {
    resetMaterialForm();
    setIsMaterialCardFlipped(true);
  };

  const startEditMaterial = (item: MaterialCardItem) => {
    setEditingMaterialId(item.id);
    setMaterialPartItemId(item.partItemId.toString());
    setSelectedMaterialItem(orderItems.find((candidate) => candidate.id === item.partItemId) ?? null);
    setMaterialLotBatch(item.lotBatch);
    setMaterialQuantity(item.quantity.toString());
    setIsMaterialCardFlipped(true);
  };

  const removeMaterial = async (itemId: string) => {
    const persistedUsageId = parsePersistedUsageId(itemId);
    if (persistedUsageId === null || !step || !selectedQueueItem) {
      updateStepMaterials((current) => {
        const next = current.filter((item) => item.id !== itemId);
        if (!next.length) {
          withStepProgress({ usageDone: false });
        }
        return next;
      });
      setInfo("Material entry removed.");
      return;
    }

    await runAction("removeMaterial", async () => {
      await ordersApi.deleteStepUsage(
        selectedQueueItem.orderId,
        selectedQueueItem.lineId,
        step.stepInstanceId,
        persistedUsageId,
        {
          recordedByEmpNo: empNo.trim(),
          actingRole: DEFAULT_ROLE,
        }
      );
      await refreshStepUsage(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId);
      setInfo("Material entry removed.");
    });
  };

  const requestRemoveMaterial = (item: MaterialCardItem) => {
    setMaterialPendingRemoval(item);
  };

  const confirmRemoveMaterial = () => {
    if (!materialPendingRemoval) {
      return;
    }
    void removeMaterial(materialPendingRemoval.id);
    setMaterialPendingRemoval(null);
  };

  const appendQuantityDigit = (token: string) => {
    if (token === "CLR") {
      setMaterialQuantity("");
      return;
    }
    if (token === "DEL") {
      setMaterialQuantity((value) => value.slice(0, -1));
      return;
    }
    setMaterialQuantity((value) => `${value}${token}`);
  };

  const saveMaterial = async () => {
    if (!step || !selectedQueueItem) {
      return;
    }
    if (!hasEmpNo) {
      setError("Operator identity is required before saving material usage.");
      return;
    }

    const parsedPartItemId = Number(materialPartItemId);
    const parsedQuantity = Number(materialQuantity);
    if (Number.isNaN(parsedPartItemId) || parsedPartItemId <= 0) {
      setError("Select a valid Part Item.");
      return;
    }
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError("Enter a valid quantity greater than zero.");
      return;
    }
    const selectedLookupItem =
      selectedMaterialItem ?? jobMaterialItems.find((item) => item.id === parsedPartItemId) ?? null;
    if (!selectedLookupItem) {
      setError("Select a valid Part Item.");
      return;
    }
    const materialName = `${selectedLookupItem.itemNo} - ${selectedLookupItem.itemDescription ?? "--"}`;

    if (editingMaterialId) {
      const persistedUsageId = parsePersistedUsageId(editingMaterialId);
      if (persistedUsageId !== null) {
        await runAction("updateMaterial", async () => {
          await ordersApi.updateStepUsage(
            selectedQueueItem.orderId,
            selectedQueueItem.lineId,
            step.stepInstanceId,
            persistedUsageId,
            {
              partItemId: parsedPartItemId,
              quantityUsed: parsedQuantity,
              lotBatch: materialLotBatch.trim() || null,
              uom: "KG",
              recordedByEmpNo: empNo.trim(),
              actingRole: DEFAULT_ROLE,
            }
          );
          await refreshStepUsage(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId);
          withStepProgress({ usageDone: true });
          setInfo("Material entry updated.");
          setIsMaterialCardFlipped(false);
          resetMaterialForm();
        });
        return;
      }

      updateStepMaterials((current) =>
        current.map((item) =>
          item.id === editingMaterialId
            ? {
                ...item,
                materialName,
                partItemId: parsedPartItemId,
                lotBatch: materialLotBatch.trim(),
                quantity: parsedQuantity,
                unit: item.unit,
              }
            : item
        )
      );
      withStepProgress({ usageDone: true });
      setInfo("Material entry updated.");
      setIsMaterialCardFlipped(false);
      resetMaterialForm();
      return;
    }

    await runAction("saveMaterial", async () => {
      await ordersApi.addStepUsage(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
        partItemId: parsedPartItemId,
        quantityUsed: parsedQuantity,
        lotBatch: materialLotBatch.trim() || null,
        uom: "KG",
        recordedByEmpNo: empNo.trim(),
        actingRole: DEFAULT_ROLE,
      });
      await refreshStepUsage(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId);
      withStepProgress({ usageDone: true });
      setInfo("Material usage recorded.");
      setIsMaterialCardFlipped(false);
      resetMaterialForm();
    });
  };

  const recordProgress = async (singleUnit = false) => {
    if (!step || !selectedQueueItem || !setup || !hasEmpNo) {
      return;
    }

    const quantityCompleted = singleUnit ? 1 : Number(progressQuantity);
    if (!singleUnit && (!progressQuantity || Number.isNaN(quantityCompleted) || quantityCompleted <= 0)) {
      return;
    }
    const quantityScrapped = progressScrapQuantity ? Number(progressScrapQuantity) : null;
    const singleUnitRequiresUsage = singleUnit && step.requiresUsageEntry;
    const singleUnitHasListedMaterials = singleUnit && materials.length > 0;
    const singleUnitRequiresSerial = singleUnit && stepRequiresSerialCapture;
    if (singleUnitRequiresUsage && materials.length === 0) {
      setError("Single mode requires at least one material lot before processing units.");
      return;
    }
    if (singleUnitRequiresSerial && !serialNo.trim()) {
      setError("Serial No is required in single entry mode.");
      return;
    }
    await runAction("recordProgress", async () => {
      const isStepInProgress = step.state === "InProgress";
      if (singleUnit && !isStepInProgress) {
        await ordersApi.scanIn(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
          empNo: empNo.trim(),
          deviceId: deviceId.trim() || null,
          workCenterId: setup.workCenterId,
          actingRole: DEFAULT_ROLE,
        });
      }

      if (singleUnitRequiresSerial) {
        await ordersApi.addStepSerial(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
          serialNo: serialNo.trim(),
          manufacturer: serialManufacturer.trim() || "Unknown",
          manufactureDate: serialManufactureDate.trim() || null,
          testDate: serialTestDate.trim() || null,
          lidColorId: serialLidColorId ? Number(serialLidColorId) : null,
          lidSizeId: serialLidSize ? Number(serialLidSize) : null,
          conditionStatus: serialConditionStatus,
          recordedByEmpNo: empNo.trim(),
          actingRole: DEFAULT_ROLE,
        });
        withStepProgress({ serialDone: true });
        setSerialNo("");
        setSerialManufacturer("");
        setSerialManufactureDate("");
        setSerialTestDate("");
        setSerialConditionStatus("Good");
      }

      if (singleUnitHasListedMaterials) {
        for (const material of materials) {
          await ordersApi.addStepUsage(
            selectedQueueItem.orderId,
            selectedQueueItem.lineId,
            step.stepInstanceId,
            {
              partItemId: material.partItemId,
              quantityUsed: 1,
              lotBatch: material.lotBatch || null,
              uom: material.unit || "EA",
              recordedByEmpNo: empNo.trim(),
              actingRole: DEFAULT_ROLE,
            }
          );
        }
        updateStepMaterials((current) =>
          current.map((material) => ({
            ...material,
            quantity: material.quantity + 1,
          }))
        );
        withStepProgress({ usageDone: true });
      }

      const executionResponse = await ordersApi.recordStepProgress(
        selectedQueueItem.orderId,
        selectedQueueItem.lineId,
        step.stepInstanceId,
        {
          quantityCompleted,
          quantityScrapped,
          empNo: empNo.trim(),
          notes: notes.trim() || null,
          actingRole: DEFAULT_ROLE,
        }
      );
      setExecution(executionResponse);
      if (singleUnit) {
        const updatedLineRoute =
          executionResponse.routes.find((route) => route.lineId === selectedQueueItem.lineId) ?? null;
        const updatedQtyCompleted = updatedLineRoute?.quantityCompleted;
        if (typeof updatedQtyCompleted === "number") {
          setSingleUnitCompletedQtyOverride(updatedQtyCompleted);
        } else {
          const nextQty = displayQtyCompleted + 1;
          setSingleUnitCompletedQtyOverride(nextQty);
        }
      } else {
        setSingleUnitCompletedQtyOverride(null);
      }
      if (!singleUnit) {
        setProgressQuantity("");
      }
      setProgressScrapQuantity("");
      if (!singleUnit) {
        setInfo("Batch quantity progress recorded.");
      }
      if (singleUnit && stepRequiresSerialCapture) {
        focusSingleUnitSerialInput();
      }
    });
  };

  const addScrap = async () => {
    if (!step || !selectedQueueItem || !hasEmpNo || !scrapQuantity || !scrapReasonId) {
      return;
    }
    await runAction("addScrap", async () => {
      await ordersApi.addStepScrap(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
        quantityScrapped: Number(scrapQuantity),
        scrapReasonId: Number(scrapReasonId),
        recordedByEmpNo: empNo.trim(),
        actingRole: DEFAULT_ROLE,
      });
      setScrapQuantity("");
      setScrapReasonId("");
      withStepProgress({ scrapDone: true });
      setInfo("Scrap recorded.");
    });
  };

  const addSerial = async () => {
    if (!step || !selectedQueueItem || !hasEmpNo || !serialNo.trim()) {
      return;
    }
    await runAction("addSerial", async () => {
      await ordersApi.addStepSerial(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
        serialNo: serialNo.trim(),
        manufacturer: serialManufacturer.trim() || "Unknown",
        manufactureDate: serialManufactureDate.trim() || null,
        testDate: serialTestDate.trim() || null,
        lidColorId: serialLidColorId ? Number(serialLidColorId) : null,
        lidSizeId: serialLidSize ? Number(serialLidSize) : null,
        conditionStatus: serialConditionStatus,
        recordedByEmpNo: empNo.trim(),
        actingRole: DEFAULT_ROLE,
      });
      setSerialNo("");
      setSerialManufacturer("");
      setSerialManufactureDate("");
      setSerialTestDate("");
      setSerialLidColorId("");
      setSerialLidSize("");
      setSerialConditionStatus("Good");
      withStepProgress({ serialDone: true });
      setInfo("Serial capture recorded.");
    });
  };

  const completeStep = async () => {
    if (!step || !selectedQueueItem || !hasEmpNo || !canComplete) {
      return;
    }

    await runAction("completeStep", async () => {
      await ordersApi.completeStep(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
        empNo: empNo.trim(),
        actingRole: DEFAULT_ROLE,
        notes: notes.trim() || null,
        manualDurationMinutes: manualDurationMinutes ? Number(manualDurationMinutes) : null,
        manualDurationReason: null,
      });

      const queueRows = await ordersApi.workCenterQueue(setup?.workCenterId ?? -1);
      setQueue(queueRows);
      setSelectedQueueItem(queueRows[0] ?? null);
      setExecution(null);
      setInfo("Step completed.");
    });
  };

  if (!setup) {
    return null;
  }

  return (
    <main className={styles.page}>
      <div
        className={mergeClasses(
          styles.queueDrawerOverlay,
          queueOpen ? styles.queueDrawerOverlayOpen : undefined
        )}
        onClick={() => setQueueOpen(false)}
      />
      <aside className={mergeClasses(styles.queueDrawer, queueOpen ? styles.queueDrawerOpen : undefined)}>
        <div className={styles.queueDrawerHeader}>
          <div className={styles.queueDrawerTitle}>
            <List24Regular />
            Work Center Queue
          </div>
          <Button
            className={styles.drawerCloseButton}
            appearance="transparent"
            aria-label="Close queue"
            onClick={() => setQueueOpen(false)}
          >
            <Dismiss24Regular />
          </Button>
        </div>
        <div className={styles.queueDrawerBody}>
          {loading ? (
            <Body1>Loading queue...</Body1>
          ) : (
            <div className={styles.queueCardList}>
              {queue.map((row) => (
                <button
                  key={row.stepInstanceId}
                  type="button"
                  className={mergeClasses(
                    styles.queueCardButton,
                    selectedQueueItem?.stepInstanceId === row.stepInstanceId
                      ? styles.selectedQueueCardButton
                      : undefined
                  )}
                  onClick={() => {
                    setSelectedQueueItem({ ...row });
                    setQueueOpen(false);
                  }}
                >
                  <div className={styles.queueCardTopRow}>
                    <div className={styles.queueCardField}>
                      <span className={styles.queueCardLabel}>Order No.</span>
                      <span className={styles.queueCardValue}>{row.salesOrderNo}</span>
                    </div>
                    <div className={styles.queueCardField}>
                      <span className={styles.queueCardLabel}>Line No.</span>
                      <span className={styles.queueCardValue}>{row.lineNo ?? row.lineId}</span>
                    </div>
                    <div className={styles.queueCardField}>
                      <span className={styles.queueCardLabel}>Quantity</span>
                      <span className={styles.queueCardValue}>
                        {row.quantityAsReceived ?? "--"}
                      </span>
                    </div>
                  </div>
                  <div className={styles.queueCardBottomRow}>
                    <div className={styles.queueCardField}>
                      <span className={styles.queueCardLabel}>Item No.</span>
                      <span className={styles.queueCardValue}>{row.itemNo ?? "--"}</span>
                    </div>
                    <div className={styles.queueCardField}>
                      <span className={styles.queueCardLabel}>Item Desc.</span>
                      <span className={styles.queueCardValue}>{row.itemDescription ?? "--"}</span>
                    </div>
                  </div>
                </button>
              ))}
              {queue.length === 0 ? <Body1>No queued work at this center.</Body1> : null}
            </div>
          )}
        </div>
      </aside>

      <section className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Button
            className={styles.hamburgerButton}
            appearance="transparent"
            aria-label="Open queue"
            onClick={() => setQueueOpen(true)}
          >
            <Navigation24Regular />
          </Button>
          <div>
          <div className={styles.topBarTitle}>LPC Operator</div>
          </div>
        </div>
        <div className={styles.topBarMeta}>
          <span className={styles.chip}>
            <span className={styles.chipContent}>
              <span className={styles.chipIcon}>
                <Building24Regular />
              </span>
              Workstation: {setup.workCenterName}
            </span>
          </span>
          <span className={styles.chip}>
            <span className={styles.chipContent}>
              <span className={styles.chipIcon}>
                <Person24Regular />
              </span>
              {operatorDisplayName}
            </span>
          </span>
          <span className={styles.chip}>
            <span className={styles.chipContent}>
              <span className={styles.chipIcon}>
                <Clock24Regular />
              </span>
              {nowText}
            </span>
          </span>
        </div>
        <div className={styles.tabletActions}>
          <Button className={styles.tallButton} appearance="secondary" onClick={() => void handleLogout()}>
            Logout
          </Button>
          <Button className={styles.tallButton} appearance="secondary" onClick={() => navigate("/setup/tablet")}>
            Change Tablet Setup
          </Button>
          <Button className={styles.tallButton} appearance="secondary" onClick={() => navigate("/")}>
            Home
          </Button>
        </div>
      </section>

      {error ? (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      ) : null}
      {info ? (
        <MessageBar intent="success">
          <MessageBarBody>{info}</MessageBarBody>
        </MessageBar>
      ) : null}

      <div className={styles.bodyGrid}>
        <div className={styles.leftColumn}>
          {!step || !selectedQueueItem ? (
            <div className={styles.sectionCard}>
              <Body1>Select a queued line to begin.</Body1>
            </div>
          ) : (
            <>
              <div className={styles.jobCard}>
                <div className={styles.jobCardHeader}>
                  Current Order # {selectedQueueItem.salesOrderNo} - Line #{" "}
                  {selectedQueueItem.lineNo ?? selectedQueueItem.lineId}
                </div>
                <div className={styles.jobCardBody}>
                  <div className={styles.jobSummaryGrid}>
                    <div className={styles.jobSummaryColumn}>
                      <Body1>
                        <strong>Route Step:</strong> {step.stepCode} - {step.stepName}
                      </Body1>
                      <Body1>
                        <strong>Qty Complete:</strong> {displayQtyCompleted} / {qtyOrdered}
                      </Body1>
                    </div>
                    <div className={styles.jobSummaryColumn}>
                      <Body1>
                        <strong>Item No.:</strong> {selectedQueueItem.itemNo ?? "--"}
                      </Body1>
                      <Body1>
                        <strong>Item Desc.:</strong> {selectedQueueItem.itemDescription ?? "--"}
                      </Body1>
                    </div>
                  </div>
                  {hasBlockedReason ? (
                    <Body1>
                      <strong>Blocked:</strong> {step.blockedReason}
                    </Body1>
                  ) : null}
                  {isSingleUnitMode ? (
                    <div className={styles.singleEntryScene}>
                      <div className={styles.singleEntryStandardCard}>
                        <Body1 className={styles.singleEntryQtyText}>
                          Qty {displayQtyCompleted} of {qtyReceived}
                        </Body1>
                        {showSingleUnitSerialFields ? (
                          <div className={styles.singleEntrySerialGrid}>
                            <Field label="Serial No">
                              <Input
                                id={SINGLE_UNIT_SERIAL_INPUT_ID}
                                value={serialNo}
                                onChange={(_, data) => setSerialNo(data.value)}
                              />
                            </Field>
                            <Field label="Manufacturer">
                              <Input value={serialManufacturer} onChange={(_, data) => setSerialManufacturer(data.value)} />
                            </Field>
                            <Field label="Manuf. Date">
                              <Input
                                value={serialManufactureDate}
                                onChange={(_, data) => setSerialManufactureDate(data.value)}
                              />
                            </Field>
                            <Field label="Test Date">
                              <Input value={serialTestDate} onChange={(_, data) => setSerialTestDate(data.value)} />
                            </Field>
                            <Field label="Lid Color">
                              <Select value={serialLidColorId} onChange={(event) => setSerialLidColorId(event.target.value)}>
                                <option value="">Select lid color</option>
                                {lidColors.map((color) => (
                                  <option key={color.id} value={color.id}>
                                    {color.name}
                                  </option>
                                ))}
                              </Select>
                            </Field>
                            <Field label="LidSize">
                              <Select value={serialLidSize} onChange={(event) => setSerialLidSize(event.target.value)}>
                                <option value="">Select lid size</option>
                                {lidSizes.map((size) => (
                                  <option key={size.id} value={size.id}>
                                    {formatLidSizeLabel(size)}
                                  </option>
                                ))}
                              </Select>
                            </Field>
                            <Field label="Status">
                              <Select
                                value={serialConditionStatus}
                                onChange={(event) => setSerialConditionStatus(event.target.value)}
                              >
                                <option value="Good">Good</option>
                                <option value="Bad">Bad</option>
                              </Select>
                            </Field>
                          </div>
                        ) : null}
                        <Button
                          className={styles.singleEntryCompleteButton}
                          appearance="primary"
                          onClick={() =>
                            isSingleUnitReadyToCompleteStep ? void completeStep() : void recordProgress(true)
                          }
                          disabled={
                            isSingleUnitReadyToCompleteStep
                              ? busyAction !== null || !canComplete
                              : busyAction !== null ||
                                !hasEmpNo ||
                                (step.requiresUsageEntry && materials.length === 0) ||
                                (showSingleUnitSerialFields && !serialNo.trim())
                          }
                        >
                          {isSingleUnitReadyToCompleteStep ? "Complete Final Unit" : "Complete Next Unit"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.fieldGrid}>
                        <Field label="Batch Qty Complete">
                          <Input
                            value={progressQuantity}
                            onChange={(_, data) => setProgressQuantity(data.value)}
                          />
                        </Field>
                        <Field label="Batch Qty Scrap (optional)">
                          <Input
                            value={progressScrapQuantity}
                            onChange={(_, data) => setProgressScrapQuantity(data.value)}
                          />
                        </Field>
                      </div>
                      <div className={styles.actionRow}>
                        <Button
                          className={mergeClasses(
                            styles.footerButton,
                            styles.fullWidthActionButton,
                            styles.actionBlueButton
                          )}
                          appearance="primary"
                          onClick={() => void completeStep()}
                          disabled={busyAction !== null || !canComplete}
                        >
                          Complete Step
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className={styles.sectionCard}>
                <div className={styles.sectionCardHeader}>Time Logging</div>
                <div className={styles.sectionCardBody}>
                  <div
                    className={mergeClasses(
                      styles.timeSectionGrid,
                      !showQuickAddDuration ? styles.timeSectionGridSingleColumn : undefined
                    )}
                  >
                    <div className={styles.timePrimaryColumn}>
                      {isManualTimeCapture ? (
                        <div className={styles.manualDurationInline}>
                          <div className={styles.manualDurationRow}>
                            <span className={styles.manualDurationLabel}># of Minutes</span>
                            <Input
                              className={styles.manualDurationInput}
                              aria-label="# of Minutes"
                              value={manualDurationMinutes}
                              onChange={(_, data) => setManualDurationMinutes(data.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={styles.timerRow}>
                            <span className={styles.timerIcon}>
                              <Clock24Regular />
                            </span>
                            <div className={styles.timerValue}>{elapsedTimer}</div>
                          </div>
                          <div className={styles.timeControlButtons}>
                            <Button
                              className={mergeClasses(styles.timeControlButton, styles.timeControlStart)}
                              appearance="secondary"
                              onClick={() => {
                                void scanIn();
                              }}
                              disabled={busyAction !== null || !hasEmpNo}
                            >
                              START
                            </Button>
                            <Button
                              className={mergeClasses(styles.timeControlButton, styles.timeControlPause)}
                              appearance="secondary"
                              onClick={() => {
                                setInfo("Pause/resume marker captured.");
                              }}
                              disabled={busyAction !== null || !hasEmpNo}
                            >
                              PAUSE
                            </Button>
                            <Button
                              className={mergeClasses(styles.timeControlButton, styles.timeControlStop)}
                              appearance="secondary"
                              onClick={() => {
                                void scanOut();
                              }}
                              disabled={busyAction !== null || !hasEmpNo}
                            >
                              STOP
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                    {showQuickAddDuration ? (
                      <div className={styles.timeQuickColumn}>
                        <Body1 className={styles.sectionTitle}>Quick-add duration</Body1>
                        <div className={styles.quickAddWrap}>
                          <div className={styles.quickChip}>
                            <span className={styles.quickChipLabel}>+5m</span>
                            <Button
                              className={styles.quickChipAddButton}
                              appearance="secondary"
                              aria-label="Add 5 minutes"
                              onClick={() => addQuickMinutes(5)}
                              disabled={busyAction !== null || !hasEmpNo}
                            >
                              +
                            </Button>
                          </div>
                          <div className={styles.quickChip}>
                            <span className={styles.quickChipLabel}>+15m</span>
                            <Button
                              className={styles.quickChipAddButton}
                              appearance="secondary"
                              aria-label="Add 15 minutes"
                              onClick={() => addQuickMinutes(15)}
                              disabled={busyAction !== null || !hasEmpNo}
                            >
                              +
                            </Button>
                          </div>
                          <div className={styles.quickChip}>
                            <span className={styles.quickChipLabel}>+30m</span>
                            <Button
                              className={styles.quickChipAddButton}
                              appearance="secondary"
                              aria-label="Add 30 minutes"
                              onClick={() => addQuickMinutes(30)}
                              disabled={busyAction !== null || !hasEmpNo}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {!isAutomatedTimeCapture && !isManualTimeCapture && (
                    <div className={styles.manualDurationInline}>
                      <div className={styles.manualDurationRow}>
                        <span className={styles.manualDurationLabel}># of Minutes</span>
                        <Input
                          className={styles.manualDurationInput}
                          aria-label="# of Minutes"
                          value={manualDurationMinutes}
                          onChange={(_, data) => setManualDurationMinutes(data.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.rightColumn}>
          {!step || !selectedQueueItem ? null : (
            <>
              <div className={styles.sectionCard}>
                  <div className={styles.sectionCardHeader}>Material Used</div>
                  <div className={mergeClasses(styles.sectionCardBody, styles.materialSectionBody)}>
                  <div className={styles.materialFlipScene}>
                    <div
                      className={mergeClasses(
                        styles.materialFlipCard,
                        isMaterialCardFlipped ? styles.materialFlipCardFlipped : undefined
                      )}
                    >
                      <div className={mergeClasses(styles.materialFlipFace, styles.materialFaceFront)}>
                        <Button
                          className={styles.materialAddButton}
                          appearance="secondary"
                          onClick={startAddMaterial}
                          disabled={busyAction !== null}
                        >
                          + ADD MATERIAL
                        </Button>
                        <div className={styles.materialListWrap}>
                          {sortedMaterials.length ? (
                            sortedMaterials.map((material) => (
                              <div key={material.id} className={styles.materialListCard}>
                                <div className={styles.materialListRow}>
                                  <span className={styles.materialName}>{material.materialName}</span>
                                </div>
                                <div className={styles.materialListRow}>
                                  <div className={mergeClasses(styles.materialMeta, styles.materialMetaRow)}>
                                    {material.lotBatch ? (
                                      <span className={styles.materialMetaPair}>
                                        <span className={styles.materialMetaLabel}>Lot:</span>
                                        <span className={styles.materialMetaValue}>{material.lotBatch}</span>
                                      </span>
                                    ) : null}
                                    <span className={styles.materialMetaPair}>
                                      <span className={styles.materialMetaLabel}>Qty:</span>
                                      <span className={styles.materialMetaValue}>{material.quantity}</span>
                                    </span>
                                  </div>
                                  <div className={styles.materialActionRow}>
                                    <Button
                                      className={mergeClasses(styles.materialRowButton, styles.materialEditButton)}
                                      appearance="secondary"
                                      onClick={() => startEditMaterial(material)}
                                      disabled={busyAction !== null}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      className={mergeClasses(styles.materialRowButton, styles.materialRemoveButton)}
                                      appearance="transparent"
                                      onClick={() => requestRemoveMaterial(material)}
                                      disabled={busyAction !== null}
                                    >
                                      <span className={styles.materialRemoveIcon}>-</span>
                                      REMOVE
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <Body1>No materials added yet.</Body1>
                          )}
                        </div>
                      </div>
                      <div className={mergeClasses(styles.materialFlipFace, styles.materialFaceBack)}>
                        <div className={styles.materialBackGrid}>
                          <div className={styles.materialBackFormColumn}>
                            <div className={styles.stacked}>
                              <Field label="Part Item Id">
                                <Button
                                  className={styles.materialItemPickerButton}
                                  appearance="secondary"
                                  onClick={() => setIsItemDialogOpen(true)}
                                >
                                  {selectedMaterialItem
                                    ? `${selectedMaterialItem.itemNo} - ${selectedMaterialItem.itemDescription ?? "--"}`
                                    : "Select Item"}
                                </Button>
                              </Field>
                              <Field label="Lot / Batch #">
                                <Input
                                  value={materialLotBatch}
                                  onChange={(_, data) => setMaterialLotBatch(data.value)}
                                />
                              </Field>
                            </div>
                            <div className={styles.materialBackActions}>
                              <Button
                                className={styles.tallButton}
                                appearance="secondary"
                                onClick={() => {
                                  setIsMaterialCardFlipped(false);
                                  resetMaterialForm();
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                className={styles.tallButton}
                                appearance="primary"
                                onClick={() => void saveMaterial()}
                                disabled={busyAction !== null}
                              >
                                {editingMaterialId ? "Update Material" : "Save Material Entry"}
                              </Button>
                            </div>
                          </div>
                          <div className={styles.materialKeypad}>
                            <Field label="Quantity">
                              <Input
                                value={materialQuantity}
                                onChange={(_, data) => setMaterialQuantity(data.value)}
                              />
                            </Field>
                            <div className={styles.materialKeypadGrid}>
                              <button
                                type="button"
                                className={styles.materialKeypadButton}
                                onClick={() => appendQuantityDigit("7")}
                              >
                                7
                              </button>
                              <button
                                type="button"
                                className={styles.materialKeypadButton}
                                onClick={() => appendQuantityDigit("8")}
                              >
                                8
                              </button>
                              <button
                                type="button"
                                className={styles.materialKeypadButton}
                                onClick={() => appendQuantityDigit("9")}
                              >
                                9
                              </button>
                              <button
                                type="button"
                                className={mergeClasses(
                                  styles.materialKeypadButton,
                                  styles.materialKeypadButtonAction,
                                  styles.materialKeypadBackspaceButton
                                )}
                                onClick={() => appendQuantityDigit("DEL")}
                                aria-label="Backspace"
                              >
                                <span className={styles.materialKeypadBackspaceIcon}>
                                  <Backspace24Filled />
                                </span>
                              </button>
                              <button
                                type="button"
                                className={styles.materialKeypadButton}
                                onClick={() => appendQuantityDigit("4")}
                              >
                                4
                              </button>
                              <button
                                type="button"
                                className={styles.materialKeypadButton}
                                onClick={() => appendQuantityDigit("5")}
                              >
                                5
                              </button>
                              <button
                                type="button"
                                className={styles.materialKeypadButton}
                                onClick={() => appendQuantityDigit("6")}
                              >
                                6
                              </button>
                              <button
                                type="button"
                                className={mergeClasses(styles.materialKeypadButton, styles.materialKeypadButtonAction)}
                                onClick={() => appendQuantityDigit("CLR")}
                              >
                                CLR
                              </button>
                              <button
                                type="button"
                                className={styles.materialKeypadButton}
                                onClick={() => appendQuantityDigit("1")}
                              >
                                1
                              </button>
                              <button
                                type="button"
                                className={styles.materialKeypadButton}
                                onClick={() => appendQuantityDigit("2")}
                              >
                                2
                              </button>
                              <button
                                type="button"
                                className={styles.materialKeypadButton}
                                onClick={() => appendQuantityDigit("3")}
                              >
                                3
                              </button>
                              <div className={styles.materialKeypadSpacer} aria-hidden="true" />
                              <button
                                type="button"
                                className={mergeClasses(styles.materialKeypadButton, styles.materialKeypadButtonWide)}
                                onClick={() => appendQuantityDigit("0")}
                              >
                                0
                              </button>
                              <button
                                type="button"
                                className={mergeClasses(styles.materialKeypadButton, styles.materialKeypadButtonEnter)}
                                onClick={() => setInfo("Quantity entered.")}
                              >
                                ENTER
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                {showScrapCapture ? (
                  <div className={styles.sectionCard}>
                    <div className={styles.sectionCardHeader}>
                      <span className={styles.sectionCardHeaderIcon}>
                        <Alert24Regular />
                      </span>
                      Scrap Capture
                    </div>
                    <div className={styles.sectionCardBody}>
                      <Body1 className={styles.requiredLabel}>
                        {step.requiresScrapEntry ? "Required before complete." : "Optional."}
                      </Body1>
                      <div className={styles.fieldGrid}>
                        <Field label="Scrap Quantity">
                          <Input value={scrapQuantity} onChange={(_, data) => setScrapQuantity(data.value)} />
                        </Field>
                        <Field label="Scrap Reason">
                          <Select value={scrapReasonId} onChange={(event) => setScrapReasonId(event.target.value)}>
                            <option value="">Select reason</option>
                            {scrapReasons.map((reason) => (
                              <option key={reason.id} value={reason.id}>
                                {reason.name}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      </div>
                      <Button
                        className={styles.tallButton}
                        onClick={() => void addScrap()}
                        disabled={busyAction !== null || !hasEmpNo}
                      >
                        Add Scrap
                      </Button>
                    </div>
                  </div>
                ) : null}

                {showBatchSerialSection ? (
                  <div className={styles.sectionCard}>
                    <div className={styles.sectionCardHeader}>Serial Numbers</div>
                    <div className={styles.sectionCardBody}>
                      <div className={styles.stacked}>
                        <Body1 className={styles.requiredLabel}>Serial required.</Body1>
                        <div className={styles.fieldGrid}>
                          <Field label="Serial No">
                            <Input value={serialNo} onChange={(_, data) => setSerialNo(data.value)} />
                          </Field>
                          <Field label="Manufacturer">
                            <Input value={serialManufacturer} onChange={(_, data) => setSerialManufacturer(data.value)} />
                          </Field>
                          <Field label="Manuf. Date">
                            <Input value={serialManufactureDate} onChange={(_, data) => setSerialManufactureDate(data.value)} />
                          </Field>
                          <Field label="Test Date">
                            <Input value={serialTestDate} onChange={(_, data) => setSerialTestDate(data.value)} />
                          </Field>
                          <Field label="Lid Color">
                            <Select value={serialLidColorId} onChange={(event) => setSerialLidColorId(event.target.value)}>
                              <option value="">Select lid color</option>
                              {lidColors.map((color) => (
                                <option key={color.id} value={color.id}>
                                  {color.name}
                                </option>
                              ))}
                            </Select>
                          </Field>
                          <Field label="LidSize">
                            <Select value={serialLidSize} onChange={(event) => setSerialLidSize(event.target.value)}>
                              <option value="">Select lid size</option>
                              {lidSizes.map((size) => (
                                <option key={size.id} value={size.id}>
                                  {formatLidSizeLabel(size)}
                                </option>
                              ))}
                            </Select>
                          </Field>
                          <Field label="Status">
                            <Select
                              value={serialConditionStatus}
                              onChange={(event) => setSerialConditionStatus(event.target.value)}
                            >
                              <option value="Good">Good</option>
                              <option value="Bad">Bad</option>
                            </Select>
                          </Field>
                        </div>
                        <Button
                          className={styles.tallButton}
                          onClick={() => void addSerial()}
                          disabled={busyAction !== null || !hasEmpNo}
                        >
                          Add Serial
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {step.requiresAttachment ? (
                  <div className={styles.sectionCard}>
                    <div className={styles.sectionCardHeader}>
                      <span className={styles.sectionCardHeaderIcon}>
                        <ArrowUpload24Regular />
                      </span>
                      Attachments
                    </div>
                    <div className={styles.sectionCardBody}>
                      <div className={styles.actionRow}>
                        <Button className={styles.tallButton} appearance="secondary">
                          <span className={styles.buttonWithIcon}>
                            <span className={styles.buttonIcon}>
                              <ArrowUpload24Regular />
                            </span>
                            Upload File
                          </span>
                        </Button>
                      </div>
                      <div className={styles.attachmentArea}>Drag files here or use buttons</div>
                    </div>
                  </div>
                ) : null}
            </>
          )}
        </div>
      </div>

      <Dialog open={isItemDialogOpen} onOpenChange={(_, data) => setIsItemDialogOpen(data.open)}>
        <DialogSurface className={styles.itemDialogSurface}>
          <DialogBody className={styles.itemDialogBody}>
            <DialogTitle>Select Item</DialogTitle>
            <DialogContent className={styles.itemDialogContent}>
              <div className={styles.itemPickerTopRow}>
                <Input
                  type="search"
                  value={itemSearchQuery}
                  onChange={(_, data) => setItemSearchQuery(data.value)}
                  placeholder="Search item number or description..."
                  aria-label="Search items"
                />
                <div className={styles.productLineFilterRow}>
                  {availableProductLineFilters.map((line) => (
                    <Button
                      key={line}
                      appearance={selectedProductLineFilter === line ? "primary" : "secondary"}
                      onClick={() => setSelectedProductLineFilter(line)}
                    >
                      {line}
                    </Button>
                  ))}
                </div>
              </div>
              {itemLookupError ? <Body1>{itemLookupError}</Body1> : null}
              <div className={styles.itemPickerList}>
                {filteredItems.map((item) => (
                  <Button
                    key={item.id}
                    appearance="secondary"
                    className={styles.itemPickerButton}
                    onClick={() => {
                      setSelectedMaterialItem(item);
                      setMaterialPartItemId(item.id.toString());
                      setIsItemDialogOpen(false);
                    }}
                  >
                    <div>
                      <div>{`${item.itemNo} - ${item.itemDescription ?? "--"}`}</div>
                      <div className={styles.itemPickerMeta}>{item.productLine ?? "--"}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </DialogContent>
            <DialogActions className={styles.itemDialogActions}>
              <Button appearance="secondary" onClick={() => setIsItemDialogOpen(false)}>
                Cancel
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={materialPendingRemoval !== null}
        onOpenChange={(_, data) => {
          if (!data.open) {
            setMaterialPendingRemoval(null);
          }
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Remove Material Entry</DialogTitle>
            <DialogContent>
              {materialPendingRemoval
                ? `Are you sure you want to remove '${materialPendingRemoval.materialName}' from Material Used?`
                : "Are you sure you want to remove this material entry?"}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setMaterialPendingRemoval(null)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={confirmRemoveMaterial}>
                Remove
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

    </main>
  );
}
