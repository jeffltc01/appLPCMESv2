# LPC MES v2 Specification: Order-to-Cash Status Model

## 1) Document Control

- **Version:** v0.1 (Draft)
- **Status:** Draft for business review
- **Scope:** Define a redesigned order-header status model for LPC's end-to-end order-to-cash lifecycle, independent of the legacy status names.
- **Out of scope (v0.1):**
  - General ledger posting design
  - Credit/collections workflow automation
  - Carrier EDI/API integrations
  - Detailed AR reconciliation screens

## 2) Business Goal

LPC needs a status framework that clearly represents operational progress and financial readiness from order creation through invoice posting in MES.

The model must:

- Reflect real plant and logistics execution points (receiving, production, dispatch, delivery/pickup).
- Separate physical production/shipping milestones from invoicing milestones.
- Support two transport branches:
  - LPC-arranged outbound delivery
  - Customer pickup from plant
- Provide explicit quality/supervisor gates where required.
- Remain simple at the order-header level while preserving line-level detail in route/work-center entities.

## 3) Key Design Decisions

- **Primary tracking level:** `SalesOrder` header status for boards, filtering, and cross-functional handoff.
- **Execution truth source:** Line-route/work-center records remain authoritative for production detail.
- **Status progression model:** Single main progression with controlled branching by transport mode.
- **Exception handling model:** Hold/exception overlays are separate from the main status sequence.
- **Rework handling model (v0.2 minimum):** Rework is a production/quality overlay that can reopen route completion and block invoice readiness until closed.
- **Financial control point:** Invoice readiness is triggered by release/dispatched event; delivery evidence is tracked separately and does not block invoicing.
- **Customer commitment model:** Requested/promised date governance is managed at order level with auditable change history, reason codes, and customer-notification events.

## 4) Proposed Main Status Flow

### 4.1 Ordered Sequence

1. `Draft`
2. `PendingOrderEntryValidation` (conditional for sales-mobile origin)
3. `InboundLogisticsPlanned` (conditional by mode)
4. `InboundInTransit` (conditional by mode)
5. `ReceivedPendingReconciliation`
6. `ReadyForProduction`
7. `InProduction`
8. `ProductionCompletePendingApproval` (conditional)
9. `ProductionComplete`
10. `OutboundLogisticsPlanned` (conditional by mode)
11. `DispatchedOrPickupReleased`
12. `InvoiceReady`
13. `Invoiced`

### 4.2 Intent of Each Status


| Status                              | Meaning                                                                                                                                           | Typical owner                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `Draft`                             | Order captured and editable before execution handoff.                                                                                             | Office / Sales                      |
| `PendingOrderEntryValidation`       | Sales-submitted order is awaiting order-entry review by centralized office staff before plant execution.                                          | Office                              |
| `InboundLogisticsPlanned`           | Inbound logistics/intake is planned (LPC pickup transport plan or expected customer dropoff intake plan). Optional for immediate walk-in dropoff. | Transportation / Office / Receiving |
| `InboundInTransit`                  | Inbound movement has started and assets are expected at plant. Used for LPC-arranged pickup; optional for customer dropoff.                       | Transportation                      |
| `ReceivedPendingReconciliation`     | Plant physically receives assets; reconciliation still required.                                                                                  | Receiving                           |
| `ReadyForProduction`                | Receiving reconciliation complete; lines are eligible for route execution.                                                                        | Receiving / Production              |
| `InProduction`                      | One or more required line routes are actively in process.                                                                                         | Production                          |
| `ProductionCompletePendingApproval` | Production steps complete but blocked by supervisor/quality gate.                                                                                 | Supervisor / Quality                |
| `ProductionComplete`                | All required lines complete and approved; order is complete from production and ready for outbound logistics/release.                             | Production / Transportation         |
| `OutboundLogisticsPlanned`          | Outbound logistics/release is planned (delivery transport scheduled or customer pickup appointment confirmed).                                    | Transportation / Office             |
| `DispatchedOrPickupReleased`        | Shipment departed or customer pickup release granted.                                                                                             | Transportation / Shipping           |
| `InvoiceReady`                      | Operationally eligible for invoice generation.                                                                                                    | Office                              |
| `Invoiced`                          | Customer invoice issued and posted in MES/ERP boundary.                                                                                           | Office / Accounting                 |


