# LPC MES v2 — Schedule Board Specification (Current Implementation)

## 1) Document Control

- **Version:** v0.1 (Draft)
- **Status:** Draft for implementation alignment
- **Purpose:** Define the as-built order-level schedule board feature as the source of truth for consistency. This document describes the current implementation; the target-state finite-capacity scheduling model is defined in `SPEC_FINITE_CAPACITY_SCHEDULING.md`.
- **Owner:** MES product and engineering

## 2) Scope

This specification defines:

- Order-level schedule board UI and data model
- Manual schedule assignment (week and day)
- Product line throughput display
- Schedule change audit trail
- API contracts for board data and schedule mutations

Out of scope for this document:

- Finite-capacity optimization
- Work-center-level scheduling
- Constraint-based scheduling
- Automated solver runs

These are covered by `SPEC_FINITE_CAPACITY_SCHEDULING.md` as the future target state.

## 3) References

This document aligns with:

- `designInput/SPEC_ORDER_TO_CASH_STATUS_FLOW.md`
- `designInput/SPEC_DATA_REFERENCE.md`
- `designInput/SECURITY_ROLES.md`
- `designInput/GENERAL_DESIGN_INPUT.md`
- `designInput/REFERENCE_ARCHITECTURE.md`

**Relationship to SPEC_FINITE_CAPACITY_SCHEDULING:**

- `SPEC_FINITE_CAPACITY_SCHEDULING.md` describes the target-state architecture (WorkCenterCapacityCalendar, ScheduleDemandOperation, ScheduleAllocation, etc.).
- This spec documents the current implementation: a simpler order-level manual scheduling board stored on `SalesOrder.ScheduleWeekOf` and `SalesOrder.TargetDateUtc`.
- Future evolution toward finite-capacity scheduling should preserve this spec's behavior and data contracts until migration is complete.

## 4) Data Model (As-Built)

### 4.1 SalesOrder Schedule Fields

| Field | Type | Description |
|-------|------|-------------|
| `ScheduleWeekOf` | `DateOnly?` | Monday of the week the order is scheduled for. Null when unscheduled. |
| `TargetDateUtc` | `DateTime?` | Specific target date within the week (optional; can be week-only). When set, used for day-assigned display and work-center queue ordering. |

### 4.2 OrderPromiseChangeEvent (Audit)

Schedule changes create audit records:

| Field | Type | Description |
|-------|------|-------------|
| `OrderId` | `int` | Sales order ID |
| `OldDateUtc` | `DateTime?` | Previous schedule date (before change) |
| `NewDateUtc` | `DateTime?` | New schedule date (after change) |
| `ChangedByEmpNo` | `string?` | Actor identifier |
| `OccurredUtc` | `DateTime` | When the change occurred |
| `Note` | `string?` | Optional note |

### 4.3 ProductLine (Schedule Display)

| Field | Type | Description |
|-------|------|-------------|
| `ScheduleColorHex` | `string?` | Hex color for board cards (e.g., `#B3D4FC`) |
| `WeeklyCapacityTarget` | `int?` | Optional target; displayed in throughput pills |

### 4.4 Order Categorization Logic

The board categorizes orders into four buckets based on `ScheduleWeekOf`, `TargetDateUtc`, and the selected week (Monday–Friday):

| Bucket | Condition |
|--------|-----------|
| **Unscheduled** | `ScheduleWeekOf == null && TargetDateUtc == null` |
| **Carryover** | `ScheduleWeekOf < weekMonday` and lifecycle not `Invoiced` or `Closed` |
| **Week pool** | `ScheduleWeekOf == weekMonday` and no `TargetDateUtc` in week range |
| **Day assigned** | `TargetDateUtc` within week range (or `ScheduleWeekOf == weekMonday` with `TargetDateUtc` in range) |

Week is defined as Monday–Friday. `weekMonday` is the Monday of the week being viewed.

## 5) API Contracts

### 5.1 Get Schedule Board

