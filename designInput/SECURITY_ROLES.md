# LPC MES v2 — Security Roles and Permission Model

## 1) Document Control

- **Version:** v0.1 (Draft)
- **Status:** Draft for business and IT security review
- **Purpose:** Define role-based access model and approval boundaries for LPC MES v2 workflows.

## 2) Security Model Overview

LPC MES v2 uses:
- **Authentication**: Microsoft Entra ID (corporate) and Entra External ID/B2C (shop-floor/external as configured).
- **Authorization**: Application RBAC persisted in LPC MES database.
- **Credential policy**: Shop-floor credentials are B2C-managed only; the MES app does not store or validate local passwords/PINs.

Authorization decisions must consider:
- User role assignment(s)
- Site scope
- Feature permission
- Action sensitivity (standard, privileged, dual-control)

## 2.1 Identity Resolution Model

Application identity uses two linked layers:
- `Users` (canonical app profile used for roles, site access, and audit).
- `UserIdentities` (external identity links by provider, issuer, and subject key).

Runtime auth flow:
1. Validate JWT from Entra ID or B2C.
2. Resolve `UserIdentity` by (`ProviderType`, `Issuer`, `SubjectId`).
3. Resolve linked `User` record.
4. Load active role memberships and site scope before permission checks.

Guardrails:
- Identity link mismatch or inactive user must produce a `403`/access denied outcome.
- Role checks must always execute against internal app roles, not raw token role claims.

## 3) Role Catalog

Baseline roles:
- `Admin` — IT-level administration and emergency controls.
- `Setup` — Master data and configuration ownership.
- `Office` — Order entry validation and invoice operations.
- `Transportation` — Inbound/outbound logistics planning and release operations.
- `Receiving` — Physical intake and reconciliation.
- `Production` — Work-center execution and production data capture.
- `Supervisor` — Route review, approval gates, overrides, and exceptional control actions.
- `Quality` — Quality holds, checklist/inspection governance, and release authority for quality-related blocks.
- `PlantManager` — Site-level operational governance and privileged route/production interventions.
- `ReadOnly` — View-only operational visibility.

## 4) Permission Domains

### 4.1 Order Lifecycle Actions

- Create/edit `Draft` order
- Validate order entry (sales-mobile review path)
- Plan inbound logistics
- Mark inbound in transit
- Receive and reconcile
- Move to production-ready
- Trigger invoice submission workflow
- Cancel order
- Apply/clear hold overlays
- Commit initial promised date
- Revise committed promise date
- Record customer commitment-notification event

### 4.2 Production and Work-Center Actions

- Scan-in / scan-out step
- Complete work-center step
- Enter usage/scrap/serial/checklist/loading data
- Route review and route adjust
- Reopen route/step (privileged)
- Supervisor approve/reject

### 4.3 Configuration and Administration

- Manage work centers
- Manage route templates and assignments
- Manage lookup/reference data
- Manage role memberships
- Manage feature flags and site policies

### 4.4 Traceability and Genealogy Actions

- Capture component lot/batch identity at receiving
- Capture component serial identity where required
- Link component identity to production usage events
- Correct genealogy links (append-only correction event with reason)
- Record and attach quality evidence to order/line/produced context
- Query genealogy (`where-used`, `where-from`)

## 5) Minimum Permission Matrix

Legend:
- `A` = Allowed
- `R` = Allowed with reason code required
- `S` = Supervisor/PlantManager approval or same-role privileged permission
- `N` = Not allowed