## 5) Branching Logic

### 5.1 Inbound Branch

Core inbound path:

`Draft` -> `InboundLogisticsPlanned` -> `ReceivedPendingReconciliation`

LPC-arranged inbound pickup path:

`Draft` -> `InboundLogisticsPlanned` -> `InboundInTransit` -> `ReceivedPendingReconciliation`

Sales-mobile intake path (future):

`Draft` -> `PendingOrderEntryValidation` -> `InboundLogisticsPlanned` -> (`InboundInTransit` if LPC pickup) -> `ReceivedPendingReconciliation`

Immediate customer dropoff path:

`Draft` -> `ReceivedPendingReconciliation`

Notes:

- Customer dropoff uses the same flow minus transit: it still must be received in `ReceivedPendingReconciliation`.
- `InboundLogisticsPlanned` is conditional for customer dropoff; planned dropoffs use it, immediate walk-ins can skip it.
- `InboundInTransit` is required for LPC pickup transport and optional/typically skipped for customer dropoff.
- Emergency/manual receive can transition directly to `ReceivedPendingReconciliation` with required reason code and audit.

### 5.2 Production Branch

`ReadyForProduction` -> `InProduction` -> (`ProductionCompletePendingApproval` if required) -> `ProductionComplete`

Notes:

- `InProduction` is a rollup projection from line-route state.
- If no supervisor/quality gate is configured, transition directly from `InProduction` completion to `ProductionComplete`.

### 5.3 Outbound Branch

Core outbound path:

`ProductionComplete` -> `DispatchedOrPickupReleased` -> `InvoiceReady`

LPC-arranged outbound delivery path:

`ProductionComplete` -> `OutboundLogisticsPlanned` -> `DispatchedOrPickupReleased` -> `InvoiceReady`

Customer pickup path:

`ProductionComplete` -> `DispatchedOrPickupReleased` -> `InvoiceReady`

Notes:

- For customer pickup, "dispatch" represents release at plant gate rather than carrier departure.
- `OutboundLogisticsPlanned` is used when scheduling/appointment work is needed; it may be skipped for same-day pickup release workflows.
- Delivery confirmation/POD is a separate evidence event and does not block `InvoiceReady`.

### 5.4 Financial Branch

`DispatchedOrPickupReleased` -> `InvoiceReady` -> `Invoiced`

Notes:

- `InvoiceReady` may represent a queue state for office batching.
- `Invoiced` is the terminal MES lifecycle status; payment and cash application continue in ERP.

### 5.4.1 Delivery Evidence Tracking (Non-Status)

Delivery evidence should be captured as optional audit events/fields, not as lifecycle status transitions.

- Example evidence artifacts: POD signature, receiver name, delivery timestamp, BOL completion, or carrier confirmation reference.
- Evidence can be captured before or after invoicing.
- Missing evidence may trigger an exception overlay/reporting alert, but does not block `InvoiceReady` by default.

### 5.5 Invoicing Submission Workflow (Office)

When an order is in `InvoiceReady`, office executes a controlled two-step submission workflow:

1. **Final office review**
  - Verify order completeness and correctness (customer/order details, line quantities, pricing).
  - Verify required paperwork is present and appropriate for the load (for example: serials, test results, and related supporting documents).
2. **Attachment email step (optional but prompted)**
  - If order attachments exist, user is prompted to optionally email attachments to the customer.
  - User can choose which attachments to send.
  - System provides a prefilled message template including order reference details.
3. **ERP invoice handoff**
  - After the attachment step (or immediately when no attachments exist), office submits invoice data to ERP integration staging.
  - Current integration path:
    - MES calls a Microsoft Power Automate flow endpoint
    - Flow inserts invoice payload into ERP temp/staging table
    - ERP background process consumes staging data and creates invoice

