# LPC MES v2 Policy Addendum — Section 12 Closure

This addendum converts Section 12 open decisions into explicit, enforceable system rules.

## Decision Rule Registry

| Section 12 Decision | Decision Key | Allowed Values | Default | Enforcement Point |
|---|---|---|---|---|
| D1 Hold release authority | `HoldReleaseAuthorityRole` | `Supervisor`, `Quality`, `PlantManager`, `Admin` | `Supervisor` | `POST /api/orders/{id}/hold/clear` |
| D2 Customer dropoff transit optionality | `AllowCustomerDropoffTransitWithAppointment` | `true`, `false` | `false` | `OrderWorkflowService` transition validation |
| D3 Pickup requires outbound planning | `RequireOutboundPlannedForCustomerPickup` | `true`, `false` | `false` | `ProductionComplete -> DispatchedOrPickupReleased` guard |
| D4 ERP fail-later behavior | Runtime event + `ExceptionErpReconcile` overlay | N/A | Enabled | `POST /api/orders/{id}/erp-reconcile/failure` |
| D5 Attachment email mandate | `AttachmentEmailPolicy` | `AlwaysOptional`, `MandatoryForConfiguredCustomers`, `MandatoryForAll` | `AlwaysOptional` | `SubmitInvoiceAsync` |
| D5 customer targeting | `AttachmentEmailRequiredCustomerIdsCsv` | CSV list of customer IDs | empty | `SubmitInvoiceAsync` |
| D6 Missing delivery evidence behavior | `MissingDeliveryEvidenceBehavior` | `ReportingOnly`, `AutoExceptionDocumentation` | `ReportingOnly` | `DispatchedOrPickupReleased -> InvoiceReady` |
| D7 Required attachment categories | `RequiredAttachmentCategoriesCsv` | CSV category list | empty | `SubmitInvoiceAsync` |
| D8 Rework revert target from invoice-ready | `ReworkRevertTargetStatus` | `InProduction`, `ProductionCompletePendingApproval` | `InProduction` | `InvoiceReady` reversion checks |
| D9 Promise taxonomy ownership | `PromiseReasonTaxonomyOwnerRole` | role key | `Office` | `PromiseReasonPolicy` governance |

## Sign-Off Gating Policy

- Policy activation requires sign-off from:
  - Office
  - Transportation
  - Receiving
  - Production
  - Quality
  - Accounting
- Activation endpoint rejects incomplete sign-off sets.

## Scope Resolution Rules

Policy values are resolved in this order:
1. Customer scope
2. Site scope
3. Global scope
4. Code default

## Data Contracts

- Policies: `business_decision_policies`
- Sign-offs: `business_decision_signoffs`
- Promise reason taxonomy: `promise_reason_policies`

## Seeded Baseline (Policy Version 1)

The migration seeds:

- Nine global decision policies (`is_active = 0`) for Section 12 keys.
- Six pending sign-off rows (`Office`, `Transportation`, `Receiving`, `Production`, `Quality`, `Accounting`) with `is_approved = 0`.
- Initial promise reason taxonomy rows (`Capacity`, `Material`, `Quality`, `CustomerChange`, `Logistics`, `ExternalDependency`, `Other`).

## Recommended Baseline Preset (v1, non-active)

An additional migration prefills recommended values for policy version 1 while keeping activation disabled:

- `AllowCustomerDropoffTransitWithAppointment = true`
- `RequireOutboundPlannedForCustomerPickup = true`
- `AttachmentEmailPolicy = MandatoryForConfiguredCustomers`
- `AttachmentEmailRequiredCustomerIdsCsv = ""` (must be configured before activation)
- `MissingDeliveryEvidenceBehavior = ReportingOnly`
- `RequiredAttachmentCategoriesCsv = TestResult,SerialReport`
- `ReworkRevertTargetStatus = ProductionCompletePendingApproval`
- `HoldReleaseAuthorityRole = Supervisor`
- `PromiseReasonTaxonomyOwnerRole = Office`

## Example Customer Override Seed

A follow-up seed migration adds a copyable customer-level override pattern for the first existing customer in `customers`:

- `AttachmentEmailPolicy = MandatoryForAll` (scope: `Customer`)
- `RequiredAttachmentCategoriesCsv = TestResult,SerialReport,PackingSlip` (scope: `Customer`)

These rows are marked with `updated_by_emp_no = SYSTEM-EXAMPLE` and remain inactive until policy version activation.

