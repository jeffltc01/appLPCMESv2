# LPC MES v2 — Data Reference Specification

## 1) Document Control

- **Version:** v0.1 (Draft)
- **Status:** Draft for implementation alignment
- **Purpose:** Define canonical field names, enums, and data semantics shared by backend, frontend, and integration boundaries.

## 2) Scope

This document provides a reference contract for:
- Order lifecycle and hold overlays
- Production route execution data
- Audit and integration correlation fields
- Shared enum/value sets

Primary related specs:
- `designInput/SPEC_ORDER_TO_CASH_STATUS_FLOW.md`
- `designInput/SPEC_WORKCENTER_OPERATOR_WORKFLOW.md`
- `designInput/SECURITY_ROLES.md`
- `designInput/SPEC_COMPONENT_TRACEABILITY_GENEALOGY.md`

## 3) Canonical Enumerations

### 3.1 Order Lifecycle Status

`OrderLifecycleStatus` values:
- `Draft`
- `PendingOrderEntryValidation`
- `InboundLogisticsPlanned`
- `InboundInTransit`
- `ReceivedPendingReconciliation`
- `ReadyForProduction`
- `InProduction`
- `ProductionCompletePendingApproval`
- `ProductionComplete`
- `OutboundLogisticsPlanned`
- `DispatchedOrPickupReleased`
- `InvoiceReady`
- `Invoiced`

### 3.2 Hold Overlay

`HoldOverlay` values:
- `OnHoldCustomer`
- `OnHoldQuality`
- `OnHoldLogistics`
- `ExceptionQuantityMismatch`
- `ExceptionDocumentation`
- `Cancelled`

### 3.3 Origin and Mode Enums

`OrderOrigin`:
- `OfficeEntry`
- `SalesMobile`
- `Integration`

`InboundMode`:
- `LpcArrangedPickup`
- `CustomerDropoff`

`OutboundMode`:
- `LpcArrangedDelivery`
- `CustomerPickup`
- `ParcelCarrier`

### 3.4 Production/Route Enums

`TimeCaptureMode`:
- `Automated`
- `Manual`
- `Hybrid`
- `MachineFeed` (future)
- `StandardTime` (future)

`DataCaptureMode`:
- `ElectronicRequired`
- `ElectronicOptional`
- `PaperOnly`

`RouteReviewState`:
- `Pending`
- `Validated`
- `Adjusted`
- `NotRequired`

`RouteInstanceState`:
- `Active`
- `PendingSupervisorReview`
- `Completed`
- `Cancelled`

`RouteStepState`:
- `Pending`
- `InProgress`
- `Completed`
- `Skipped`
- `Blocked`

`ChecklistFailurePolicy`:
- `BlockCompletion`
- `AllowWithSupervisorOverride`

`StepConditionStatus`:
- `Good`
- `Bad`

### 3.5 Invoice Integration Enums

`InvoiceSubmissionChannel`:
- `PowerAutomateSqlSp`

`InvoiceStagingResult`:
- `Success`
- `Failed`
- `PendingAck`

`DeliveryEvidenceStatus`:
- `NotRequired`
- `Pending`
- `Received`

### 3.6 Identity and Access Enums

`IdentityProviderType`:
- `EntraId`
- `ExternalIdB2C`

`UserState`:
- `Active`
- `Inactive`
- `Locked`

### 3.7 Traceability and Quality Evidence Enums

`ProducedIdentityType`:
- `Lot`
- `Serial`

`TraceLinkSource`:
- `ReceivingAllocation`
- `StepUsageCapture`
- `ManualCorrection`

`QualityEvidenceType`:
- `TestResult`
- `InspectionResult`
- `MaterialCert`
- `Other`

`QualityEvidenceResultStatus`:
- `Pass`
- `Fail`
- `Conditional`
- `Info`

## 4) Canonical Entity Field Sets

### 4.0 Identity and Authorization Core Entities

