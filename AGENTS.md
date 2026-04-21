# Repository Guidelines

## Project Structure & Module Organization
- `src/` is the main codebase.
  - `src/main/` contains core application logic.
  - `src/main/mobile/` is the mobile app code.
  - `src/main/frontend/components/` houses UI components.
  - `src/main/frontend/worker/` holds webworker code, including RTC in `src/main/frontend/worker/rtc/`.
- `src/electron/` is Electron-specific code.
- `src/test/` contains unit tests.
- `deps/` contains internal dependencies/modules.
- `clj-e2e/` contains end-to-end tests.

## Build, Test, and Development Commands
- `bb dev:lint-and-test` runs linters and unit tests.
- `bb dev:test -v <namespace/testcase-name>` runs a single unit test (example: `bb dev:test -v logseq.some-test/foo`).
- E2E tests live in `clj-e2e/`; run them from that directory if needed.

## Coding Style & Naming Conventions
- ClojureScript keywords are defined via `logseq.common.defkeywords/defkeyword`; use existing keywords and add new ones in the shared definitions.
- Follow existing namespace and file layout; keep related workers and RTC code in their dedicated directories.
- Prefer concise, imperative commit subjects aligned with existing history (examples: `fix: download`, `enhance(rtc): ...`).
- Clojure map keyword name should prefer `-` instead of `_`, e.g. `:user-id` instead of `:user_id`.
- For i18n work, use `.i18n-lint.toml` as the source of truth for lint scope and exceptions. Inside that scope, shipped UI text must use helpers from `frontend.context.i18n`; console text is exempt. Keep out-of-scope developer-only `(Dev)` labels inline in code/config, not in translation dictionaries.
- Reuse `src/resources/dicts/en.edn` keys only on exact semantic owner + textual role match. Follow `docs/i18n-key-naming.md` for new or renamed keys. Add English source text in `en.edn`; add non-English entries only when providing real translations; keep complete sentences whole; use placeholders for plain dynamic text; run `bb lang:validate-translations`, `bb lang:lint-hardcoded`, and `bb lang:format-dicts` as needed.

## Testing Guidelines
- Unit tests live in `src/test/` and should be runnable via `bb dev:lint-and-test`.
- Name tests after their namespaces; use `-v` to target a specific test case.
- Run lint/tests before submitting PRs; keep changes green.

## Commit & Pull Request Guidelines
- Commit subjects are short and imperative; optional scope prefixes appear (e.g., `fix:` or `enhance(rtc):`).
- PRs should describe the behavior change, link relevant issues, and note any test coverage added or skipped.

## Agent-Specific Notes
- Project-specific skills live under `.agents/skills/`; load `.agents/skills/logseq-i18n/SKILL.md` for i18n/localization/hardcoded UI text tasks.
- Review notes live in `prompts/review.md`; check them when preparing changes.
- DB-sync feature guide for AI agents: `docs/agent-guide/db-sync/db-sync-guide.md`.
- DB-sync protocol reference: `docs/agent-guide/db-sync/protocol.md`.
- For db-sync D1 schema changes, add or update a Cloudflare worker SQL migration under `deps/db-sync/worker/migrations/`; do not rely on ad hoc runtime-only schema migration code.
- New properties should be added to `logseq.db.frontend.property/built-in-properties`.
- Avoid creating new class or property unless you have to.
- Avoid shadow var, e.g. `bytes` should be named as `payload`.
