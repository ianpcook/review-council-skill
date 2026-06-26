# review-council-skill

Install the `review-council` agent skill: a single entrypoint that runs a multi-lane, read-only code review council.

## Install

From GitHub:

```bash
npx --yes github:ianpcook/review-council-skill install
```

The installer will ask which harnesses to install for. Select one or more targets from the prompt.

Install non-interactively:

```bash
npx --yes github:ianpcook/review-council-skill install --target claude
npx --yes github:ianpcook/review-council-skill install --target codex
npx --yes github:ianpcook/review-council-skill install --target agents
npx --yes github:ianpcook/review-council-skill install --target cursor
npx --yes github:ianpcook/review-council-skill install --target claude,codex
npx --yes github:ianpcook/review-council-skill install --target all
```

Install to a custom skills directory:

```bash
npx --yes github:ianpcook/review-council-skill install --path ~/.codex/skills
```

Dry run:

```bash
npx --yes github:ianpcook/review-council-skill install --dry-run
```

Overwrite an existing install:

```bash
npx --yes github:ianpcook/review-council-skill install --force
```

If this package is later published to npm, the same installer works as:

```bash
npx review-council-skill install
```

## npm Warnings

If `npx` prints warnings like:

```text
npm warn Unknown project config "auto-install-peers"
npm warn Unknown project config "strict-peer-dependencies"
npm warn Unknown project config "shamefully-hoist"
```

those warnings usually come from a local `.npmrc` containing pnpm-specific settings. They are not emitted by this package and do not normally block installation.

If `npx` prints `Need to install the following packages`, that is the normal interactive prompt. Use `--yes` to skip it:

```bash
npx --yes github:ianpcook/review-council-skill install
```

## What It Does

`review-council` gathers review context once, runs independent read-only review lanes, then synthesizes one severity-ranked report.

Default lanes:

- `thermo`: maintainability, abstraction, decomposition, file size, spaghetti, code-judo simplification.
- `correctness`: acceptance criteria, logic bugs, edge cases, regressions, plausible-but-wrong behavior.
- `security-privacy`: auth, authorization, data exposure, secrets, injection, dependency/security-sensitive changes.
- `test-verification`: whether tests and verification actually prove behavior, CI quality, mutation/coverage risk, test changes.
- `product-api`: API/product behavior, backwards compatibility, contracts, user-visible behavior, integration boundaries.

The council is review-only. It should not edit files or run a fixer during the review pass.

## Attribution

The `thermo` maintainability lane adapts the Thermo-Nuclear Code Quality Review rubric from Cursor's `cursor-team-kit` plugin:

- Original skill: https://github.com/cursor/plugins/blob/main/cursor-team-kit/skills/thermo-nuclear-code-quality-review/SKILL.md
- Original subagent wrapper: https://github.com/cursor/plugins/blob/main/cursor-team-kit/agents/thermo-nuclear-code-quality-review.md

The `review-council` package uses that idea as one council member and adds separate correctness, security/privacy, test-verification, and product/API review lanes.

## Usage

After installing, ask your agent to use the skill:

```text
Use review-council on this branch against main.
```

Or:

```text
/review-council base=main scope=diff lanes=all
```

For a faster pass:

```text
/review-council lanes=thermo,correctness
```

## Claude Code Notes

For Claude Code, the install must land at:

```text
~/.claude/skills/review-council/SKILL.md
```

Claude Code uses the skill directory name as the slash command, so this should appear as:

```text
/review-council
```

If `/review-council` does not appear:

1. Confirm the file exists:

   ```bash
   ls ~/.claude/skills/review-council/SKILL.md
   ```

2. Restart Claude Code. Claude watches existing skill directories for changes, but if `~/.claude/skills/` did not exist when the session started, a restart may be required.

3. Reinstall explicitly for Claude:

   ```bash
   npx --yes github:ianpcook/review-council-skill install --target claude --force
   ```

## License

MIT
