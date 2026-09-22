# Review Council Receipts

A receipt records that a council completed against one exact revision. It answers
"has this change been reviewed, and is that review still current?" without reading a
transcript.

A receipt is a local file. Writing one is not posting, and never satisfies a request to
comment on a pull request.

## Where receipts go

Resolve the directory once, before writing:

```bash
ROOT=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
DIR="$ROOT/.claude/review-council"
```

`--git-common-dir` resolves to the shared `.git` of the repository, so a council run
inside a linked worktree writes to the same directory as one run in the main checkout.
Use `--show-toplevel` and receipts scatter across every worktree, which defeats the sweep.

Create the directory if it does not exist. If the target is not in a git repository,
skip the receipt and say so in council coverage.

Receipts are local. Do not commit them and do not add them to `.gitignore`, which is a
shared file. Exclude them per clone instead:

```bash
echo '/.claude/review-council/' >> "$ROOT/.git/info/exclude"
```

## Filename

```
<target-slug>-<head8>-<VERDICT>.json
```

- `head8` is the first 8 characters of the reviewed head commit.
- `VERDICT` is the council verdict verbatim: `BLOCKED`, `READY-WITH-FIXES`,
  `READY-WITH-RISK`, or `READY`.
- `target-slug` by target kind:

| Target | Slug | Example |
| --- | --- | --- |
| Pull request | `pr-<number>` | `pr-614-55bda017-READY-WITH-FIXES.json` |
| Branch | `branch-<name>` | `branch-feat-dln-865-primitive-roles-1b2a4c21-READY.json` |
| Commit range | `range-<base8>` | `range-b702a239-f5b0a1ec-BLOCKED.json` |
| Working tree | `worktree` | `worktree-55bda017-READY-WITH-RISK.json` |

Lowercase the slug, replace each run of characters outside `[a-z0-9]` with `-`, trim
leading and trailing `-`, and cap it at 48 characters.

The head commit is in the name so a receipt cannot outlive what it describes. A pushed
commit produces a new name, and the old receipt stops matching — which is the point.
Never rename or edit an existing receipt to cover a new head.

## Contents

```json
{
  "schema": 1,
  "skill_version": "0.4.0",
  "target": "PR #614",
  "target_kind": "pull_request",
  "pr": 614,
  "branch": "feat/DLN-865-primitive-roles",
  "base": "origin/development",
  "base_sha": "b702a239774db0a527066beb901a1383f96369b6",
  "head": "55bda017a4f1c2e3d5b6a7890123456789abcdef",
  "includes_working_tree": false,
  "verdict": "READY-WITH-FIXES",
  "counts": { "block": 0, "fix": 2, "suggest": 3, "disputed": 1 },
  "lanes": ["correctness", "security-privacy", "test-verification", "product-api", "thermo"],
  "execution": "independent subagents",
  "critic": "independent",
  "critic_rounds": 2,
  "omissions": [],
  "evidence_gaps": ["CI logs unavailable for the E2E job"],
  "verification_ran": ["scripts/tests/ — 413 passed, 16 skipped"],
  "ran_at": "2026-09-16T12:44:14Z"
}
```

Every field except `pr`, `branch`, and `base_sha` is required. Take each value from the
report you just produced: `verdict`, `lanes`, `execution`, `critic`, `critic_rounds`,
`omissions`, and `evidence_gaps` are the same values as the Council coverage block, and
`counts` tallies the retained findings by severity. Do not recompute or soften them.

`includes_working_tree` is true when uncommitted changes were part of the reviewed set.
Such a receipt describes a state no one else can reproduce, so treat a match as weak
evidence.

## When to write

Write exactly one receipt, after the report is final.

Do not write one when the council did not reach a verdict — an aborted run, a target that
could not be resolved, or a review the user interrupted. A missing receipt reads as "not
reviewed", which is correct in each of those cases. An overstated receipt is worse than
none, because it stops the next reader looking.

If a receipt already exists for the same target and head, overwrite it. The later run
supersedes the earlier one.

## Reading receipts

Which open pull requests have a current council:

```bash
ROOT=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
DIR="$ROOT/.claude/review-council"
gh pr list --limit 100 --json number,headRefOid \
  --jq '.[] | "\(.number) \(.headRefOid[0:8])"' |
while read -r n sha; do
  f=$(find "$DIR" -maxdepth 1 -name "pr-$n-$sha-*.json" 2>/dev/null | head -1)
  if [ -n "$f" ]; then
    printf '#%-5s %s\n' "$n" "$(basename "$f" .json | sed "s/^pr-$n-$sha-//")"
  else
    printf '#%-5s NO CURRENT COUNCIL\n' "$n"
  fi
done
```

Match receipts with `find -name`, not a shell glob. In zsh an unmatched glob is an error
raised before the command runs, so `ls "$DIR/pr-$n-$sha-"*.json 2>/dev/null` prints a
`no matches found` error for every pull request without a receipt and the redirect does
not suppress it. `find` takes the pattern as a string and behaves the same in bash and zsh.

A PR with an earlier receipt at a different head has been reviewed, but not at its
current tip. Report that as stale rather than as reviewed: the findings may be resolved,
irrelevant, or newly wrong, and nothing in the receipt distinguishes those.

## Sizing a re-review against a stale receipt

A stale receipt is a summary, not a copy of the report: it gives counts by severity, not
the findings themselves. A verification pass needs the itemized `BLOCK`/`FIX` findings to
check the fix against — from this session's own earlier report, from a report the council
posted to the PR (`gh pr view --comments`), or from another durable copy. When none of
those exist, there is nothing concrete to verify against; treat the receipt as stale only
and run the full council below.

When the itemized findings are in hand, size the re-review by what the delta since the
stale head actually is:

**Verification pass** — every commit in the delta is described, in its own message, as
addressing one or more `BLOCK`/`FIX` items from the stale report, and touches only the
files and functions that report already covered: no new decision, no new mechanism. One
reviewer — a subagent or self-directed reading — checks the stale report's `BLOCK`/`FIX`
findings against the current artifact, confirms each is resolved as specified, and scans
the delta for anything the fix itself newly introduces. Skip lane assignment and the
independent critic round for this pass. If the scan surfaces something new, treat it
exactly like a critic-proposed finding (workflow step 4): it needs its own evidence,
trigger, and impact before it counts, and finding one is itself a sign the delta was not
fix-only — stop and run the full council below instead of forcing it into this pass.

**Full council** — a commit in the delta implements a new decision, a new mechanism, or
touches files or behavior the stale report never reviewed. Run the workflow from step 1,
scoped to the delta since the stale receipt's head, not the whole target again.

Write the receipt the same way either time. For a verification pass, set `execution` to
`"verification pass"` and `critic` to `"unavailable"` with `critic_rounds: 0` — no
candidate findings were produced to challenge, unless the scan surfaced one, in which
case that finding went through the normal critic protocol and the receipt reflects
whichever `execution`/`critic` values that produced.
