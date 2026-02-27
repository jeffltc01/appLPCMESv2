# LPC MES v2 Specification: Component Lot/Batch Traceability and Genealogy

## 1) Document Control

- **Version:** v0.1 (Draft)
- **Status:** Draft for business and implementation review
- **Scope:** Define lot/batch traceability, optional serial linkage, line-level quality evidence linkage, and genealogy queries.
- **Out of scope (v0.1):**
  - Certificate of Conformance (CoC) generation or mandatory CoC release checks
  - External customer certificate portals
  - Regulatory framework expansion beyond current LPC internal quality and ASME-aligned operation

## 2) Business Goal

LPC needs auditable, queryable genealogy from purchased component identity to produced tank identity so that teams can answer:

- Where a component lot/serial was used (`where-used`)
- Which upstream components fed a produced unit/lot (`where-from`)
- Which test results are linked to each line/serial context

The solution must support mixed operations:

- Vendor-supplied components are primarily lot/batch tracked
- Some components may also carry serial numbers
- Finished output can be serial-based (larger tanks) or lot-based (smaller non-serialized tanks)

## 3) Key Design Decisions (Confirmed)

1. **Internal quality-first scope**
   - No mandatory CoC workflow in MVP.
2. **Mixed granularity**
   - Lot/batch is baseline.
   - Serial capture is enabled only when present/required by item/workflow policy.
3. **Produced lot identity for non-serialized output**
   - Use `SalesOrderNo-LineNo` as the business lot key.
   - Also store an internal immutable lot key for reliable split/merge/rework handling.
4. **Line-step execution is traceability truth**
   - Consumption and genealogy links are created from receiving and step-level usage events.

## 4) Canonical Terms

- `ComponentLot`: Vendor-provided lot/batch identifier for a received component item.
- `ComponentSerial`: Vendor-provided serial number when available.
- `ProducedLot`: Internal produced lot identity for output that is not uniquely serialized.
- `ProducedSerial`: Internal produced serial identity for serialized output.
- `TraceLink`: Immutable relationship connecting consumed component identity to produced identity context.
- `QualityEvidence`: Test/certification/inspection record linked to order-line and produced identity context.

## 5) Data Contract (Specification-Level)

### 5.1 New Entity: `ComponentIdentity`

Represents unique received component trace units.

Required fields:
- `Id` (`bigint`)
- `SiteId` (`int`)
- `ItemId` (`int`)
- `VendorId` (`int?`)
- `ComponentLotNo` (`string`, required for lot-tracked components)
- `ComponentSerialNo` (`string?`, required only when serial-tracked)
- `ReceiptTxnId` (`bigint?`)
- `ReceivedUtc` (`datetime UTC`)
- `ReceivedByEmpNo` (`string`)
- `SourceDocumentRef` (`string?`) (packing list, MTR, supplier doc id)
- `IsConsumed` (`bool`, derived/projection)

Indexes (minimum):
- (`SiteId`, `ItemId`, `ComponentLotNo`)
- (`SiteId`, `ComponentSerialNo`) filtered for non-null values

### 5.2 New Entity: `ProducedIdentity`

Represents traceable output identity target.

Required fields:
- `Id` (`bigint`)
- `SiteId` (`int`)
- `SalesOrderId` (`int`)
- `SalesOrderDetailId` (`int`)
- `ProducedIdentityType` (`enum`: `Lot`, `Serial`)
- `ProducedLotKeyInternal` (`string`, immutable)
- `ProducedLotKeyBusiness` (`string`) (default `SalesOrderNo-LineNo` for lot mode)
- `ProducedSerialNo` (`string?`, required for serial mode)
- `QuantityBasis` (`decimal`)
- `CreatedUtc` (`datetime UTC`)
- `CreatedByEmpNo` (`string`)

Rules:
- `ProducedIdentityType = Lot` requires `ProducedLotKeyBusiness`.
- `ProducedIdentityType = Serial` requires `ProducedSerialNo`.
- `ProducedLotKeyInternal` is immutable and used for all link joins.

### 5.3 New Entity: `ComponentConsumptionLink`

Immutable genealogy edge from consumed component identity to produced identity.

Required fields:
- `Id` (`bigint`)
- `SiteId` (`int`)
- `ComponentIdentityId` (`bigint`)
- `ProducedIdentityId` (`bigint`)
- `SalesOrderId` (`int`)
- `SalesOrderDetailId` (`int`)
- `OrderLineRouteStepInstanceId` (`bigint?`)
- `QuantityConsumed` (`decimal`)
- `Uom` (`string?`)
- `LinkedUtc` (`datetime UTC`)
- `LinkedByEmpNo` (`string`)
- `LinkSource` (`enum`: `ReceivingAllocation`, `StepUsageCapture`, `ManualCorrection`)
- `CorrectionOfLinkId` (`bigint?`) (append-only correction model)

Rules:
- Link rows are append-only; corrections create a new row and reference prior link.
- Hard deletes are not allowed.

### 5.4 New Entity: `QualityEvidenceRecord`

Quality/test evidence metadata with attachment references.

Required fields:
- `Id` (`bigint`)
- `SiteId` (`int`)
- `EvidenceType` (`enum`: `TestResult`, `InspectionResult`, `MaterialCert`, `Other`)
- `SalesOrderId` (`int`)
- `SalesOrderDetailId` (`int?`)
- `ProducedIdentityId` (`bigint?`)
- `ComponentIdentityId` (`bigint?`)
- `TestCode` (`string?`)
- `TestResultStatus` (`enum`: `Pass`, `Fail`, `Conditional`, `Info`)
- `ObservedUtc` (`datetime UTC`)
- `RecordedUtc` (`datetime UTC`)
- `RecordedByEmpNo` (`string`)
- `AttachmentId` (`bigint?`) (points to order attachment metadata/file provider)
- `Notes` (`string?`)