```
GET /api/orders/schedule
```

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `weekOf` | `DateOnly` | required | Monday of the week (YYYY-MM-DD) |
| `siteId` | `int?` | null | Filter by site; null = all sites |
| `lookbackDays` | `int` | 90 | Lookback window for throughput (7–365 days) |

**Response:** `ScheduleBoard`

| Field | Type | Description |
|-------|------|-------------|
| `carryover` | `ScheduleOrderCard[]` | Orders from previous weeks not yet complete |
| `unscheduled` | `ScheduleOrderCard[]` | Orders with no schedule assignment |
| `weekPool` | `ScheduleOrderCard[]` | Orders assigned to this week, no specific day |
| `dayAssigned` | `ScheduleOrderCard[]` | Orders with target date in week |
| `productLines` | `ProductLineScheduleInfo[]` | Throughput by product line |
| `throughputLookbackDays` | `int` | Lookback used for throughput |

### 5.2 Update Single Order Schedule

```
PUT /api/orders/{id}/schedule
```

**Request body:** `UpdateScheduleRequest`

| Field | Type | Description |
|-------|------|-------------|
| `scheduleWeekOf` | `DateOnly?` | Monday of week; null to unschedule |
| `targetDateUtc` | `DateTime?` | Specific target date within week |
| `note` | `string?` | Optional note |
| `changedByEmpNo` | `string?` | Actor identifier |

**Response:** `OrderDraftDetail` (full order updated)

### 5.3 Bulk Assign Schedule

```
PUT /api/orders/schedule/bulk-assign
```

**Request body:** `BulkAssignScheduleRequest`

| Field | Type | Description |
|-------|------|-------------|
| `orderIds` | `int[]` | Order IDs to update |
| `scheduleWeekOf` | `DateOnly?` | Monday of week |
| `targetDateUtc` | `DateTime?` | Specific target date |
| `note` | `string?` | Optional note |
| `changedByEmpNo` | `string?` | Actor identifier |

**Response:** `204 No Content`

### 5.4 Get Schedule History

```
GET /api/orders/{id}/schedule-history
```

**Response:** `OrderScheduleChangeEvent[]`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Event ID |
| `orderId` | `number` | Order ID |
| `oldDateUtc` | `string?` | ISO datetime |
| `newDateUtc` | `string?` | ISO datetime |
| `changedByEmpNo` | `string?` | Actor identifier |
| `occurredUtc` | `string` | ISO datetime |
| `note` | `string?` | Optional note |

### 5.5 ScheduleOrderCard

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | `number` | Order ID |
| `orderNo` | `string` | Sales order number |
| `customerName` | `string` | Customer name |
| `orderDate` | `string` | Order date (ISO) |
| `requestedDateUtc` | `string?` | Customer requested date |
| `scheduleWeekOf` | `string?` | Monday of week (ISO date) |
| `targetDateUtc` | `string?` | Target date (ISO datetime) |
| `totalQty` | `number` | Total quantity |
| `lifecycleStatus` | `string` | Order lifecycle status |
| `productLineSummary` | `OrderLineProductLineSummary[]` | Product lines by code, name, color, qty |

### 5.6 ProductLineScheduleInfo

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Product line code |
| `name` | `string` | Product line name |
| `colorHex` | `string?` | Hex color for cards |
| `weeklyCapacityTarget` | `number?` | Optional target |
| `historicalAvgPerWeek` | `number` | Avg from completed orders over lookback |
| `historicalPeakPerWeek` | `number` | Peak from completed orders over lookback |

## 6) Throughput Display

- **Source:** `ScheduleThroughputService` computes historical avg/peak per product line from completed orders. Completed = `OrderLifecycleStatus` in (ProductionComplete, ProductionCompletePendingApproval, InvoiceReady, Invoiced, Closed). Completion date for lookback/bucketing: `ProductionCompletedUtc` if set, else `StatusUpdatedUtc`, else `InvoiceDate`, else `ClosedDate`.
- **Lookback:** 7–365 days, default 90. Configurable via `lookbackDays` query param.
- **Cache:** 1 hour; keyed by `siteId` and `lookbackDays`.
- **Display:** Pills show `{code} avg {historicalAvgPerWeek}` (rounded integer).
- **Product lines:** Only `IsFinishedGood` and `IsActive` product lines are included.

