# review-council

An adversarial, multi-lane code-review skill for Agent Skills-compatible coding agents.

`review-council` reviews one frozen diff or pull request across correctness, security/privacy, tests, maintainability, and product/API behavior. An independent critic then challenges the candidate findings before the skill returns one evidence-grounded merge verdict. The council is review-only and never fixes or publishes changes unless the user starts a separate action.

The canonical skill package is [`skills/review-council`](skills/review-council). It follows the [Agent Skills open specification](https://agentskills.io/specification) and contains no harness-specific tool calls, so the same instructions work in Claude Code, Codex, Cursor, and other compatible agents. Harness-specific invocation syntax is optional.

## Install

Install interactively from GitHub:

```bash
npx --yes github:ianpcook/review-council-skill#v0.3.0 install
```

Install for one harness:

```bash
npx --yes github:ianpcook/review-council-skill#v0.3.0 install --target claude
npx --yes github:ianpcook/review-council-skill#v0.3.0 install --target codex
npx --yes github:ianpcook/review-council-skill#v0.3.0 install --target cursor
```

Install for all three:

```bash
npx --yes github:ianpcook/review-council-skill#v0.3.0 install --target all
```

The installer uses the current user-level locations:

| Target | Install directory |
| --- | --- |
| Claude Code | `~/.claude/skills/review-council` |
| Codex / shared Agent Skills | `~/.agents/skills/review-council` |
| Cursor | `~/.agents/skills/review-council` (shared with Codex) |

The legacy `agents` target remains an alias for `codex`. To support another compatible harness, install into an explicit skills directory:

```bash
npx --yes github:ianpcook/review-council-skill#v0.3.0 install --path /path/to/skills
```

Use `--dry-run` to inspect the destination. Existing installs are never overwritten implicitly. `--force` moves the previous installation into a sibling `skills-backups` directory before replacing it, so it remains recoverable.

Codex previously discovered personal skills under `~/.codex/skills` (or `$CODEX_HOME/skills`). Cursor also supports a native `~/.cursor/skills` directory, but discovers the shared directory too. The installer targets `~/.agents/skills` for both Codex and Cursor and warns when it detects an older harness-specific copy; after verifying the shared install, remove the old copy to avoid duplicate discovery.

Agents with their own GitHub skill installer can install directly from [`skills/review-council`](https://github.com/ianpcook/review-council-skill/tree/v0.3.0/skills/review-council) instead of using the Node installer.

## Use

Ask naturally:

```text
Use review-council on this branch against the repository's default branch.
```

Harness-specific explicit forms also work:

```text
/review-council base=main lanes=all
$review-council review this pull request
```

Available lanes:

- `correctness`
- `security-privacy`
- `test-verification`
- `thermo` (strict maintainability)
- `product-api`

If independent subagents are unavailable, the skill runs separated lane passes in one context and discloses that fallback in its report.

## Method and attribution

The critic loop adapts Qiu and Gill's [Adversarial Review: Structured Disagreement for Grounded Agentic Code Review](https://arxiv.org/abs/2608.18167), accepted to the ICML 2026 Workshop on DL4C.

The `thermo` lane adapts Cursor's MIT-licensed [Thermo-Nuclear Code Quality Review](https://github.com/cursor/plugins/tree/main/cursor-team-kit/skills/thermo-nuclear-code-quality-review). See [`NOTICE`](NOTICE) for the complete third-party notice.

## Validate

```bash
npm test
uvx --from skills-ref agentskills validate ./skills/review-council
npm pack --dry-run
```

## License

MIT