`Invoiced` in MES means invoice submission to ERP staging succeeded (and, when available, ERP acknowledgment/reference is recorded).

### 5.6 Invoice Submit Dialog UX (Draft Implementation Standard)

The invoice submit interaction should use a guided modal/wizard with explicit checkpoints to reduce submission errors and preserve auditability.

Step 1: **Final Review Confirmation**

- Show key order summary read-only: order number, customer, ship/pickup mode, line totals, quantity totals, and invoice total.
- Show checklist with explicit confirmations:
  - Required paperwork present (serial/test/supporting docs as applicable)
  - Quantity and pricing reviewed
  - Customer and billing details reviewed
- Primary action: `Continue to Attachments`
- Secondary action: `Cancel`

Validation:

- Cannot continue until all required review confirmations are checked.

Step 2: **Attachment Email (Conditional)**

- If no attachments exist, skip this step automatically and continue to submit confirmation.
- If attachments exist, present:
  - Attachment multi-select list (default preselect: all invoice-relevant docs)
  - Recipient field prefilled from customer contact(s), editable
  - Subject prefilled with order number
  - Message body template prefilled (editable)
- Actions:
  - `Send Email and Continue`
  - `Skip Email and Continue` (requires skip reason)
  - `Back`

Validation:

- `Send Email and Continue` requires at least one attachment selected and at least one valid recipient.
- `Skip Email and Continue` requires explicit reason selection or note.

Step 3: **ERP Submission Confirmation**

- Show non-editable summary of what will be sent to ERP (header + totals + line count).
- Show warning: submission creates invoice in legacy ERP via background integration and cannot be reversed from this dialog.
- Actions:
  - `Submit Invoice`
  - `Back`
  - `Cancel`

Submission behavior:

- Disable submit button after click and show progress indicator.
- Use idempotency/correlation key to avoid duplicate ERP staging inserts on retry.
- On success:
  - Show confirmation toast/dialog including correlation id (and ERP reference if returned).
  - Transition order status to `Invoiced`.
- On failure:
  - Keep order in `InvoiceReady`.
  - Show actionable error with retry option and support/debug details (correlation id, timestamp).

Audit requirements:

- Persist who completed final review, who sent/skipped attachment email, and who submitted to ERP.
- Persist selected attachments sent and recipient summary for audit traceability.
- Persist correlation id and staging result on each submission attempt.

### 5.7 Order Attachment Capability

Orders support file attachments throughout the lifecycle (not only during invoicing).

Core lifecycle operations:

- Upload attachment to order
- View/download attachment
- Mark attachment category/type
- Soft-delete attachment (audit-retained; role-restricted)

Attachment metadata (minimum):

- `AttachmentId`
- `OrderId`
- `FileName`
- `ContentType`
- `FileSizeBytes`
- `Category` (for example: `TestResult`, `SerialReport`, `PackingSlip`, `BillOfLading`, `CustomerDocument`, `Other`)
- `UploadedByEmpNo`
- `UploadedUtc`
- `IsDeleted` (soft delete flag)
- `DeletedByEmpNo` (nullable)
- `DeletedUtc` (nullable)

Validation and security:

- Allow-list file types (PDF and common image types at minimum; configurable by policy).
- Enforce max file size and max total attachment count per order.
- Reject executable/script file types.
- All upload/download/delete actions must be audit logged.
- Enforce role-based access for upload/delete actions per `SECURITY_ROLES.md`.

Status-stage expectations:

- Attachments may be added at any active lifecycle stage before `Invoiced`.
- `InvoiceReady` final review must show all invoice-relevant attachments.
- Invoice submission workflow can proceed with:
  - attachments emailed, or
  - email step explicitly skipped with reason.

Storage and deployment considerations:

