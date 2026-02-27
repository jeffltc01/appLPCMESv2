# LPC MES v2 — General Design Input

## 1) Document Control

- **Version:** v0.1 (Draft)
- **Status:** Draft for cross-functional review
- **Purpose:** Provide shared requirements and constraints that apply to all LPC MES v2 features unless a feature spec explicitly overrides them.

## 2) Product Context

LPC MES v2 supports a small-to-mid-size job shop refurbishment business with mixed transportation modes, variable routing by line, and strict operational handoffs between office, transportation, receiving, production, supervisor/quality, and invoicing teams.

The product must optimize for:
- High-volume repetitive data entry in office workflows.
- Scan-first shop-floor execution on shared devices.
- Deterministic and auditable status transitions.
- Practical operations under real-world constraints (day-boundary continuity, urgent jobs, partial information, occasional network disruption).

## 3) Scope Baseline

The current baseline functional scope is defined by:
- `designInput/SPEC_ORDER_TO_CASH_STATUS_FLOW.md`
- `designInput/SPEC_WORKCENTER_OPERATOR_WORKFLOW.md`
- `designInput/SPEC_DATA_REFERENCE.md`
- `designInput/SECURITY_ROLES.md`

If two docs conflict:
1. This document defines global architectural and non-functional rules.
2. Feature specs define feature behavior.
3. Implementation details must not violate `REFERENCE_ARCHITECTURE.md`.

## 4) Core Design Principles

1. **Event-driven state changes**
   - Status changes must be triggered by explicit events and validations, not hidden side effects.
2. **Execution truth at line/step level**
   - Order-header status is a projection for operations and reporting.
3. **Audit-first**
   - Any action that can affect compliance, shipment, invoice readiness, or customer commitment must be attributable.
4. **Config over hardcoding**
   - Work-center behavior, role permissions, and route assignments are configuration-driven.
5. **Cloud-ready by default**
   - No local-only assumptions for paths, ports, identity, storage, or deployment topology.

## 5) User and Device Assumptions

- Office users are primarily desktop users.
- Shop-floor operators frequently use shared tablets or kiosk-like stations.
- Barcode scanning is the primary operator action model where supported.
- Device sessions may span shifts unless explicit sign-out/lock controls are enforced.
- Identity model uses a single application user profile linked to one or more external identities.

Minimum device/UX assumptions:
- Touch targets >= 44x44 px in operator flows.
- Single-action latency target <= 1.5s under normal load.
- Clear recovery guidance for failed API actions.

### 5.1 Identity and Login Baseline

- LPC MES keeps a canonical application `Users` profile table for role/site resolution and audit identity.
- Authentication providers:
  - Office users: Microsoft Entra ID SSO.
  - Shop-floor users: Entra External ID/B2C local credentials (managed by B2C).
- Application must map token identity claims (`issuer` + `sub`/`oid`) to internal user records through an identity-link table.
- Application-managed passwords or PIN secrets are out of scope; credential verification remains with identity providers.
- Shared device usage must support explicit user switch and privilege reset between sessions.

## 6) Non-Functional Requirements (Global)

### 6.1 Reliability and Availability

- System should degrade gracefully for non-critical failures (for example, attachment email failure must not corrupt operational state).
- Long-running integrations must expose correlation IDs and retry-safe semantics.
- Critical transitions (`DispatchedOrPickupReleased`, `InvoiceReady`, `Invoiced`) must be idempotent-safe.

### 6.2 Performance

- API p95 target:
  - Operator transactional endpoints: <= 1.5 seconds
  - Dashboard/board queries: <= 2.0 seconds
- Queue/list endpoints must support pagination and server-side filtering.

### 6.3 Concurrency

- Concurrent updates on the same order/line/step must use optimistic concurrency controls.
- Conflict responses must be user-actionable (who changed what and when, if available).

### 6.4 Security and Privacy

- AuthN via Entra ID / Entra External ID (B2C) and app-level RBAC from database.
- No secrets in source code.
- Sensitive operational data exports must be role-controlled.
- Audit trails must be tamper-evident within application constraints.
- Identity-link records must be unique per provider/issuer/subject and validated server-side on every token-authenticated request.

### 6.5 Operability

- Structured logs must include order IDs, line IDs, user identifiers, and correlation IDs where relevant.
- Exceptions must be diagnosable without requiring database-level manual forensics for normal support cases.

## 7) Data Governance and Audit

- All key business events require UTC timestamps.
- User identity fields should store stable employee/user identifiers, not display names.
- Derived/projection fields must be reproducible from source event data.
- Soft-delete or status-based archival is preferred over hard deletion for transactional entities.

## 8) Process Governance

- No controller-centric business logic for non-trivial workflows.
- Business rules belong in service/domain layers with test coverage.
- Each new cross-layer change must be traced:
  - Model -> migration -> service -> API DTO -> frontend type -> UI behavior -> tests.

## 9) Integration Expectations

- External integrations (ERP handoff, document delivery, future carrier integrations) must:
  - Use explicit adapter/service boundaries.
  - Persist request/response metadata and correlation IDs.
  - Support retry without duplicate side effects (idempotency key where possible).

## 10) Reporting Baseline

At minimum, the data model must support:
- Stage cycle-time reporting across status milestones.
- Queue aging by work center and status.
- Scrap/exception trend reporting by reason, item, and site.
- On-hold duration and owner accountability.
- Promise-date performance (on-time vs late with reason code).

## 11) Testing Baseline

Every feature implementation must include:
- Unit tests for business rule transitions and guardrails.
- Integration-level tests for critical API flows.
- UI tests for core path interactions and validation failures.
- Regression tests for bug fixes.

Operational test scenarios to include:
- End-of-day/start-of-day continuity with active work-in-progress.
- Concurrency conflict on same step.
- Integration failure and retry behavior for invoice submission.
- Hold overlay apply/clear and blocked forward transition behavior.

## 12) Out-of-Scope Defaults (Unless a Feature Spec Adds Them)

- Advanced finite-capacity auto-scheduling optimizer.
- Full maintenance CMMS workflows.
- Advanced machine telemetry ingestion/analytics.
- Complex credit/collections automation.

## 13) Open Decisions to Resolve Early

1. Required offline behavior for operator screens (none, read-only fallback, or queued write-through).
2. Policy for shared device sign-out/auto-lock in production areas.
3. Standard retention period for audit and operator activity logs.
4. Promise-date ownership and required reason code set for date changes.

