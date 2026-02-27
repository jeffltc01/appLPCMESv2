# LPC MES v2 Specification: Help Documentation Implementation

## 1) Document Control

- **Version:** v0.1 (Draft)
- **Status:** Draft for architecture and implementation review
- **Purpose:** Define the technical implementation for in-app help documentation aligned to `designInput/SPEC_HELP_DOCUMENTATION.md`.

## 2) Scope and Objectives

This specification defines how help content is:

- Stored and versioned
- Validated and exposed through backend APIs
- Rendered contextually in the frontend
- Governed through release and test workflows

Primary objective:

- Deliver role-aware, page-aware, maintainable help with low operational overhead and no environment-specific hardcoding.

## 3) Architecture Alignment

Implementation must conform to:

- `designInput/REFERENCE_ARCHITECTURE.md`
- `designInput/GENERAL_DESIGN_INPUT.md`
- `designInput/SECURITY_ROLES.md`
- `designInput/SPEC_HELP_DOCUMENTATION.md`

Key constraints:

- ASP.NET Core Web API + EF Core backend patterns
- React + TypeScript frontend patterns
- Azure-ready configuration and deployment behavior
- No controller-centric business logic for non-trivial behavior

## 4) Implementation Strategy (v1)

v1 uses a **content-file-first model** with optional DB extension later:

1. Canonical topics stored as versioned JSON files in repository.
2. Backend service loads and validates topic files at startup.
3. Backend API returns filtered topics by route, role, and optional workflow context.
4. Frontend renders help in a contextual drawer/panel per page.
5. Tests validate schema, role filtering, and basic UI visibility.

Rationale:

- Fast initial delivery
- Full git audit history
- Minimal schema migration risk in first phase

## 5) Content Storage Layout

Recommended structure:

- `frontend/src/help/topics/*.json` for authored topic files
- `frontend/src/help/schema/helpTopic.schema.json` for local validation and authoring support
- `backend/LPCylinderMES.Api/Help/` for runtime contracts/services if backend owns filtering logic

Minimum file conventions:

- One logical topic per file
- Filename starts with stable `TopicId` (for example `order-list-overview.json`)
- UTF-8 text only; no binary assets in topic files

If screenshots are needed:

- Store in web-served static assets with stable relative links
- Enforce redaction review before commit

## 6) Help Topic Contract (Technical)

Required fields:

- `topicId: string`
- `title: string`
- `appliesToRoles: string[]`
- `appliesToPages: string[]`
- `purpose: string`
- `whenToUse: string[]`
- `prerequisites: string[]`
- `stepByStepActions: string[]`
- `expectedResult: string`
- `commonErrorsAndRecovery: { error: string; cause?: string; recovery: string[] }[]`
- `relatedTopics: string[]`
- `lastValidatedOnUtc: string` (ISO 8601)
- `validatedBy: string`

Optional fields:

- `screenshotsOrDiagrams: string[]`
- `knownLimitations: string[]`
- `escalationPath: string`
- `externalReferenceLinks: string[]`
- `siteScope: string[]` (future-ready)
- `featureFlags: string[]` (future-ready)

## 7) Backend Design

### 7.1 Service Layer

Create a dedicated service (example name):

- `IHelpContentService`
- `HelpContentService`

Responsibilities:

- Load topic definitions from configured source
- Validate schema/required fields
- Filter topics by user role + route/page + optional workflow state context
- Return deterministic ordering (for example: page-level first, then workflow topics)
- Log validation and load failures with structured metadata

### 7.2 API Layer

Add endpoints under a dedicated controller (thin controller pattern):

- `GET /api/help/topics?route=<route>&context=<optional>`
- `GET /api/help/topics/{topicId}`

Behavior:

- Enforce authenticated access
- Resolve app roles from database-backed RBAC
- Return only topics allowed for caller role/site scope
- Return structured 404 when a topic does not exist
- Return structured 400 for invalid query input

### 7.3 Configuration

Add configurable source path/key through app settings:

- `HelpContent:SourceType` (`File` in v1)
- `HelpContent:BasePath`
- `HelpContent:EnableSchemaValidation` (default true outside prod override policy)

No hardcoded absolute paths or localhost assumptions.

### 7.4 Error Handling and Observability

Log fields:

- `TopicId`
- `Route`
- `UserId`
- `Roles`
- `CorrelationId`
- `ValidationErrorCode` (when applicable)

Startup failures:

- If topic source is missing/corrupt, app should fail fast in non-production.
- In production, behavior may degrade to an empty help response with clear high-severity logs and health check warning (policy decision).

## 8) Frontend Design

### 8.1 Core Components

Recommended components:

- `HelpEntryPoint` (icon/button per page)
- `HelpDrawer` (main presentation surface)
- `HelpTopicView` (single-topic rendering)
- `HelpTopicList` (if multiple topics are returned)

### 8.2 Data Flow

1. Page resolves route/context key.
2. `HelpEntryPoint` requests topics from `/api/help/topics`.
3. API response is cached in memory for session efficiency.
4. Drawer opens with role-filtered topics relevant to current screen.

### 8.3 UX Behavior

- Help entry point visible on all production pages.
- If no topic is available, show fallback guidance and escalation path.
- Preserve keyboard accessibility and mobile usability.
- Do not block primary workflow if help API is unavailable.

### 8.4 Security UX

- Never expose hidden privileged steps to unauthorized users.
- For blocked actions, include role-appropriate "why blocked" explanation when returned by API.

## 9) Validation Pipeline

Validation layers:

1. **Pre-commit/CI schema validation**
   - Validate all topic JSON against `helpTopic.schema.json`.
2. **Backend startup validation**
   - Validate required fields and cross-topic references (`relatedTopics`).
3. **Runtime response validation**
   - Ensure route and role filters return expected shape and no duplicates.

Fail conditions in CI:

- Missing required fields
- Invalid role names not recognized by security catalog
- Broken `relatedTopics` references
- Invalid timestamp format

## 10) Testing Strategy

### 10.1 Backend tests

Add tests for:

- Schema-compliant topic loading
- Rejection of invalid topic payloads
- Role/site filtering behavior
- Route-based query behavior
- 404/400 response contract

### 10.2 Frontend tests

Add tests for:

- Help entry point visibility on key pages
- Drawer open/close interaction
- Topic rendering for happy path
- Empty/fallback state behavior
- Permission-sensitive topic visibility

### 10.3 Regression coverage baseline

At minimum, add help visibility coverage for:

- `OrderListPage`
- `OrderDetailPage`
- `ProductionOrderPage`
- `ReceivingPage`

## 11) Release and Governance Workflow

For each behavior-changing feature:

1. Update impacted help topic files.
2. Update tests for affected pages/workflows.
3. Include help change note in release documentation.
4. Record validation metadata (`lastValidatedOnUtc`, `validatedBy`).

Release gate checklist includes:

- Topic schema validation passed
- Help API health check passed
- UI smoke test confirms topic retrieval on at least one key workflow page

## 12) Future Extensions (Non-Blocking)

Potential v2+ enhancements:

- Database-backed authoring and approval workflow
- Site-specific topic overrides
- Searchable global Help Center
- Telemetry-driven topic quality scoring
- Multilingual localization pipeline

These enhancements must preserve backward compatibility for existing `topicId` references.

## 13) Open Decisions

1. Final ownership of source files: frontend-owned vs backend-owned directory.
2. Production behavior policy when help content fails validation at startup.
3. Whether `siteScope` filtering is required in v1 or deferred to v2.
4. Whether end users can submit feedback per topic in first release.
