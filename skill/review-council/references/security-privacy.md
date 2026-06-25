# Security and Privacy Lane

Adversarially review security, privacy, data exposure, dependency, infrastructure, and agent-tooling risk.

## High-Risk Triggers

Dig deeper when the diff touches auth/session/token/identity, authorization/RBAC/object ownership/tenant isolation, user input/deserialization/file upload/template/SQL/search/shell, secrets/env/client config, logs/analytics/PII/exports/retention, payments, dependencies, infrastructure/containers/cloud permissions/CI, or LLM prompts/tools/MCP integrations with untrusted input.

## Review Questions

- What trust boundary changed?
- Can user input reach SQL, shell, filesystem, DOM, prompt/model tool call, network request, or deserializer?
- Is authorization enforced server-side for every protected object/action?
- Can user A access or mutate user B's data by changing IDs or request shape?
- Are secrets kept server-side and out of logs/client bundles/git history?
- Are errors/logs exposing sensitive data?
- Did the change add broad permissions, permissive defaults, or unaudited external access?
- Are dependencies real, maintained, pinned appropriately, and free of obvious supply-chain risk?
- Are negative tests present for malformed tokens, wrong audience, cross-tenant access, malicious input, oversized input, path traversal, SSRF, injection, and file tricks where relevant?

## Flag Aggressively

Decorative auth/validation, client-side-only checks, missing object ownership checks, hardcoded/client-exposed secrets, unsafe logging, untrusted input into prompts/tools, broad cloud/CI permissions, unjustified dependencies, and security-sensitive changes without negative tests.

## Suggested Verification

Suggest secret scanning (`gitleaks`, `trufflehog`), SAST (`semgrep`, `sonarqube`, `snyk code`), dependency/SCA (`snyk`, `grype`, npm/pip equivalents), and targeted integration/runtime checks where appropriate.
