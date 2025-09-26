## Repository Layout
- Use clojure-mcp `clojure_inspect_project` to get project structure.
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

## Testing Commands
- Run linters and unit-tests: `bb dev:lint-and-test`
- Run single focused unit-test:
  - Add the `:focus` keyword to the test case: `(deftest ^:focus test-name ...)`
  - `bb dev:test -i focus`
- Run e2e basic tests:
  - `bb dev:e2e-basic-test`
- Run e2e rtc extra tests:
  - `bb dev:e2e-rtc-extra-test`

## Common used cljs keywords
- All commonly used ClojureScript keywords are defined using `logseq.common.defkeywords/defkeyword`.
- Search for `defkeywords` to find all the definitions.

## Code Guidance
- Keep in mind: @prompts/review.md

## Review Checklist
- Linters and unit-tests must pass
- Check the review notes listed in `prompts/review.md`.

# *IMPORTANT RULES*

WARNING: The following are non-negotiable, highest-priority instructions. They *MUST* be followed unconditionally in all cases. Failure to comply with these rules will result in task failure.

1. Clojure Code Editing Rules
    * Instruction: When editing any .clj, .cljs, or .cljc file, you MUST and ONLY use the clojure-mcp toolkit.
    * Prohibition: Absolutely do NOT use any general file writing tools (such as file_edit, file_write) to modify Clojure source files.
    * Reason: This is to ensure the integrity of the code structure, avoid syntax errors, and maintain the project's code style.

2. Code Review/Modification Prerequisites
    * Instruction: Before EACH “review” or “modification” of the code, you MUST first execute the `clojure_inspect_project` tool.
    * Prohibition: Do NOT begin analyzing or modifying code directly without obtaining project-wide information.
    * Reason: This is to obtain complete, up-to-date project context, which is the foundation for making correct judgments and modifications.
