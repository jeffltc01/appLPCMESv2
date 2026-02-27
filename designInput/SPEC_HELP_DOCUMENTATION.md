# LPC MES v2 Specification: Help Documentation and Knowledge Maintenance

## 1) Document Control

- **Version:** v0.1 (Draft)
- **Status:** Draft for business and product review
- **Scope:** Define how user-facing help content is authored, published, governed, and maintained across LPC MES v2.
- **Out of scope (v0.1):**
  - Multi-language localization workflow
  - AI chatbot implementation details
  - Third-party public documentation portal integrations

## 2) Business Goal

LPC MES v2 needs in-app and release-aligned help content that is:

- Easy for role-based users to find at the point of work.
- Operationally accurate and aligned to current workflow behavior.
- Maintained as part of feature delivery, not as a separate afterthought.
- Auditable so outdated guidance can be detected and corrected quickly.

## 3) Design Principles

1. **Help is part of the feature**
   - Any workflow change that affects user behavior must include help updates in the same delivery cycle.
2. **Role-aware guidance**
   - Help content must match permissions and responsibilities from `designInput/SECURITY_ROLES.md`.
3. **Action-oriented structure**
   - Content should explain what the user can do now, what blocks them, and how to recover from errors.
4. **Single source of truth**
   - Canonical help content is versioned in-repo and tied to app release history.
5. **Cloud-ready and maintainable**
   - No local-only assumptions; links and references must work in Azure-hosted deployments.

## 4) Audience and Persona Scope

Primary personas:

- `Office`
- `Transportation`
- `Receiving`
- `Production`
- `Supervisor`
- `Quality`
- `PlantManager`
- `Setup/Admin`
- `ReadOnly`

For each persona, help must provide:

- Primary tasks by page/workflow.
- Preconditions (required status, role, data completeness).
- Expected outcomes and next state.
- Common failure conditions and recovery actions.

## 5) Help Surface Areas

Minimum required surfaces:

1. **Page-level help**
   - Short explanation of purpose, expected inputs, and key actions.
2. **Workflow step help**
   - Inline guidance near critical transitions (for example status changes, approvals, invoice submit, holds).
3. **Validation/error help**
   - User-actionable error messages with next steps.
4. **Role/permission help**
   - Clear explanation when actions are blocked due to role or site scope.
5. **Release/update help**
   - Changelog-oriented notes for major behavior changes affecting users.

## 6) Required Help Content Schema

Each help topic must include, at minimum:

- `TopicId` (stable key)
- `Title`
- `AppliesToRoles` (one or more role names)
- `AppliesToPages` (route/page identifiers)
- `Purpose`
- `WhenToUse`
- `Prerequisites`
- `StepByStepActions`
- `ExpectedResult`
- `CommonErrorsAndRecovery`
- `RelatedTopics`
- `LastValidatedOnUtc`
- `ValidatedBy`

Optional fields:

- `ScreenshotsOrDiagrams`
- `KnownLimitations`
- `EscalationPath`
- `ExternalReferenceLinks`

## 7) Content Standards

### 7.1 Writing and readability

- Use plain operational language, not developer terminology where avoidable.
- Use imperative instructions for procedures ("Select", "Scan", "Confirm").
- Keep each topic focused on one user intent.
- Keep acronyms expanded at first mention.

### 7.2 Accuracy and behavior alignment

- Help must align with current status model and workflow rules from:
  - `designInput/SPEC_ORDER_TO_CASH_STATUS_FLOW.md`
  - `designInput/SPEC_WORKCENTER_OPERATOR_WORKFLOW.md`
  - `designInput/SPEC_FINITE_CAPACITY_SCHEDULING.md` (where scheduling behavior is user-visible)
- Role-locked actions must match `designInput/SECURITY_ROLES.md`.
- If behavior differs by site policy/config, the help topic must state the variance explicitly.

### 7.3 Error and exception guidance

- Error guidance must include:
  - Probable cause
  - What the user can fix directly
  - When to escalate and to whom
- Do not expose internal secrets, connection details, or sensitive implementation internals.

## 8) Ownership and RACI

Baseline ownership:

- **Product/Process owner:** owns business correctness of help intent.
- **Engineering owner:** owns technical correctness and UI alignment.
- **QA/UAT owner:** validates topics against test scenarios and release candidates.
- **Operations lead (optional by site):** validates practical usability for frontline roles.

RACI (minimum):

- Draft help topic: Product + Engineering (R)
- Validate topic accuracy: QA/UAT (R), Product (A)
- Approve publish in release: Product (A), Engineering lead (C), Operations (C)
- Maintain and retire stale topics: Product (A), Engineering (R)

## 9) Maintenance Workflow

For any feature story/bug fix that changes user behavior:

1. Create/update related help topic(s) in the same work item.
2. Link each topic to impacted page/workflow and role(s).
3. Validate during QA with at least one happy path and one failure/edge path.
4. Mark `LastValidatedOnUtc` and `ValidatedBy`.
5. Publish with release notes entry when behavior changes materially.

Definition of Done extension:

- Feature is not complete unless impacted help content and tests are updated.

## 10) Acceptance Criteria

Help documentation capability is acceptable when:

1. Every production page has at least one mapped help topic.
2. Every critical status transition and approval gate has workflow help coverage.
3. Role-restricted actions have explicit blocked-action guidance.
4. At least one regression test verifies help visibility/availability for a key workflow screen (frontend).
5. Release checklist includes a help validation gate before production deployment.

## 11) Metrics and Quality Checks

Track at minimum:

- Help topic coverage ratio by active page/workflow.
- Percent of changed features with same-release help updates.
- Number of stale topics (not validated in last N days; N configured by release cadence).
- Top user help search or support-request gaps (if telemetry exists).

Quality review cadence:

- Lightweight review each sprint/release.
- Full audit quarterly or at major process change.

## 12) Security and Compliance Considerations

- Do not include secrets, connection strings, private endpoints, or privileged implementation details in help text.
- Role and access guidance must avoid encouraging privilege bypass.
- If screenshots are used, redact sensitive customer/PII/financial details.
- Escalation guidance should use approved operational channels.

## 13) Implementation Guidance (Non-Binding v0.1)

Implementation may start simple and evolve:

- Store canonical help definitions in versioned source-controlled files.
- Render in frontend as context-sensitive panels/tooltips or linked help drawer.
- Use stable topic keys to avoid broken links during UI refactors.
- Prefer configuration-driven topic mappings over hardcoded per-component content.

This section is implementation guidance only; final technical design can vary if it meets all requirements in this spec.

## 14) Open Decisions

1. Whether help content should support per-site override variants in v1 or later.
2. Whether offline-accessible operator help is required for constrained connectivity environments.
3. Whether a searchable central "Help Center" page is required in initial release.
4. Required stale-topic threshold (`N` days) for automatic review alerts.
