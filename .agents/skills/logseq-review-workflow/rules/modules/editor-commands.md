# Editor Commands Review Rules

Apply when a change touches slash commands, keyboard shortcuts, text editing, cursor/selection handling, block insertion, autocomplete, or command palette behavior.

## Review focus

- Commands should preserve editor selection, cursor position, focus, and block identity intentionally.
- Text edits and DB transactions should stay in sync.
- Keyboard shortcuts should not conflict with existing platform/browser/editor behavior without explicit intent.
- Autocomplete and slash-command results should handle empty, filtered, and stale states.
- Async command results should not mutate an outdated block or graph.

## Red flags

- Updating DB state without updating editor state, or vice versa.
- Command side effects after focus moved to another block/window/graph.
- Missing boundary tests for beginning/end of block text.
- Platform-specific shortcut assumptions.
- Implicit reliance on DOM selection after async boundaries.

## Review questions

- What is the before/after cursor and selection state?
- Does the command behave inside nested blocks, properties, journals, and pages?
- What happens if the command is invoked repeatedly or undone?
- Are IME/composition and mobile keyboard paths affected?
- Are shortcut conflicts tested or documented?
