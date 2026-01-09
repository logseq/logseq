# Repository Guidelines

## Project Structure & Module Organization
- `src/` is the main codebase.
  - `src/main/` contains core application logic.
  - `src/main/mobile/` is the mobile app code.
  - `src/main/frontend/components/` houses UI components.
  - `src/main/frontend/inference_worker/` and `src/main/frontend/worker/` hold webworker code, including RTC in `src/main/frontend/worker/rtc/`.
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

## Testing Guidelines
- Unit tests live in `src/test/` and should be runnable via `bb dev:lint-and-test`.
- Name tests after their namespaces; use `-v` to target a specific test case.
- Run lint/tests before submitting PRs; keep changes green.

## Commit & Pull Request Guidelines
- Commit subjects are short and imperative; optional scope prefixes appear (e.g., `fix:` or `enhance(rtc):`).
- PRs should describe the behavior change, link relevant issues, and note any test coverage added or skipped.

## Agent-Specific Notes
- Review notes live in `@prompts/review.md`; check them when preparing changes.
- Worker-sync feature guide for AI agents: `docs/agent-guide/worker-sync.md`.