`User` (application profile):
- `Id` (`int`)
- `EmpNo` (`string`, unique, nullable for non-employee identities by policy)
- `DisplayName` (`string`)
- `Email` (`string?`)
- `DefaultSiteId` (`int?`)
- `State` (`string enum`, default `Active`)
- `IsActive` (`bool`)
- `CreatedUtc` (`datetime UTC`)
- `UpdatedUtc` (`datetime UTC`)

`UserIdentity` (external identity link):
- `Id` (`int`)
- `UserId` (`int`)
- `ProviderType` (`string enum`: `EntraId`, `ExternalIdB2C`)
- `Issuer` (`string`)
- `SubjectId` (`string`) (token `sub` or `oid` mapped consistently per provider)
- `LoginName` (`string?`) (display/audit convenience only)
- `IsPrimary` (`bool`)
- `CreatedUtc` (`datetime UTC`)
- `UpdatedUtc` (`datetime UTC`)

`UserRole`:
- `Id` (`int`)
- `UserId` (`int`)
- `RoleId` (`int`)
- `SiteId` (`int?`) (nullable means global; otherwise site-scoped assignment)
- `CreatedUtc` (`datetime UTC`)
- `CreatedBy` (`string`)

`UserSiteAccess` (optional but recommended):
- `Id` (`int`)
- `UserId` (`int`)
- `SiteId` (`int`)
- `CreatedUtc` (`datetime UTC`)

### 4.1 SalesOrder (Header)

Required cross-layer fields:
- `Id` (`int`)
- `SalesOrderNo` (`string`)
- `SiteId` (`int`)
- `CustomerId` (`int`)
- `OrderLifecycleStatus` (`string enum`)
- `OrderOrigin` (`string enum`)
- `InboundMode` (`string enum`)
- `OutboundMode` (`string enum`)
- `StatusUpdatedUtc` (`datetime UTC`)
- `StatusOwnerRole` (`string`)
- `StatusReasonCode` (`string?`)
- `StatusNote` (`string?`)
- `HoldOverlay` (`string enum?`)
- `Priority` (`int?`)
- `RequestedDateUtc` (`datetime UTC?`)
- `PromisedDateUtc` (`datetime UTC?`)
- `CurrentCommittedDateUtc` (`datetime UTC?`; equals `PromisedDateUtc` at first commit)
- `PromiseDateReasonCode` (`string?`)
- `PromiseDateReasonNote` (`string?`)
- `PromiseRevisionCount` (`int`, default `0`)
- `PromiseDateLastChangedUtc` (`datetime UTC?`)
- `PromiseDateLastChangedByEmpNo` (`string?`)
- `PromiseMissReasonCode` (`string?`)

Integration and invoice tracking:
- `InvoiceReviewCompletedByEmpNo` (`string?`)
- `InvoiceReviewCompletedUtc` (`datetime UTC?`)
- `AttachmentEmailPrompted` (`bool`)
- `AttachmentEmailSent` (`bool`)
- `AttachmentEmailSentUtc` (`datetime UTC?`)
- `AttachmentEmailRecipientSummary` (`string?`)
- `InvoiceSubmissionRequestedByEmpNo` (`string?`)
- `InvoiceSubmissionRequestedUtc` (`datetime UTC?`)
- `InvoiceSubmissionChannel` (`string enum?`)
- `InvoiceSubmissionCorrelationId` (`string?`)
- `InvoiceStagingResult` (`string enum?`)
- `InvoiceStagingError` (`string?`)
- `ErpInvoiceReference` (`string?`)

Delivery evidence and customer readiness:
- `DeliveryEvidenceStatus` (`string enum`)
- `DeliveryEvidenceReceivedUtc` (`datetime UTC?`)
- `CustomerReadyRetryUtc` (`datetime UTC?`)
- `CustomerReadyLastContactUtc` (`datetime UTC?`)
- `CustomerReadyContactName` (`string?`)

### 4.2 SalesOrderDetail (Line)

Required line-level fields:
- `Id` (`int`)
- `SalesOrderId` (`int`)
- `LineNo` (`int`)
- `ItemId` (`int`)
- `ItemType` (`string?`)
- `QuantityOrdered` (`decimal`)
- `QuantityReceived` (`decimal`)
- `QuantityCompleted` (`decimal`)
- `QuantityScrapped` (`decimal`)
- `ActiveLineRouteInstanceId` (`long?`)
- `PrimaryWorkCenterId` (`int?`)
- `LastCompletedStepSequence` (`int?`)
- `LastCompletedStepUtc` (`datetime UTC?`)