- Use Azure-ready storage approach (for example: Blob Storage or configured file provider), not local hardcoded paths.
- Store references/metadata in SQL; store file payload in configured storage.
- Keep configuration-driven limits (allowed extensions, size limits, retention).

### 5.8 Promise-Date Commitment Governance (Order-Level)

Promise-date governance is a customer-commitment capability that runs in parallel with lifecycle statuses. It does not add new main statuses, but it introduces required controls for date ownership, auditability, and communication.

Core concepts:

- `RequestedDate` (canonical field: `RequestedDateUtc`): customer-requested delivery/release date captured at order entry.
- `PromisedDate` (canonical field: `PromisedDateUtc`): first formally committed date approved by authorized role.
- `CurrentCommittedDate` (canonical field: `CurrentCommittedDateUtc`): active customer commitment date used by downstream scheduling and service communication.
- `PromiseRevisionCount`: running count of commitment changes after first promise.

Governance rules:

- `RequestedDate` can be entered/updated while order is in pre-execution stages by authorized order-entry roles.
- First assignment of `PromisedDateUtc` is required before outbound release planning is finalized (`OutboundLogisticsPlanned` or direct release path by policy).
- Any change to `CurrentCommittedDateUtc` after initial commitment requires:
  - reason code,
  - optional free-text note when policy requires,
  - actor identity/timestamp,
  - customer-notification decision (`Notified`, `DeferredNotification`, or `InternalOnly` with policy restriction).
- Commitment-date changes are append-only events; prior values are not overwritten in history.
- Finite-capacity scheduling consumes `CurrentCommittedDateUtc` as the source of truth for latest-finish policy calculations.

Miss classification and notification:

- If actual release/invoice readiness exceeds `CurrentCommittedDateUtc`, order is considered late-to-commit and must carry a miss reason classification.
- Miss reason taxonomy is centrally governed and site-validated (capacity, material, quality, customer change, logistics, external dependency, other).
- Customer notification events must be auditable when commitment changes or misses occur.

## 6) Hold and Exception Overlay Model

These are not main flow states. They are orthogonal overlays with reason code and owner.

- `OnHoldCustomer`
- `OnHoldQuality`
- `OnHoldLogistics`
- `ExceptionQuantityMismatch`
- `ExceptionDocumentation`
- `Cancelled`
- `ReworkOpen`

Behavior:

- Overlay can be applied from most active statuses before closure.
- While overlay is active, forward transitions are blocked unless policy allows.
- Clearing overlay resumes from underlying main status.
- `Cancelled` is terminal and requires role authorization and audit reason.

### 6.2 Rework Overlay (Minimum v0.2 Baseline)

Rework overlays address refurbishment defects discovered during or after production and before invoice finalization.

Minimum rework trigger examples:

- In-process/final quality failure
- Operator defect report after a completed step
- Supervisor quality hold requiring corrective work

Rework state model (overlay lifecycle):

`Requested` -> `Approved` -> `InProgress` -> `VerificationPending` -> `Closed`

Terminal alternatives:

- `Cancelled` (opened in error or superseded)
- `Scrapped` (cannot be economically reworked)

Ownership (minimum):

- **Operator:** raise request with reason and affected step/line context
- **Supervisor/Quality:** approve disposition and verify closure
- **Production:** execute corrective work
- **Office:** read-only visibility; cannot submit invoice while blocking rework remains open

Status interaction guardrails:

- If rework opens while order is `InProduction`, production continues but completion rollup must wait for closure.
- If rework opens after `ProductionComplete` and before `Invoiced`, order must no longer be invoice-eligible until rework is closed and production validity is re-established.
- For v0.2, post-`Invoiced` production rework requires a controlled exception process outside normal main-flow transitions.

### 6.1 Customer Not Ready for Pickup (Priority Scenario)

When Transportation attempts to schedule or confirm LPC-arranged pickup and the customer reports they are not ready:

- Keep main lifecycle status at `InboundLogisticsPlanned` (do not advance to transit).
- Apply overlay:
  - `HoldOverlay = OnHoldCustomer`
  - `StatusReasonCode = CustomerNotReadyForPickup`
