# Master UX parity

Paired-audit findings for `refactor/lui` vs master. Each group owns only its section.

## G2 — copy/paste/undo/redo

Module 09. G1 owns indent-undo caret (module 06); general undo caret restoration is fixed here — G1 can skip if covered.

| check | module | severity | status | master | LUI (before) | repro |
|-------|--------|----------|--------|--------|--------------|-------|
| copy-block-paste-into-empty | 09 | med | fixed `e569cc2e01` | stays editing last pasted @ end | exits edit | copy gamma → empty block → paste |
| copy-subtree | 09 | med | fixed `e569cc2e01` | caret in last pasted (beta-2 @ end) | exits edit | copy beta subtree → paste |
| copy-subtree-into-nonempty | 09 | med | fixed `e569cc2e01` | caret in last pasted | exits edit | paste subtree into non-empty |
| cut-block-selection | 09 | med | fixed `e569cc2e01` | caret in pasted block | exits edit | cut gamma → paste |
| paste-ext-url-over-selection | 09 | high | fixed `b75ecc9b97` | `[label](url)` markdown link | no-op, caret → 0 | Shift+Home → paste URL |
| undo-typing | 09 | low | fixed `0620e7b14d` | caret @ 0 | caret @ end | type → Ctrl+Z |
| undo-new-block | 09 | low | fixed `0620e7b14d` | caret @ 0 | caret @ end | Enter → type → undo×2 |
| undo-outdent | 09 | low | fixed `0620e7b14d` | caret @ 0 | caret @ end | Shift+Tab → undo |
| redo-cleared-by-edit | 09 | low | fixed `0620e7b14d` | undo → caret 0 → type at start | caret stays end | undo → type → redo no-op |
| undo-not-editing | 09 | low | fixed `0620e7b14d` | re-opens @ caret 0 | re-opens @ end | type → Esc → undo |
| undo-status | 09 | low | fixed `0620e7b14d` | caret @ 0 | caret @ end | Ctrl+Enter → undo |
| undo-page-rename | 09 | med | fixed `5bdff1fa4d` | rename undo silent | false “Undo failed.” + `Owned_refresh_failed` | title rename → Ctrl+Z |
| paste-across-pages | 09 | med | fixed `e569cc2e01` | caret in pasted block | exits edit | copy on A → paste on B |
| copy-block-ref-paste | 09 | med | fixed `e569cc2e01` | inserts sibling, keeps editing | exits edit | copy block → paste into non-empty |

Intentional differences (out of scope for G2): graph view; rich-text inline formatting while editing.
