package main

import (
	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

type codeMirrorTextState struct {
	extensionTextState
	role           string
	focusRequested bool
}

func (services *platformServices) renderLogseqCodeMirror(c *ui.Context, n luimygo.Node, _ func(), emit func(luimygo.Event)) {
	role := n.String("source-role")
	if role != "query" && role != "block" {
		extensionUnavailable(c, n, "missing or unsupported source-role")
		return
	}
	root := ui.Column(c).WidthPercent(100)
	s := ui.Local(root, "codemirror-text", func() codeMirrorTextState { return codeMirrorTextState{} })
	value := n.String("value")
	// Query cm_host deliberately supplies an initial, non-reactive value.
	// Preserve its native draft while focused, just like cm_adapter.ml;
	// an actual external value change remains authoritative. This is not
	// the logseq-editor document (which always remains OCaml-owned).
	if s.role != role {
		*s = codeMirrorTextState{role: role}
	}
	if !s.initialized || value != s.model {
		s.reconcile(value)
	}
	readOnly := n.Bool("read-only") || role == "block" && n.String("uuid") == ""
	root.Children(func() {
		e := ui.TextArea(c, &s.value).ReadOnly(readOnly).Font("monospace").WidthPercent(100)
		services.bind(n, e)
		if label := n.String("accessibility-identifier"); label != "" {
			e.Label(label)
		}
		if !readOnly {
			e.OnChange(func() {
				extensionEmit(n, emit, "cm-event", map[string]any{"name": "input", "value": s.value})
			})
		}
		if role == "block" {
			focused := e.Focused() && !readOnly
			if focused != s.focused {
				s.focused = focused
				name := "blur"
				if focused {
					name = "focus"
				}
				extensionEmit(n, emit, "cm-event", map[string]any{"name": name, "value": s.value})
			}
		} else {
			e.OnTextKey(func(key ui.TextKey) bool {
				if key.Key != ui.KeyEnter && key.Key != ui.KeyEscape {
					return false
				}
				extensionEmit(n, emit, "cm-event", map[string]any{"name": "key", "key": extensionKey(key.Key), "value": s.value})
				return true // Match cm_adapter's synchronous preventDefault.
			})
			if !s.focusRequested && !readOnly {
				// Remember initial focus separately from the current focus so
				// closing another control never steals focus back each frame.
				e.Focus()
				s.focusRequested = true
			}
		}
	})
	extensionGap(n.Identifier, "native plain-text fallback: CodeMirror syntax highlighting, completion, keymaps and JS instance APIs are unavailable")
}
