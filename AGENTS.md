## Repository Layout
- `src/`: Core source code
  - `src/main/`: The core logic of the application
    - `src/main/mobile/`: Mobile app code
    - `src/main/frontend/inference_worker/`: Code running in a webworker for text-embedding and vector-search
    - `src/main/frontend/worker/`: Code running in an another webworker
        - `src/main/frontend/worker/rtc/`: RTC(Real Time Collaboration) related code
    - `src/main/frontend/components/`: UI components
  - `src/electron/`: Code specifically for the Electron desktop application.
  - `src/test/`: unit-tests
- `deps/`: Internal dependencies/modules
- `clj-e2e/`: End to end test code

## Common used cljs keywords
- All commonly used ClojureScript keywords are defined using `logseq.common.defkeywords/defkeyword`.
- Search for `defkeywords` to find all the definitions.

## Testing Commands
- Run linters and unit-tests: `bb dev:lint-and-test`
- Run a single unit-test:
  - `bb dev:test -v <namespace/testcase-name>`
- E2E tests files are located in `/clj-e2e`

## db-worker-node
- Build: `clojure -M:cljs compile db-worker-node`
- Run: `node ./static/db-worker-node.js` (default port 9101)

## Common used cljs keywords
- All commonly used ClojureScript keywords are defined using `logseq.common.defkeywords/defkeyword`.
- Search for `defkeywords` to find all the definitions.

## Code Guidance
- Keep in mind: @prompts/review.md

## Review Checklist
- Linters and unit-tests must pass
- Check the review notes listed in @prompts/review.md
