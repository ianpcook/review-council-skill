# Test and Verification Lane

Decide whether the change is actually proven and whether CI/verification gates remain trustworthy.

## Mission

Tests passing is not enough. Determine whether tests would fail for the bug they claim to catch.

## Review Questions

- What verification evidence did the author provide, and was it actually run?
- Are there tests for introduced/changed behavior?
- Would each new/changed test fail if intended behavior broke?
- Do tests assert expected behavior or mirror implementation details?
- Are assertions specific with meaningful expected values?
- Did tests mock away the behavior they claim to test?
- Are edge cases, error paths, concurrency, retries, timeouts, and partial failures covered where relevant?
- Did the PR remove tests, skip tests, weaken lint/type checks, lower thresholds, broaden ignores, or update snapshots/goldens just to go green?

## Flag Aggressively

Tests that redefine correctness, tautological assertions, fake coverage, over-mocking, removed/skipped/weakened CI gates, missing negative tests, and no proof for high-risk changes.

## Suggested Verification

Recommend repo-appropriate unit/integration tests, typecheck, lint/format check, targeted regression tests, coverage, mutation testing (`stryker`, `mutmut`, `cosmic-ray`, PIT, or local equivalent), and contract/integration tests for API/schema changes. Do not invent commands as facts.
