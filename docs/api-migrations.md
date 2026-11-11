# API migrations

## NSH desktop CodeMirror extension

The existing `Logseq_codemirror.cm` constructor and `cm-event` scalar fields are
preserved. The native factory consumes the exact OCaml-exported schema receipt;
application startup rejects a mismatched fingerprint before mounting a widget.
For example, `Logseq_codemirror.cm ~uuid ~source_role:"block" ~lang:"edn"
~value ~on_event ()` now mounts NSH's native `Editor` instead of MyGo's editor.

Native text editing, IME, selections, undo, wrapping and syntax highlighting are
owned by NSH. Block source changes update the existing editor; changing `uuid`
or `source-role` replaces its native editing state. Query evaluation snapshots do
not replace a focused query draft. Query Enter, Shift+Enter and Escape retain the
existing `cm-event {name="key"; key; value}` payload, including the full text.
Block focus/blur continue to carry the current full text. Empty-UUID blocks and
explicit `read-only=true` are read-only. An unknown source role is rejected
atomically; unknown highlighting languages use NSH's plain-text language.

Authoritative same-source replacements use NSH's native undo policy: replacing
text is an undoable edit, whereas the former MyGo replacement cleared history.
There is no handwritten history or composition controller in this adapter.
Web and Apple editor factories remain unchanged. Hardware IME key dispatch and
native appearance still require qualification on each desktop target.