## 7) UI Behavior (Schedule Board Page)

### 7.1 Route and Access

- **Path:** `/schedule`
- **Menu:** "Schedule board" (MenuPage)

### 7.2 Layout

- **Sidebar:** Unscheduled orders + search + carryover section
- **Columns:** "This week" (week pool) | Mon | Tue | Wed | Thu | Fri
- **Each column:** Drop zone + order cards

### 7.3 Filters and Controls

- **Site:** Dropdown filter (siteId)
- **Lookback:** 90 or 180 days for throughput
- **Week navigation:** Prev/Next week, Today
- **Search:** Filter unscheduled by order no, customer name, product line code/name

### 7.4 Drag-and-Drop

- **Assign to week:** Drop on "This week" column → sets `scheduleWeekOf`, clears `targetDateUtc` for day
- **Assign to day:** Drop on day column → sets `scheduleWeekOf` and `targetDateUtc`
- **Unschedule:** Drop on "Drop to unschedule" zone → sets both to null

### 7.5 Order Card

- **Banner:** Product line color (primary product line)
- **Content:** Order no, customer, qty, requested date
- **Overdue badge:** When `requestedDateUtc` is in the past
- **Carried over:** "Carried over" label when in carryover bucket

### 7.6 Print

- Print-friendly styles: `schedule-board-print-hide`, `schedule-board-print-only`
- Print header: "Schedule board – {weekRange.start} – {weekRange.end}"

## 8) Business Rules

1. **Carryover exclusion:** Orders with `OrderLifecycleStatus` = `Invoiced` or `Closed` are excluded from carryover.
2. **Week definition:** Monday–Friday (WEEKDAYS). Saturday/Sunday are not shown as columns.
3. **Schedule change audit:** When `TargetDateUtc` or effective schedule date changes, an `OrderPromiseChangeEvent` is created.
4. **changedByEmpNo:** Currently hardcoded as `"EMP001"` in frontend; document as placeholder until auth integration.
5. **Bulk assign:** No-op when `orderIds` is empty or null.

## 9) Integration Points

- **Work center queue:** Orders are ordered by `TargetDateUtc` for dispatch.
- **Order list/detail:** Expose `scheduleWeekOf`, `targetDateUtc` for display and editing.
- **Order entry:** Schedule can be updated from order detail or schedule board.

## 10) Security and Roles

- Reference `SECURITY_ROLES.md` for role catalog.
- Schedule board is accessible to production planners, supervisors, plant managers, office, and admin.
- Schedule mutations do not yet enforce role checks; server-side authorization should be added per policy.
- All schedule mutations should capture actor and audit context.

## 11) Test and Verification

### 11.1 Smoke Test

- `GET /api/orders/schedule?weekOf=2026-03-16` returns JSON with `carryover`, `unscheduled`, `weekPool`, `dayAssigned`, `productLines`, `throughputLookbackDays`.

### 11.2 Backend Tests

- `ScheduleService`: Order categorization, carryover exclusion, bulk assign
- `ScheduleThroughputService`: Throughput computation, cache, zero-throughput case

### 11.3 Frontend Tests

- `ScheduleBoardPage`: Rendering, filtering, drag-and-drop (if tests exist)

## 12) Implementation References

| Layer | File |
|-------|------|
| Frontend page | `frontend/src/pages/ScheduleBoardPage.tsx` |
| Frontend types | `frontend/src/types/order.ts` |
| Frontend API | `frontend/src/services/orders.ts` |
| Backend service | `backend/LPCylinderMES.Api/Services/ScheduleService.cs` |
| Backend throughput | `backend/LPCylinderMES.Api/Services/ScheduleThroughputService.cs` |
| Backend DTOs | `backend/LPCylinderMES.Api/DTOs/OrderDtos.cs` |
| Backend controller | `backend/LPCylinderMES.Api/Controllers/OrdersController.cs` |
| Model | `backend/LPCylinderMES.Api/Models/SalesOrder.cs` |