Linking policy:
- At minimum, evidence must link to `SalesOrderId`.
- For actionable traceability, evidence should also link to either `SalesOrderDetailId`, `ProducedIdentityId`, or `ComponentIdentityId`.

## 6) Workflow Touchpoints

### 6.1 Receiving

- Capture `ComponentLotNo` as required for lot-tracked items.
- Capture `ComponentSerialNo` only for serial-tracked items.
- Record receiving document references and timestamps.
- Optional: attach supplier test/cert docs as `QualityEvidenceRecord` (`MaterialCert` or `TestResult`).

### 6.2 Production Step Usage

- During required usage entry steps, operator selects/scans consumed component identity.
- System creates `ComponentConsumptionLink` rows to active produced identity context.
- For serial output, link to the specific `ProducedSerial`.
- For lot output, link to `ProducedLotKeyInternal`/`ProducedLotKeyBusiness`.

### 6.3 Completion, Release, and Rework

- On line completion/release, genealogy edges are locked from mutation.
- Rework/scrap does not remove links; system appends correction events (`CorrectionOfLinkId`).
- All read APIs must return both original and corrected genealogy history.

## 7) Genealogy Query Model

## 7.1 `where-used` Query

Question answered:
- Given component lot/serial, where was it used?

Input modes:
- `ComponentLotNo` (+ `ItemId`, `SiteId`)
- `ComponentSerialNo` (+ `SiteId`)

Minimum response payload:
- Consumed component identity fields
- Consuming `SalesOrderNo`, `LineNo`, `Item`
- Produced context (`ProducedSerialNo` or `ProducedLotKeyBusiness`)
- Quantity consumed and link timestamps
- Associated quality evidence summary counts

### 7.2 `where-from` Query

Question answered:
- Given produced serial/lot context, which component lots/serials were consumed?

Input modes:
- `ProducedSerialNo` (+ `SiteId`)
- `ProducedLotKeyBusiness` (+ `SalesOrderNo`, optional `LineNo`, `SiteId`)

Minimum response payload:
- Produced identity details
- Upstream component identities (item, lot, optional serial, vendor)
- Consumption quantities and timestamps
- Linked evidence summary and latest pass/fail indicators

### 7.3 Common Filters and Controls

- `SiteId` (required)
- Date window (`fromUtc`, `toUtc`)
- `ItemId`
- `CustomerId`
- `SalesOrderNo`
- Link status (`ActiveOnly`, `IncludeCorrected`)
- Pagination (`page`, `pageSize`)

Performance target:
- p95 query time <= 2.0 seconds for operationally bounded filters.

## 8) API Contract (Planned)

Read APIs:
- `GET /api/traceability/where-used`
- `GET /api/traceability/where-from`
- `GET /api/traceability/produced-identities/{id}`
- `GET /api/traceability/component-identities/{id}`
- `GET /api/traceability/evidence`

Write APIs:
- `POST /api/receiving/component-identities`
- `POST /api/production/traceability/consumption-links`
- `POST /api/quality/evidence`
- `POST /api/production/traceability/consumption-links/correction`

Validation baseline:
- Unknown identity references fail with deterministic validation errors.
- Cross-site link attempts are rejected.
- Serial-required items reject missing serial input.

## 9) RBAC and Audit Requirements

Role alignment with security spec:
- `Receiving`, `Supervisor`, `PlantManager`: create/update receiving component identity capture.
- `Production`, `Supervisor`, `PlantManager`: create consumption links during step execution.
- `Quality`, `Supervisor`, `PlantManager`, `Office` (policy-based): create evidence links.
- `ReadOnly` and all operational roles: query genealogy endpoints (site-scoped).
- Correction/reopen of frozen genealogy: `Supervisor` or `PlantManager` only with reason.

Required audit fields for every write:
- `ActorEmpNo`
- Role context at action time
- `SiteId`
- Entity IDs (`ComponentIdentityId`, `ProducedIdentityId`, `SalesOrderId`, `SalesOrderDetailId`, step id as applicable)
- `ActionType`
- `OccurredUtc`
- `ReasonCode`/`Notes` for overrides/corrections
- `CorrelationId` for integration-related evidence ingestion

## 10) Reporting and KPI Requirements

Minimum outputs:
- Traceability completeness by line (`% lines with required component identity links`)
- Evidence completeness by line/produced identity
- Missing lot/serial capture exceptions
- Corrected genealogy link count and aging
- Query volume and p95 latency by endpoint

## 11) Acceptance Criteria (MVP)

1. Component lot capture is enforceable on receiving for lot-tracked items.
2. Production usage can create deterministic component-to-produced genealogy links at line context.
3. Serial-capable flow supports produced serial mapping when required.
4. Lot-mode flow supports non-serialized output with business lot key default `SalesOrderNo-LineNo`.
5. `where-used` and `where-from` queries return complete, auditable chains with pagination and filters.
6. Test-result/evidence records can be linked to line and produced identity context.
7. All traceability writes are audit-attributed and site-scoped.

## 12) Post-MVP Roadmap (Non-Blocking)

1. Optional customer/order-type driven CoC generation package (PDF/attachment bundle).
2. CoC template governance by customer/item/site.
3. Automated CoC assembly from linked genealogy + evidence records.
4. Optional CoC requirement gates at release/invoice stages by policy.