- Require owner and follow-up fields:
  - `StatusOwnerRole = Transportation`
  - `CustomerReadyRetryUtc` (required)
  - `CustomerReadyLastContactUtc` (required)
  - `CustomerReadyContactName` (required when available)
  - `StatusNote` with short context (free text)

Transition behavior:

- `InboundLogisticsPlanned` -> `InboundInTransit` is blocked while `OnHoldCustomer` is active.
- Hold can be cleared only after customer readiness confirmation is recorded.
- On clear, order remains at `InboundLogisticsPlanned` and can then proceed to `InboundInTransit`.

## 7) Transition Rules (Minimum)

1. `Draft` -> `PendingOrderEntryValidation` when order origin is `SalesMobile`.
2. `Draft` -> `InboundLogisticsPlanned` when order origin is `OfficeEntry`, inbound planning is needed, and required data is present.
3. `Draft` -> `ReceivedPendingReconciliation` when inbound mode is `CustomerDropoff` and tanks are physically present for immediate intake.
4. `PendingOrderEntryValidation` -> `InboundLogisticsPlanned` only after office validation is complete.
5. `PendingOrderEntryValidation` -> `ReceivedPendingReconciliation` when inbound mode is `CustomerDropoff` and tanks are already on site.
6. `InboundLogisticsPlanned` -> `InboundInTransit` when inbound mode is LPC-arranged pickup and transit has started.
7. `InboundLogisticsPlanned` -> `ReceivedPendingReconciliation` when customer dropoff arrives at plant.
8. `InboundInTransit` -> `ReceivedPendingReconciliation` upon physical arrival and intake event.
9. `ReceivedPendingReconciliation` -> `ReadyForProduction` only when receiving reconciliation is complete for required lines.
10. `ReadyForProduction` -> `InProduction` only when at least one required route step starts.
11. `InProduction` -> `ProductionComplete` only when all required line routes are completed and approvals satisfied.
12. `ProductionComplete` -> `OutboundLogisticsPlanned` when outbound scheduling/appointment planning is required.
13. `ProductionComplete` -> `DispatchedOrPickupReleased` when outbound logistics planning is not required (e.g., immediate customer pickup release).
14. `OutboundLogisticsPlanned` -> `DispatchedOrPickupReleased` when delivery dispatch or pickup release event occurs.
15. `DispatchedOrPickupReleased` -> `InvoiceReady` when release/dispatched event is captured and no blocking holds/exceptions remain.
16. `InvoiceReady` -> `Invoiced` only when:
  - Final office review is complete,
  - Attachment email step has been completed or explicitly skipped, and
  - ERP staging handoff (Power Automate flow endpoint -> temp table insert) succeeds.
17. Any state with active `ReworkOpen` overlay cannot transition forward to `InvoiceReady` or `Invoiced`.
18. If `ReworkOpen` is raised while status is `InvoiceReady`, status must revert to a production-valid pre-invoice status per policy (minimum default: `InProduction` until rework closure/verification).
19. `PromisedDateUtc` must be set before order can enter outbound release planning or direct release path per site policy.
20. Any update to `CurrentCommittedDateUtc` after first commitment requires a valid promise-change reason code and audit event.
21. If `CurrentCommittedDateUtc` is moved later than prior commitment, customer-notification intent must be explicitly recorded before save.

Overlay guardrail:

- Any forward transition is blocked when `HoldOverlay` is active, unless explicit policy exception is configured.
- Specifically, `InboundLogisticsPlanned` -> `InboundInTransit` is blocked for `OnHoldCustomer` with `CustomerNotReadyForPickup`.
- Specifically, `DispatchedOrPickupReleased` -> `InvoiceReady` and `InvoiceReady` -> `Invoiced` are blocked for `ReworkOpen`.

## 8) Role Ownership and Hand-off

