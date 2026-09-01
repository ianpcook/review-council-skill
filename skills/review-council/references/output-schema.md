# Review Council Output Schema

Return one synthesized report. Lead with actionable findings, not process narration.

## Findings

List retained findings in `BLOCK`, `FIX`, then `SUGGEST` order. Use this shape:

```markdown
- [BLOCK|FIX|SUGGEST] Short title
  - Lanes: correctness, security-privacy, test-verification, product-api, thermo
  - Evidence: path/to/file.ext:line — precise code or diff detail
  - Trigger: concrete input, state, sequence, or future change that exposes the issue
  - Impact: observable consequence
  - Recommendation: smallest useful fix or decision
  - Critic: concise resolution and round number
```

Use one of these critic-resolution forms:

- `AGREE in round N`
- `revised after DISAGREE_EVIDENCE in round N: <what changed>`
- `confirmed after DISAGREE_CONCERN in round N: <artifact evidence>`
- `reviewer-confirmed critic proposal in round N`

Combine duplicate findings and list every contributing lane. Do not include candidates that were dropped during the critic loop.

If no finding survives, write `No evidence-grounded findings.` and continue with residual risk and verification.

## Disputed

Include this section only when a critic challenge could not be resolved from the available artifact:

```markdown
- Short title
  - Original evidence: path:line or diff detail
  - Unresolved objection: why the council could not confirm or refute it
  - Human decision needed: missing context or check that would resolve it
```

Disputed claims do not determine the verdict unless the missing evidence itself makes a high-risk change unsafe to merge.

## Verification

List checks that actually ran with pass/fail status and a short result. Then list important checks not run and why. Do not present a suggested command as executed evidence.

## Council coverage

End with:

```markdown
Execution: independent subagents | grouped subagents | single-agent fallback
Lanes: <lanes run>
Critic: independent | self-critique fallback | unavailable
Critic rounds: N
Omissions: <skipped lanes or none>
Evidence gaps: <missing intent, unavailable code, unrun tests, unavailable CI, or none>
Verdict: BLOCKED | READY-WITH-FIXES | READY-WITH-RISK | READY
```

Map the retained result to exactly one verdict:

- Any `BLOCK` finding: `BLOCKED`.
- Otherwise, any `FIX` finding: `READY-WITH-FIXES`.
- Otherwise, a material disputed claim or evidence gap: `READY-WITH-RISK`.
- Otherwise, only `SUGGEST` findings or no findings, with verification proportionate to the change: `READY`.
