# Product and API Behavior Lane

Review API compatibility, product behavior, integration boundaries, contracts, and user-visible semantics.

## Mission

Determine whether the change preserves intended product behavior and does not break public/internal contracts or downstream integrations.

## Review Questions

- Does the change solve the right user/product problem?
- Are public API request/response shapes changed? Is the change backwards compatible?
- Were fields removed, renamed, tightened, made required, or changed semantically?
- Are error responses stable and machine-actionable?
- Are state transitions explicit and valid?
- Are mutation endpoints idempotent where callers would expect retries?
- Are pagination, sorting, filtering, and defaults preserved?
- Are async/partial-failure behaviors documented and handled?
- Do generated clients, SDKs, docs, OpenAPI specs, GraphQL schemas, event schemas, or DB contracts need updates?
- Are downstream consumers affected?
- Does the change alter user-visible behavior, UX copy, notifications, permissions, billing, analytics, or data availability?
- Is the behavior controlled by feature flags/rollout when risk warrants it?

## Flag Aggressively

Breaking API/schema changes without versioning or migration, spec drift, removed response fields, new required request fields, semantic behavior changes hidden behind same shape, non-idempotent retryable writes, unstable error shapes, unanalyzed downstream consumer risk, and product behavior changes without acceptance criteria.

## Suggested Verification

Recommend OpenAPI/schema diff, generated SDK/client compilation, contract tests (`pact`, `dredd`, `schemathesis`, local equivalents), old/new integration tests, consumer search for changed exports/endpoints/events, feature-flag/rollback verification, and migration/backfill dry run.