- **Sales (future mobile):** Can create `Draft` orders.
- **Office:** `Draft`, `PendingOrderEntryValidation`, `InvoiceReady`, `Invoiced`
- **Transportation:** `InboundLogisticsPlanned`, `InboundInTransit`, `OutboundLogisticsPlanned`, `DispatchedOrPickupReleased`
- **Receiving:** `ReceivedPendingReconciliation`, contributes to `ReadyForProduction`
- **Production/Supervisor/Quality:** `ReadyForProduction`, `InProduction`, `ProductionCompletePendingApproval`, `ProductionComplete`
- **Promise-date ownership (minimum):** Office/customer-service owns first promise commit and revisions; Transportation/Production can propose but cannot finalize date changes without authorized approval.

Handoffs should be explicit and event-driven to avoid hidden status jumps.

## 9) Data and API Projection Guidance (For Implementation Phase)

### 9.1 Suggested Header Fields

- `OrderLifecycleStatus` (string enum; values from Section 4.1)
- `OrderOrigin` (`OfficeEntry`, `SalesMobile`, `Integration`)
- `InboundMode` (`LpcArrangedPickup`, `CustomerDropoff`)
- `OutboundMode` (`LpcArrangedDelivery`, `CustomerPickup`, `ParcelCarrier`)
- `StatusUpdatedUtc`
- `StatusOwnerRole`
- `StatusReasonCode` (nullable; required for exceptional/manual transitions)
- `StatusNote` (nullable)
- `HoldOverlay` (nullable enum from Section 6)
- `ValidatedByEmpNo` (nullable)
- `ValidatedUtc` (nullable)
- `DeliveryEvidenceStatus` (`NotRequired`, `Pending`, `Received`)
- `DeliveryEvidenceReceivedUtc` (nullable)
- `CustomerReadyRetryUtc` (nullable; required for `CustomerNotReadyForPickup`)
- `CustomerReadyLastContactUtc` (nullable)
- `CustomerReadyContactName` (nullable)
- `AttachmentCount` (int, derived/cached optional)
- `HasInvoiceRelevantAttachments` (bit, derived optional)
- `HasOpenRework` (bit, derived/cached optional)
- `ReworkBlockingInvoice` (bit, derived/cached optional)
- `RequestedDateUtc` (date/datetime UTC, nullable until captured)
- `PromisedDateUtc` (date/datetime UTC, nullable until first commit)
- `CurrentCommittedDateUtc` (date/datetime UTC, nullable until first commit; equals `PromisedDateUtc` initially)
- `PromiseDateLastChangedUtc` (nullable)
- `PromiseDateLastChangedByEmpNo` (nullable)
- `PromiseRevisionCount` (int, default `0`)
- `PromiseMissReasonCode` (nullable; required when order is late-to-commit by policy)

### 9.2 Suggested Derived Progress Fields

- `IsInboundComplete`
- `IsProductionComplete`
- `IsProductionCompleteForShipment`
- `IsInvoiceComplete`
- `IsReworkOpen`

These support board filters and KPI tiles without overloading status definitions.

### 9.3 Suggested Invoicing Integration Fields

- `InvoiceReviewCompletedByEmpNo` (nullable)
- `InvoiceReviewCompletedUtc` (nullable)
- `AttachmentEmailPrompted` (`bit`, default `0`)
- `AttachmentEmailSent` (`bit`, default `0`)
- `AttachmentEmailSentUtc` (nullable)
- `AttachmentEmailRecipientSummary` (nullable; audit-friendly masked summary)
- `InvoiceSubmissionRequestedByEmpNo` (nullable)
- `InvoiceSubmissionRequestedUtc` (nullable)
- `InvoiceSubmissionChannel` (for v1 integration: `PowerAutomateHttp`)
- `InvoiceSubmissionCorrelationId` (nullable; flow run id / trace id)
- `InvoiceStagingResult` (`Success`, `Failed`, `PendingAck`)
- `InvoiceStagingError` (nullable)
- `ErpInvoiceReference` (nullable)

### 9.4 Suggested Promise Governance Event Fields

