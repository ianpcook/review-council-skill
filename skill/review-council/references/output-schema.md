# Review Council Output Schema

Return one synthesized report.

## Findings

List findings first, ordered by severity.

Each finding should use this shape:

```markdown
- BLOCK|FIX|SUGGEST: Short title
  - Lane: thermo|correctness|security-privacy|test-verification|product-api
  - Evidence: file:line or diff/code detail
  - Impact: why it matters
  - Recommendation: minimal fix or decision needed
```

If multiple lanes found the same issue, combine them and list all relevant lanes.

## Verification

Include concrete verification commands or checks. If commands were run, report pass/fail and summarize key output. If not run, say so.

## Council Coverage

End with:

```markdown
Council coverage: thermo, correctness, security-privacy, test-verification, product-api
Evidence gaps: missing ticket/acceptance criteria, unrun tests, unavailable CI, etc.
Verdict: BLOCKED | READY-WITH-FIXES | READY-WITH-RISK | READY
```