### 4.3 Route and Step Execution Entities

`OrderLineRouteInstance`:
- `Id`, `SalesOrderId`, `SalesOrderDetailId`
- `RouteTemplateId`, `RouteTemplateVersionNo`, `RouteTemplateAssignmentId`
- `State`, `CurrentStepSequence`, `StartedUtc`, `CompletedUtc`
- `RouteReviewState`, `RouteReviewedBy`, `RouteReviewedUtc`, `RouteReviewNotes`
- `SupervisorApprovalRequired`, `SupervisorApprovedBy`, `SupervisorApprovedUtc`

`OrderLineRouteStepInstance`:
- `Id`, `OrderLineRouteInstanceId`, `SalesOrderDetailId`
- `StepSequence`, `StepCode`, `StepName`, `WorkCenterId`
- `State`, `IsRequired`
- `DataCaptureMode`, `TimeCaptureMode`
- Requirement booleans (`RequiresScan`, `RequiresUsageEntry`, etc.)
- Scan/time fields (`ScanInUtc`, `ScanOutUtc`, `DurationMinutes`, `ManualDurationMinutes`, `ManualDurationReason`, `TimeCaptureSource`)
- Audit fields (`StartedByEmpNo`, `CompletedByEmpNo`, `CompletedUtc`)
- Exception fields (`BlockedReason`, `StepAdjustedBy`, `StepAdjustedUtc`, `StepAdjustmentReason`)

### 4.4 Supporting Step Data Entities

- `StepMaterialUsage`
- `StepScrapEntry`
- `StepSerialCapture`
- `StepChecklistResult`
- `OperatorActivityLog`

All must include:
- Link to route-step instance
- Actor identifier
- UTC timestamp
- Required business payload

### 4.5 Traceability and Genealogy Entities

`ComponentIdentity`:
- `Id`, `SiteId`, `ItemId`, `VendorId`
- `ComponentLotNo`, `ComponentSerialNo`
- `ReceiptTxnId`, `SourceDocumentRef`
- `ReceivedByEmpNo`, `ReceivedUtc`
- `IsConsumed` (derived/projection)

`ProducedIdentity`:
- `Id`, `SiteId`, `SalesOrderId`, `SalesOrderDetailId`
- `ProducedIdentityType` (`Lot`, `Serial`)
- `ProducedLotKeyInternal` (immutable internal key)
- `ProducedLotKeyBusiness` (business display key; lot mode default `SalesOrderNo-LineNo`)
- `ProducedSerialNo` (required when serial mode)
- `QuantityBasis`, `CreatedByEmpNo`, `CreatedUtc`

`ComponentConsumptionLink`:
- `Id`, `SiteId`
- `ComponentIdentityId`, `ProducedIdentityId`
- `SalesOrderId`, `SalesOrderDetailId`, `OrderLineRouteStepInstanceId`
- `QuantityConsumed`, `Uom`
- `LinkSource`, `CorrectionOfLinkId`
- `LinkedByEmpNo`, `LinkedUtc`

`QualityEvidenceRecord`:
- `Id`, `SiteId`, `EvidenceType`, `TestResultStatus`
- `SalesOrderId`, optional `SalesOrderDetailId`
- Optional `ProducedIdentityId`, optional `ComponentIdentityId`
- `TestCode`, `ObservedUtc`
- `AttachmentId`, `Notes`
- `RecordedByEmpNo`, `RecordedUtc`

## 5) Naming and Type Conventions

1. **UTC fields** use `Utc` suffix (`StatusUpdatedUtc`, `CompletedUtc`).
2. **Identifier fields**:
   - Numeric DB PKs as `Id` / `...Id`.
   - Employee/user IDs as `...EmpNo` or canonical user key field if centralized.
3. **Boolean fields**:
   - Prefix with `Is`, `Has`, `Requires`, `Allow`, or explicit action state names.
