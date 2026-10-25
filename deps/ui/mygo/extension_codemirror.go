package main

import (
	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

func (services *platformServices) renderLogseqCodeMirror(c *ui.Context, n luimygo.Node, _ func(), emit func(luimygo.Event)) {
	role := n.String("source-role")
	if role != "query" && role != "block" {
		extensionUnavailable(c, n, "missing or unsupported source-role")
		return
	}
	root := ui.Column(c).WidthPercent(100)
	s := ui.Local(root, "codemirror-text", func() extensionTextState { return extensionTextState{} })
	value := n.String("value")
	// Query cm_host deliberately supplies an initial, non-reactive value.
	// Preserve its native draft while focused, just like cm_adapter.ml;
	// an actual external value change remains authoritative. This is not
	// the logseq-editor document (which always remains OCaml-owned).
	if !s.initialized || value != s.model {
		s.reconcile(value)
	}
	readOnly := n.Bool("read-only") || role == "block"
	root.Children(func() {
		if role == "block" {
			// The OCaml block call site has no cm-event handler: its web
			// implementation writes through a JS CodeMirror instance. Making
			// this editable would appear to save edits that are actually lost.
			extensionUnavailable(c, n, "block editing/persistence needs an OCaml handler; showing read-only source")
		}
		e := ui.TextArea(c, &s.value).ReadOnly(readOnly).Font("monospace").WidthPercent(100)
		services.bind(n, e)
		if label := n.String("accessibility-identifier"); label != "" {
			e.Label(label)
		}
		if role == "query" {
			e.OnChange(func() {
				extensionEmit(n, emit, "cm-event", map[string]any{"name": "input", "value": s.value})
			})
			e.OnTextKey(func(key ui.TextKey) bool {
				if key.Key != ui.KeyEnter && key.Key != ui.KeyEscape {
					return false
				}
				extensionEmit(n, emit, "cm-event", map[string]any{"name": "key", "key": extensionKey(key.Key), "value": key.Text()})
				return true // Match cm_adapter's synchronous preventDefault.
			})
			if !s.focused && !n.Bool("read-only") {
				// Remember initial focus separately from the current focus so
				// closing another control never steals focus back each frame.
				e.Focus()
				s.focused = true
			}
		}
	})
	extensionGap(n.Identifier, "native plain-text fallback: CodeMirror syntax highlighting, completion, keymaps and JS instance APIs are unavailable")
}
