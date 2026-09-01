# Correctness Lane

Catch plausible-but-wrong behavior, requirement drift, edge cases, regressions, and hallucinated assumptions.

## Mission

Determine whether the diff actually implements the stated intent and acceptance criteria without introducing logical regressions.

## Review Questions

- What is the change supposed to accomplish?
- Does the implementation satisfy each acceptance criterion, not just a plausible interpretation?
- Can you trace realistic happy and unhappy paths?
- Are null/empty inputs, invalid formats, missing data, duplicate data, large inputs, concurrency, timeouts, retries, and partial failures handled where relevant?
- Did the change alter existing behavior not mentioned by the intent?
- Are dependencies, APIs, functions, config keys, and package names real and used correctly?
- Are error states explicit and correct?
- Are migrations, transforms, cache/state changes, or fallbacks safe under partial failure?

## Prioritize

- Plausible feature that does not match the stated feature.
- Happy-path-only logic.
- Silent behavior changes.
- Hallucinated or version-incompatible APIs/dependencies.
- Broad/suppressive error handling.
- Data transformations that lose semantics.
- Tests that redefine correctness to match the new code.

## Evidence bar

For every candidate, cite the exact code path and the input, state, timing, or dependency condition that triggers the failure. Tie requirement drift to the available acceptance criterion or established behavior. If the necessary intent or runtime context is missing, record an evidence gap instead of asserting a bug.

## Output

For each finding, include the acceptance criterion or behavior at risk, exact code path, concrete failing scenario, and smallest fix or clarification needed.
