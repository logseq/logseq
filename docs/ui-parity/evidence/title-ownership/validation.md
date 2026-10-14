# Title input ownership and cold geometry

Reference: master 7dfa9b45aee9d6a9387ddb3375018356f1e7c6a8.
Before: native c039e415099ca555476f33ac5a295cceec388053.
Actual desktop comparison: disposable Long Page fixture, 1280x900,
light theme, backing scale 1, both sidebars closed. Graph view remains excluded.

## Editable ownership

A native rich-text sink snapshot used the tag editor, not the browser twin's
textarea semantics. Block editors had a second state guard, but the title
keeps its model outside Editor_state.editing. Thus Ctrl+A selected title text
AND all 45 outline blocks; title keys also reached non-editing global shortcuts.
The production snapshot now identifies the editor sink as a textarea, so
existing editable-target key/clipboard guards apply. No new widget or protocol.

- [Before: title and entire outline selected](native-before-title-select-all.png)
- [Actual master: title text only](master-title-select-all.png)
- [After: title text only](native-after-title-select-all.png)

The copied production snapshot test fails before the change, then verifies
editable semantics, no outline selection and no hidden-property command while
typing p/a into the title. This does NOT prove the complete property shortcut's
selection-scoped behavior outside editing.

## Cold measurements and end-edge caret

Native geometry replies previously refreshed only the active block frame,
leaving the title's locally owned frame empty until another input. Editor_sink
now notifies mounted geometry owners through the existing native UI mailbox.
Title views register scoped listeners, measure their CURRENT model, invalidate
geometry on mount/source changes, and release the listener on disposal.
Unchanged measurements do not cause a reply/refresh loop.

A real SDL check then exposed a second failure: the emitted title caret was
0x54 at the intrinsic text edge. Its flex minimum now preserves the existing
2px width, even when no extra content width is available.

- [Intermediate: measured caret still has zero width](native-intermediate-title-caret-zero-width.png)
- [Intermediate retained tree](native-intermediate-title-tree.txt)
- [After: caret appears on the first title click](native-after-cold-title-caret.png)

Separate failing-first tests cover the first Focus/reply, scoped disposal and
end-edge nonzero width. The actual final SDL binary shows its caret before any
key, then displays Ctrl+A selection without selecting the outline.

## Rename and persistence

Both actual apps perform title click, Ctrl+A, type Long Page renamed, Enter.
Worker reads preserve page UUID 6acfb138-272f-49e4-b333-5de24a86813f and the false
local publishing flag. Both complete trees retain exactly 45 original block
titles/order; no body text is changed. The title is restored to Long Page in
both apps afterward. JSON reads and actual rename screenshots are retained:
[master](master-title-enter-renamed.png), [native](native-after-title-enter-renamed.png),
master/native-renamed.json, *-outline-renamed.json and *-restored.json.
The native restore also survived a restart while preparing the final binary.

## Validation and remaining work

Native/Melange/test builds and native-host/contracts/host suites pass; shared
UI 2119 checks, 0 failures. Fresh Vite focused creation/focus E2E passes; serial
fresh browser spacing/property regressions pass 2/2. Source-specific read-only
correctness/regression reviews found no further confirmed issue.

Title clipboard remains an actual reproducible gap: Ctrl+A/C leaves an owned
sentinel unchanged natively, while actual master copies the selected title.
This will be addressed separately; editable semantics alone are not clipboard
implementation. Other remaining items include title undo/redo, cut/paste,
invalid/empty names, click-to-caret placement, wrapped/bidirectional/IME input,
blink/thickness, narrow selection geometry, duplicate UUID owners in multiple
containers, and full property shortcut scope. This checkpoint is partial parity.
