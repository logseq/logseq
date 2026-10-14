# Confirmed dependency blocker: adopted subtree cache purging

LUI dependency `7ae8b157281fc4837fc7e6f1507d722c1f13404c`.
Application checkpoint `f87d111bdf`. No LUI changes or pushes made.

## Real application reproduction

Actual SDL/OpenGL app, disposable Demo: startup journal → recent
`Native focus verified` → header Home. Journal/title/block nodes have positive
layout rectangles, but the painted body is blank (`native-home-blank.png`).
Resizing restores it. A temporary debug-only patch-log line captured the real
protocol batches (`home-patches.jsonl`); that line was removed afterward.

## Root cause and independent validation

`platform/native/lui_paint/lui_retained.ml` recursively purges cached children
when an old parent is detached. Those links describe the previous painted tree,
not the final store. A child adopted by a surviving new parent is therefore
purged too. Recreated fragments have no rebuilt child lists until full cache
invalidation. Production keyed-subtree reconciliation emits this adoption/drop
ordering; it is not an invalid-protocol scenario.

Actual trace line 11 / generation 11 (zero-based operation indices):

- 223 removes title subtree 336 from 335; 240 adopts it under 426.
- 225 removes block subtree 370 from 333; 239 adopts it under 425.
- 287 detaches old parent 333 and wrongly purges its surviving adopted children.
- 288 detaches 372, similarly purging adopted child 373.

An independent read-only replay through the matching production store/retained
libraries, with positive rectangles and one tagged glyph per text node, finds
title 360 in both painters before Home. After Home, full paint contains title
360 and journal text 486, retained paint contains neither. The next batch remains
wrong: 16 full glyphs versus 11 retained glyphs. Explicit invalidation restores
output. The same defect reproduces with a three-node adoption followed by an
old-parent detach.

## Required repair

Preserve surviving adopted descendants when purging an obsolete parent; compare
full and retained scenes in an adoption-plus-detach regression. Do not globally
invalidate every app frame or suppress native navigation as a purported fix.
The additional `logseq/lui` repository push authorization is pending. This
dependency defect blocks complete native navigation/rendering parity; it is not
a Linux/macOS platform limitation. Other independent app fixes continue.