- `PromiseChangeEventId`
- `OrderId`
- `OldCommittedDate` (nullable for first commit event)
- `NewCommittedDate`
- `PromiseChangeReasonCode`
- `PromiseChangeReasonNote` (nullable)
- `ChangedByEmpNo`
- `ChangedUtc`
- `CustomerNotificationStatus` (`Notified`, `DeferredNotification`, `InternalOnly`)
- `CustomerNotificationChannel` (nullable; e.g., `Email`, `Phone`, `Portal`)
- `CustomerNotificationUtc` (nullable)
- `CustomerNotificationByEmpNo` (nullable)

## 10) Reporting and KPI Alignment

The status model enables cycle-time measurement by stage:

- Draft (sales-mobile) -> order-entry validation lead time
- Inbound logistics planned -> received lead time
- Ready for production -> production complete lead time
- Production complete -> pickup released lead time (customer pickup mode)
- Dispatch/release -> invoice ready lead time
- Invoice ready -> invoiced lead time
- Customer not-ready hold duration (apply -> clear)
- Promise reliability: on-time-to-commit rate (`actual release or configured checkpoint` vs `CurrentCommittedDateUtc`)
- Promise reliability: average promise slip days for late orders
- Promise reliability: promise revision frequency by site/customer/reason
- Promise reliability: percent of slipped commitments with recorded customer notification

## 11) Migration and Compatibility Strategy

- Keep current `OrderStatus` during transition period.
- Introduce `OrderLifecycleStatus` in parallel.
- Build a deterministic mapping from legacy values to new values for historical orders.
- Move UI boards and API contracts to new field by feature flag/site rollout.
- Retire legacy status only after cross-functional sign-off.

### 11.1 Legacy Status Mapping (Initial)

Use this table as a starting/default mapping, then apply evidence-based overrides (Section 11.2).


| Legacy `OrderStatus`    | Default new status              | Notes                                                                                      |
| ----------------------- | ------------------------------- | ------------------------------------------------------------------------------------------ |
| `New`                   | `Draft`                         | If `OrderOrigin = SalesMobile` and not validated, use `PendingOrderEntryValidation`.       |
| `Ready for Pickup`      | `InboundLogisticsPlanned`       | Represents inbound arrangement/intake planning.                                            |
| `Pickup Scheduled`      | `InboundLogisticsPlanned`       | Promote to `InboundInTransit` when transport-start evidence exists.                        |
| `Received`              | `ReceivedPendingReconciliation` | Must be override-eligible to later statuses based on production/shipping/invoice evidence. |
| `Ready to Ship`         | `ProductionComplete`            | Promote to `OutboundLogisticsPlanned` or `DispatchedOrPickupReleased` if evidence exists.  |
| `Ready to Invoice`      | `InvoiceReady`                  | Direct map unless already invoiced.                                                        |
| `Invoiced` / `Complete` | `Invoiced`                      | Terminal MES state.                                                                        |


### 11.2 Evidence-Based Override Rules (Authoritative)

When legacy status is ambiguous (especially `Received`), calculate the furthest valid new status from factual events. Apply rules top-down:

1. If ERP staging/invoice submission succeeded -> `Invoiced`
2. Else if dispatch/pickup release event exists and no blocking hold -> `InvoiceReady`
3. Else if outbound dispatch/release event exists -> `DispatchedOrPickupReleased`
4. Else if outbound plan exists -> `OutboundLogisticsPlanned`
5. Else if production complete evidence exists (all required lines/routes complete and approved) -> `ProductionComplete`
6. Else if production started evidence exists -> `InProduction`
7. Else if receiving reconciliation complete -> `ReadyForProduction`
8. Else if receive event exists -> `ReceivedPendingReconciliation`
9. Else if inbound transit event exists -> `InboundInTransit`
10. Else if inbound planning/intake planning exists -> `InboundLogisticsPlanned`
11. Else if sales-mobile and not validated -> `PendingOrderEntryValidation`
12. Else -> `Draft`