| Capability | Admin | Setup | Office | Transportation | Receiving | Production | Supervisor | Quality | PlantManager | ReadOnly |
|---|---|---|---|---|---|---|---|---|---|---|
| Create/edit Draft order | A | N | A | N | N | N | A | N | A | N |
| Order-entry validation | A | N | A | N | N | N | A | N | A | N |
| Inbound logistics planning | A | N | A | A | N | N | A | N | A | N |
| Mark inbound in transit | A | N | N | A | N | N | A | N | A | N |
| Receive + reconcile | A | N | N | N | A | N | A | N | A | N |
| Start/complete production steps | A | N | N | N | N | A | A | N | A | N |
| Route validate/adjust pre-start | A | N | N | N | N | N | A | N | A | N |
| Supervisor gate approve/reject | A | N | N | N | N | N | A | A | A | N |
| Apply quality hold | A | N | N | N | N | N | A | A | A | N |
| Apply non-quality hold | A | N | A | A | A | A | A | A | A | N |
| Clear hold owned by same function | A | N | A | A | A | A | A | A | A | N |
| Clear hold owned by other function | A | N | N | N | N | N | S | S | A | N |
| Submit invoice to ERP staging | A | N | A | N | N | N | A | N | A | N |
| Cancel order | A | N | R | N | N | N | S | N | A | N |
| Commit initial promised date | A | N | A | N | N | N | A | N | A | N |
| Revise committed promise date | A | N | R | N | N | N | S | N | A | N |
| Record customer commitment notification | A | N | A | A | N | N | A | N | A | N |
| Manage templates/rules | A | A | N | N | N | N | A | N | A | N |
| Manage users/roles | A | N | N | N | N | N | N | N | N | N |
| Read operational data | A | A | A | A | A | A | A | A | A | A |
| Capture component identity (receiving) | A | N | N | N | A | N | A | A | A | N |
| Link component usage in production | A | N | N | N | N | A | A | N | A | N |
| Correct genealogy links | A | N | N | N | N | N | S | S | A | N |
| Record quality evidence linkage | A | N | A | N | A | A | A | A | A | N |
| Query genealogy (where-used/where-from) | A | A | A | A | A | A | A | A | A | A |

## 6) Approval and Override Rules

1. **Supervisor Override Requirement**
   - Any configured `ChecklistFailurePolicy = AllowWithSupervisorOverride` requires authenticated supervisor (or PlantManager) action and reason.
2. **Cross-Function Hold Clear**
   - A role cannot clear another function's hold without supervisory authority unless policy explicitly allows.
3. **Route Reopen After Execution Start**
   - Reopening route edits after first scan-in is privileged; requires `Supervisor` or `PlantManager` and a reason.
4. **Order Cancellation**
   - Cancellation is terminal; requires reason code and elevated permission.
5. **Invoice Submission**
   - Invoice submission requires role permission and complete pre-submit checks as defined in status spec.
6. **Promise-Date Revision**
   - Any revision of committed promise date requires reason code and audit context; Office may revise directly, while Supervisor/PlantManager can approve privileged exceptions.

## 7) Site Scope Rules

- Users are assigned one or more permitted `SiteId` values.
- All mutating actions must validate site scope at API layer.
- Cross-site actions are blocked unless explicitly granted (typically `Admin` or designated multi-site managers).

## 8) Identity and Session Requirements

- Use stable employee/user identifiers for audit fields.
- For shared devices, support explicit user switch without stale privileges.
- Privileged actions should require recent authentication evidence (policy-based re-auth prompt recommended).
- For shop-floor accounts, password policy, reset, and lockout are handled by B2C configuration, not by MES.
- If user auto-provisioning is used, it must never auto-assign privileged roles.

## 9) Audit Requirements

At minimum, audit events must include:
- `ActorId` / employee identifier
- Role context at time of action
- Action type
- Entity identifiers (`SalesOrderId`, `SalesOrderDetailId`, route/step IDs as applicable)
- Timestamp UTC
- Reason code/note for privileged or exceptional actions
- Correlation ID for integration-affecting actions

## 10) Implementation Guardrails

- Never rely on frontend role checks alone.
- Enforce permissions server-side for every mutating endpoint.
- Return explicit `403` semantics and structured error payload for unauthorized attempts.
- Avoid embedding role names in business logic branches where policy-based permission keys can be used.

## 11) Open Decisions for Security Review

1. Whether dual approval is required for specific high-risk actions (for example: cancellation after dispatch).
2. Whether supervisor override should be allowed across all sites or only within assigned site.
3. Preferred shop-floor sign-in UX within B2C policy options (username/password, passkey, or badge-assisted brokered flow).
4. Session timeout and auto-lock policy by device type and role sensitivity.

