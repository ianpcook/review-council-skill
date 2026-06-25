# Thermo Maintainability Lane

This lane adapts the Thermo-Nuclear Code Quality Review rubric from Cursor's `cursor-team-kit` plugin.

Original sources:

- Skill: https://github.com/cursor/plugins/blob/main/cursor-team-kit/skills/thermo-nuclear-code-quality-review/SKILL.md
- Subagent wrapper: https://github.com/cursor/plugins/blob/main/cursor-team-kit/agents/thermo-nuclear-code-quality-review.md

## Mission

Run an unusually strict review focused on implementation quality, maintainability, abstraction quality, and codebase health. Push for ambitious structural simplification and code-judo moves that preserve behavior while making the implementation dramatically simpler.

## Primary Questions

- Is there a code-judo move that would make this dramatically simpler?
- Can this be reframed so fewer concepts, branches, modes, helpers, or layers are needed?
- Does this improve or worsen local architecture?
- Did the diff add branching complexity where a better abstraction should exist?
- Did a cohesive module become more coupled, stateful, or hard to scan?
- Is this logic in the right file, package, module, or layer?
- Did this push a file/component past a healthy size boundary, especially around 1000 lines?
- Are repeated conditionals signaling a missing model, helper, dispatcher, or state machine?
- Is this abstraction earning its keep, or is it wrapper/indirection churn?
- Did the diff introduce casts, `any`, `unknown`, optionality, or ad-hoc object shapes that hide an invariant?

## Flag Aggressively

- Complex implementation where cleaner reframing could delete whole categories of complexity.
- Refactors that move complexity around without reducing concepts.
- File-size explosions, especially crossing 1000 lines without strong justification.
- New conditionals bolted onto unrelated flows.
- One-off booleans, nullable modes, or feature flags tangling control flow.
- Feature-specific logic leaking into general-purpose modules.
- Brittle magic, thin wrappers, unnecessary casts, loose contracts, duplicated helpers, or wrong-layer logic.

## Preferred Remedies

Recommend deleting indirection, simplifying state, moving ownership to the right layer, extracting focused modules, replacing condition chains with typed models/dispatchers, separating orchestration from business logic, reusing canonical helpers, and making type boundaries explicit.

## Approval Bar

Do not approve merely because behavior seems correct. Treat obvious missed simplification, spaghetti branching, unjustified file-size growth, architecture-boundary leaks, or avoidable helper duplication as presumptive blockers.
