# Phase 0 Baseline + Gap Lock

## Purpose

Freeze current implementation behavior against `SPEC_WORKCENTER_OPERATOR_WORKFLOW.md` sections 4-17 so refactors can be measured without ambiguity.

Status legend:
- `Implemented`: behavior is present and exercised in code/tests.
- `Partial`: some behavior exists, but coverage or scope is incomplete.
- `Missing`: no implementation evidence in current app flow.

## Spec Checklist Matrix (Sections 4-17)

| Spec section | Status | Evidence in codebase | Gap lock notes |
|---|---|---|---|
| 4) Functional Overview | Partial | `backend/LPCylinderMES.Api/Services/WorkCenterWorkflowService.cs`, `backend/LPCylinderMES.Api/Services/OrderWorkflowService.cs` | Route resolution, route review, and step execution exist; still not complete for all declared requirements/policies. |
| 5) Workflow State Model | Partial | `backend/LPCylinderMES.Api/Models/OrderLineRouteInstance.cs`, `backend/LPCylinderMES.Api/Models/OrderLineRouteStepInstance.cs`, `backend/LPCylinderMES.Api/Services/WorkCenterWorkflowService.cs` | Core transitions exist but not all spec edge transitions are fully validated in integration flow. |
| 6) Roles and Permissions | Partial | `backend/LPCylinderMES.Api/Services/RolePermissionService.cs`, `backend/LPCylinderMES.Api/Services/OrderWorkflowService.cs` | Lifecycle and hold controls are enforced; complete site-scope/action-key model remains incomplete. |
| 7) Configuration Specification | Partial | `backend/LPCylinderMES.Api/Controllers/SetupController.cs`, `backend/LPCylinderMES.Api/Services/SetupRoutingService.cs`, `backend/LPCylinderMES.Api/Models/RouteTemplate*.cs` | Core CRUD/routing config exists; advanced overrides and deeper policy controls are not complete. |
| 8) Data Capture Rules | Partial | `backend/LPCylinderMES.Api/Controllers/OrdersController.cs` (`scan-in/out`, `usage`, `scrap`, `serials`, `checklist`, `complete`), `backend/LPCylinderMES.Api/Services/WorkCenterWorkflowService.cs` | MVP capture is present; not all validation cases and loading/document-generation paths are complete. |
| 9) API Contract (Planned) | Partial | `backend/LPCylinderMES.Api/Controllers/OrdersController.cs`, `backend/LPCylinderMES.Api/Controllers/SetupController.cs` | Most operator/supervisor/setup endpoints exist; loading-specific endpoints and full parity are pending. |
| 10) High-Fidelity Operator Interface | Missing | `frontend/src/pages/OperatorWorkCenterConsolePage.test.tsx` (test artifact only) | Full production-grade scan-first UI behavior/spec fidelity is not locked as complete. |
| 11) Error Handling and Recovery | Partial | Service-level `ServiceException` patterns in `backend/LPCylinderMES.Api/Services/*.cs` and controller translation in `backend/LPCylinderMES.Api/Controllers/OrdersController.cs` | Core error mapping exists; full recovery UX contract is not fully validated end-to-end. |
| 12) Reporting and KPIs | Partial | `backend/LPCylinderMES.Api/Services/OrderKpiService.cs`, KPI endpoints in `backend/LPCylinderMES.Api/Controllers/OrdersController.cs` | KPI coverage exists for lifecycle; complete work-center KPI set remains incomplete. |
| 13) Non-Functional Requirements | Partial | Azure-ready and config-driven patterns in `backend/LPCylinderMES.Api/Program.cs`, service layering in `backend/LPCylinderMES.Api/Services/*` | Non-functional targets (latency, reliability thresholds) are not fully benchmarked/verified. |
| 14) Acceptance Criteria | Partial | Existing workflow tests in `backend/LPCylinderMES.Api.Tests/WorkCenterWorkflowServiceTests.cs` and `backend/LPCylinderMES.Api.Tests/OrderWorkflowServiceTests.cs` | Criteria coverage is substantial but not complete against all acceptance bullets. |
| 15) Open Items for v0.2 | Missing | Spec-only in `designInput/SPEC_WORKCENTER_OPERATOR_WORKFLOW.md` | Explicitly deferred by spec; no implementation expected in Phase 0. |
| 16) Entity Field Definitions (New/Changed) | Partial | EF entities/mappings in `backend/LPCylinderMES.Api/Models/*` and `backend/LPCylinderMES.Api/Data/LpcAppsDbContext.cs` | Most entities are present; some optional/future fields/constraints remain incomplete or not fully wired. |
| 17) Field-Level Validation Rules | Partial | Validation logic in `backend/LPCylinderMES.Api/Services/WorkCenterWorkflowService.cs` and `backend/LPCylinderMES.Api/Services/OrderWorkflowService.cs` | Core validations implemented; full matrix of rule-by-rule enforcement still has gaps. |

## Integration Smoke Baseline

Phase 0 smoke tests cover non-breaking API availability for baseline endpoints:
- `GET /api/sites`
- `GET /api/lookups/colors`
- `GET /api/lookups/sites`
- `GET /api/orders/statuses`
- `GET /api/orders/receiving`
- `GET /api/orders/production`

Reference tests:
- `backend/LPCylinderMES.Api.Tests/ApiSmokeIntegrationTests.cs`

## Role Policy Source of Truth

Confirmed baseline source of truth for workflow actions:
- **Business policy definition:** `designInput/SECURITY_ROLES.md`
- **Runtime backend enforcement:** `backend/LPCylinderMES.Api/Services/RolePermissionService.cs`
- **Primary consumer in workflow paths:** `backend/LPCylinderMES.Api/Services/OrderWorkflowService.cs`

Baseline verification tests:
- `backend/LPCylinderMES.Api.Tests/RolePermissionServiceTests.cs`

## Change Control for Refactors

When refactoring workflow behavior, update all of:
1. this baseline matrix row(s),
2. corresponding integration smoke tests,
3. role policy tests if authorization semantics change.
