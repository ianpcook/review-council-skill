---
name: review-council
description: Run one multi-lane, read-only code review council for diffs/PRs. Use when asked for review-council, agentic code review, PR review, harsh review, security/correctness/test/API review, or a comprehensive review using subagents/skills.
---

# Review Council

Run a single public review entrypoint that coordinates multiple specialist review lanes, then synthesizes one prioritized code-review report.

## Non-Negotiables

- Review only. Do not edit files, apply patches, commit, or run a fixer during the council pass.
- Prefer fresh-context subagents for each lane when available. If subagents are unavailable, keep lane analyses separated in the main context.
- Keep reviewer lanes read-only. They may inspect files, diffs, logs, tests, and docs. They must not modify source.
- Ask for or infer the base branch. Default to `main` when the repository does not clearly use another base.
- Require evidence. Findings should cite `file:line` when possible, quote or summarize the relevant diff/code, explain impact, and recommend a minimal fix.
- Do not approve merely because tests pass. Treat tests as evidence to inspect, not a substitute for reasoning.
- Do not flood the review with cosmetic nits when blocking structural, correctness, security, test, or contract issues exist.

## Invocation Shape

Support requests like:

- `/review-council`
- `/review-council base=main scope=diff lanes=all`
- `/review-council lanes=thermo,correctness`
- `Use review-council on this PR`
- `Run the full review council before merge`

Default arguments:

- `base=main`
- `scope=diff`
- `lanes=all`
- `fix=false`

Accepted lanes:

- `thermo`: maintainability, abstraction quality, decomposition, file size, spaghetti, code-judo simplification.
- `correctness`: acceptance criteria, logic bugs, edge cases, regressions, plausible-but-wrong behavior.
- `security-privacy`: auth, authorization, data exposure, secrets, injection, dependency/security-sensitive changes.
- `test-verification`: whether tests and verification actually prove behavior, CI quality, mutation/coverage risk, test changes.
- `product-api`: API/product behavior, backwards compatibility, contracts, user-visible behavior, integration boundaries.

## Workflow

1. **Gather context once**
   - Determine repo status and base branch.
   - Collect `git diff <base>...HEAD` or the PR diff.
   - Identify changed files and inspect full contents for meaningful source/test/config/API files.
   - Collect available intent: user request, issue/ticket text, PR description, acceptance criteria, or commit messages.
   - Identify plausible verification commands from repo conventions, but do not run expensive/destructive commands without judgement.

2. **Load lane briefs**
   - For `thermo`, read `references/thermo-maintainability.md`.
   - For `correctness`, read `references/correctness.md`.
   - For `security-privacy`, read `references/security-privacy.md`.
   - For `test-verification`, read `references/test-verification.md`.
   - For `product-api`, read `references/product-api.md`.
   - For final output, follow `references/output-schema.md`.

3. **Run lanes independently**
   - Prefer parallel read-only subagents with one lane brief each.
   - Give each lane only the shared gathered context plus its lane brief.
   - Tell each lane to return findings only for its specialty and to mark uncertainty explicitly.
   - Do not let one lane see another lane's conclusions before it has produced its own findings.

4. **Synthesize**
   - Deduplicate overlapping findings.
   - Preserve the strongest severity when lanes overlap.
   - Separate `BLOCK`, `FIX`, and `SUGGEST`.
   - Include a short "What to verify" section with concrete commands or checks.
   - Include "Council coverage" showing which lanes ran and any evidence gaps.

5. **Stop before fixing**
   - Do not modify code in the council pass.
   - If the user asks to fix findings, run a separate scoped fixer pass after the council report. The fixer may address only accepted findings.

## Severity Rules

Use these labels:

- `BLOCK`: likely correctness/security/data-loss/API-break/major maintainability issue that should block merge.
- `FIX`: concrete issue worth addressing before or soon after merge, but not necessarily merge-blocking.
- `SUGGEST`: non-blocking improvement, cleanup, or follow-up.

Promote to `BLOCK` when the finding involves:

- wrong behavior against stated acceptance criteria,
- security/privacy boundary failure,
- broken public API or data contract,
- tests weakened to match broken behavior,
- clear structural regression that will make future work meaningfully harder,
- missing proof for a high-risk change.

## Report Shape

Use the format in `references/output-schema.md`. Keep the final review concise and severity-ordered. If there are no issues, say that clearly and name remaining residual risk or unrun verification.
