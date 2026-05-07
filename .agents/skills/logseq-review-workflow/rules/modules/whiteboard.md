# Whiteboard Review Rules

Apply when a change touches whiteboard/canvas behavior, shapes, connectors, asset placement, coordinate transforms, selection, persistence, or tldraw-style interop.

## Review focus

- Whiteboard state should persist and reload with stable IDs, positions, dimensions, z-order, and references.
- Coordinate transforms should be correct under zoom, pan, high-DPI screens, and selection boxes.
- Asset and block references should remain valid after rename, move, delete, sync, import, or export.
- Interactive operations should handle multi-select, undo/redo, and rapid pointer events.
- Large boards should avoid unnecessary full-board rerenders or serialization.

## Red flags

- Mixing screen coordinates and canvas coordinates without clear conversion.
- Persisting transient UI state as graph data.
- Deleting shapes without cleaning references or assets.
- Selection bugs around grouped/nested shapes.
- Tests that do not cover reload or undo/redo behavior.

## Review questions

- Does the board reload exactly after save/sync/reopen?
- Do zoom and pan change pointer hit-testing correctly?
- Are block/page refs preserved after graph operations?
- Does undo/redo restore both visual and persisted state?
- Are large whiteboards still responsive?