### 11.3 Backfill Execution Pattern

Run migration as idempotent, auditable batches:

1. Add new nullable column `OrderLifecycleStatus`.
2. Compute proposed status into staging table/view (`OrderId`, `LegacyStatus`, `ProposedNewStatus`, `RuleApplied`, `ComputedUtc`).
3. Run dry-run report and business spot-check sample orders by site/date.
4. Update `SalesOrder.OrderLifecycleStatus` only for rows where proposed value differs.
5. Write audit records (`OrderId`, old/new status, rule used, migration batch id, migrated by, timestamp).
6. Re-run until no deltas; then switch UI/API reads to the new field.

Illustrative SQL-style pseudocode:

```sql
-- 1) Build proposal set (simplified example)
with status_proposal as (
  select
    so.OrderId,
    so.OrderStatus as LegacyStatus,
    case
      when inv.StagingSucceeded = 1 then 'Invoiced'
      when ship.DispatchOrReleaseUtc is not null and hold.BlockingHold = 0 then 'InvoiceReady'
      when ship.DispatchOrReleaseUtc is not null then 'DispatchedOrPickupReleased'
      when ship.OutboundPlanUtc is not null then 'OutboundLogisticsPlanned'
      when prod.AllRequiredLinesComplete = 1 and prod.AllRequiredApprovalsComplete = 1 then 'ProductionComplete'
      when prod.AnyLineInProduction = 1 then 'InProduction'
      when recv.ReconciliationComplete = 1 then 'ReadyForProduction'
      when recv.ReceivedUtc is not null then 'ReceivedPendingReconciliation'
      when inbound.InTransitUtc is not null then 'InboundInTransit'
      when inbound.PlannedUtc is not null then 'InboundLogisticsPlanned'
      when so.OrderOrigin = 'SalesMobile' and so.ValidatedUtc is null then 'PendingOrderEntryValidation'
      else 'Draft'
    end as ProposedNewStatus
  from SalesOrder so
  left join ...
)
-- 2) Apply only changed rows
update so
set OrderLifecycleStatus = p.ProposedNewStatus
from SalesOrder so
join status_proposal p on p.OrderId = so.OrderId
where isnull(so.OrderLifecycleStatus, '') <> p.ProposedNewStatus;
```

### 11.4 Cutover Guidance

- Keep write-path dual update temporarily: when legacy status changes, update new status projection.
- Switch reads (boards/filters/APIs) to `OrderLifecycleStatus` first with fallback to legacy where null.
- After stability window, freeze legacy status edits and deprecate legacy field usage in UI.

## 12) Open Decisions for Business Review

1. Who is the final authority for hold release when multiple overlays exist (e.g., quality + logistics)?
2. Should customer dropoff always skip `InboundInTransit`, or allow optional use when an appointment check-in event exists?
3. Should customer pickup always require `OutboundLogisticsPlanned`, or allow direct release from `ProductionComplete` by site policy?
4. If ERP staging insert succeeds but ERP invoice creation fails later, should MES remain `Invoiced` or show a separate ERP-reconcile exception overlay?
5. Should attachment email be mandatory for specific customers/order types, or always optional with explicit skip reason?
6. Should missing delivery evidence automatically raise `ExceptionDocumentation`, or only appear in a reporting queue?
7. Which attachment categories are required by customer/order type at `InvoiceReady` final review?
8. For orders reverted from `InvoiceReady` due to rework, should site policy always return to `InProduction`, or allow an intermediate `ProductionComplete`-adjacent validation queue?
9. Who owns enterprise-level promise reason taxonomy and allowed customer-notification policies by customer class?

## 13) Acceptance Criteria (Specification-Level)

- Stakeholders can identify current order stage without reading line-level detail.
- Status transitions are deterministic and auditable.
- Both outbound modes (carrier delivery, customer pickup) are represented without custom one-off statuses.
- Production completion gate supports configurable supervisor/quality approval.
- Invoice milestones are visible and reportable independently of physical fulfillment.

