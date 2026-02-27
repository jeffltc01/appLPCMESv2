# Order Workspace API Backlog

This backlog captures backend APIs still needed for full spec-aligned end-to-end behavior.

## Holds and Exceptions

- `POST /api/orders/{id}/holds/apply`
  - Request: `overlay`, `reasonCode`, `statusOwnerRole`, `statusNote`, optional customer-ready follow-up fields.
  - Purpose: enable explicit hold overlays from workspace with audit requirements.
- `POST /api/orders/{id}/holds/clear`
  - Request: `clearReasonCode`, `statusNote`.
  - Purpose: clear active overlays with audit.
- `GET /api/orders/{id}/holds/history`
  - Purpose: render hold timeline in Audit/Rework tabs.

## Promise-Date Governance

- `POST /api/orders/{id}/promise/commit`
  - Request: `promisedDateUtc`, `reasonCode`, `actorEmpNo`.
- `POST /api/orders/{id}/promise/revise`
  - Request: `currentCommittedDateUtc`, `reasonCode`, `notificationIntent`, `note`.
- `GET /api/orders/{id}/promise/history`
  - Purpose: feed Promise Date History tab.

## Dispatch / Release and Delivery Evidence

- `POST /api/orders/{id}/release/confirm`
  - Request: `releaseMode` (`DeliveryDispatch` | `CustomerPickup`), event timestamp, optional transport fields.
- `POST /api/orders/{id}/delivery-evidence`
  - Request: evidence metadata and attachments reference.
- `GET /api/orders/{id}/delivery-evidence`
  - Purpose: reflect non-blocking delivery evidence state.

## Audit and Integration Projection

- `GET /api/orders/{id}/audit-events`
  - Purpose: show actor, role, reason code, and transition history in workspace.
- Extend `POST /api/orders/{id}/invoice/submit` response to include:
  - `invoiceStagingResult`
  - `invoiceSubmissionCorrelationId`
  - `erpInvoiceReference`
  - `invoiceStagingError`

## Attachments Policy

- Expand attachment stage policy to allow upload/delete across active pre-invoice lifecycle stages.
- Expose attachment categories and invoice relevance metadata in attachment DTOs.
