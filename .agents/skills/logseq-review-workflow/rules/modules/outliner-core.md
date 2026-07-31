# Outliner Core Review Rules

Apply when a change touches `outliner.core`, block tree editing, move/indent/outdent/delete, ordering, page/block relationships, undo/redo, or structural transactions.

## Review focus

- Block tree invariants must hold after every operation: parent, children order, left/right sibling links or ordering attributes, page ownership, and references.
- Multi-block operations should be atomic from the user's perspective.
- Selection/cursor state should remain consistent with the structural change.
- Undo/redo should restore both DB state and visible editor state when relevant.
- Operations should handle root blocks, nested blocks, journals, pages, and properties intentionally.

## Red flags

- Updating only the visible block list without updating DB structural invariants.
- Off-by-one ordering bugs around first/last child or sibling moves.
- Deleting/moving blocks without considering references, children, collapsed state, or properties.
- Separate transactions that can leave intermediate invalid state after failure.
- Tests that cover only one-level outlines.

## Review questions

- What invariants are preserved before and after the transaction?
- Does the operation work for nested blocks and boundary positions?
- Is the operation safe when repeated or undone/redone?
- Are selection and cursor positions correct after the operation?
- Is there coverage for both DB graph and file graph behavior if both paths are affected?
