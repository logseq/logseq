# Common Logseq Review Rules

Apply this file for every Logseq review together with the specific rule files matched by `SKILL.md` routing.

## Repository-wide conventions

- Prefer fail-fast behavior over silent fallback.
- Do not add backward compatibility layers unless explicitly requested.
- Do not introduce default values that hide invalid state.
- Keep one clear code path whenever possible.
- Internal code may assume well-formed inputs from controlled callers, but boundary code must validate and report actionable errors.

## Rule routing

- Use `SKILL.md` as the routing table.
- If a change touches multiple libraries or modules, load all matching rule files.
- Attach each finding to the most specific relevant rule file.
- Follow cross-references in rule files when one area depends on another.

## Review behavior

- Prefer concrete findings backed by code paths, invariants, tests, or runtime behavior.
- Distinguish proven issues from unclear intent.
- Ask a question only when code, tests, docs, and existing conventions do not answer the intent.
- Propose the smallest actionable fix or verification step.
- Do not ask for broad rewrites when a targeted fix is enough.

## Test review checks

- Tests should exercise the changed contract, including failure modes and edge cases.
- Prefer targeted tests for the changed namespace or module.
- If a module has stricter test expectations, apply that module's rule file.