4. **Enums in API payloads**:
   - Use stable string values exactly matching this specification.
5. **Nullability**:
   - Nullable only where state progression makes value unavailable by design.

## 6) Lifecycle Event Definitions

Canonical events for audit and projection:
- `OrderDraftCreated`
- `OrderValidated`
- `InboundPlanned`
- `InboundTransitStarted`
- `OrderReceived`
- `ReceivingReconciled`
- `ProductionStarted`
- `ProductionCompleted`
- `SupervisorGateEntered`
- `SupervisorApproved`
- `OutboundPlanned`
- `DispatchOrPickupReleased`
- `InvoiceReviewCompleted`
- `InvoiceSubmittedToErpStaging`
- `InvoiceStagingSucceeded`
- `InvoiceStagingFailed`
- `HoldApplied`
- `HoldCleared`
- `OrderCancelled`
- `PromiseDateCommitted`
- `PromiseDateRevised`
- `PromiseMissClassified`
- `CustomerCommitmentNotificationRecorded`
- `ComponentIdentityCaptured`
- `ComponentConsumptionLinked`
- `ComponentConsumptionCorrected`
- `QualityEvidenceRecorded`

Each event record should minimally store:
- `EventType`
- `OccurredUtc`
- `ActorId`
- `SalesOrderId`
- Optional `SalesOrderDetailId`
- Optional `RouteStepInstanceId`
- `CorrelationId` (when integration-related)
- `ReasonCode` / `Notes` where required

## 7) Cross-Layer Contract Requirements

### 7.1 Backend API Contract

- DTO fields and enum values must match canonical names.
- Unknown enum values must fail fast with clear validation errors.
- Transition APIs must reject illegal state transitions deterministically.

### 7.2 Frontend Type Contract

- Frontend type definitions must map 1:1 to API field names for core workflow fields.
- UI status labels may be localized/friendly, but raw enum values must remain stable.

### 7.3 Database Contract

- Schema columns should preserve semantic alignment with canonical field names.
- Migration scripts must include backfill logic for new non-nullable lifecycle fields.
- Audit and integration fields should be indexed where queried operationally.

## 8) Validation Rules (Global)

- `OrderLifecycleStatus` transitions must follow configured transition rules.
- Hold overlays block forward transitions unless policy exception is explicit.
- `InvoiceReady -> Invoiced` requires successful staging handoff confirmation.
- `CurrentCommittedDateUtc` changes after first commit require `ReasonCode` and actor/timestamp audit context.
- When `CurrentCommittedDateUtc` moves later than prior commitment, a customer notification decision/event must be captured per policy.
- For manual/hybrid time capture overrides, reason text is required.
- For bad serial condition, scrap reason is required when policy enabled.
- `UserIdentity` must be unique by (`ProviderType`, `Issuer`, `SubjectId`).
- Shop-floor authentication must be validated by B2C; MES must not store app-managed passwords/PINs.
- Inactive/locked `User` records must be denied authorization even with otherwise valid identity tokens.
- Lot-tracked components require `ComponentLotNo` at receiving.
- Serial-tracked components require `ComponentSerialNo` at receiving and/or consumption capture per policy.
- `ProducedIdentityType = Lot` requires `ProducedLotKeyBusiness`.
- `ProducedIdentityType = Serial` requires `ProducedSerialNo`.
- `ComponentConsumptionLink` rows are append-only; corrections must create a new link with `CorrectionOfLinkId`.
- Every `QualityEvidenceRecord` must link to at least `SalesOrderId` and should include line or produced identity context when available.

## 9) Open Data Decisions

1. Canonical field and retention strategy for document URIs (packing slip, BOL, attachments).
2. Final standard for user identity field in audits (`EmpNo`, `UserId`, or both).
3. Whether a dedicated immutable event store table is required in MVP or post-MVP.
4. Promise-date change reason code taxonomy ownership and governance.
5. Whether full genealogy correction history is shown by default or only with an explicit flag.
6. Whether any customer/item/site policies should require serial-level evidence linkage beyond lot-level minimum.

