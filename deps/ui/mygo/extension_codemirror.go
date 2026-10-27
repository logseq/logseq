package main

import (
	"strings"

	"github.com/egoist/mygo/ui"
	"github.com/egoist/mygo/ui/editor"
	luimygo "github.com/logseq/lui/platform/mygo"
)

type codeMirrorTextState struct {
	editor         editor.State
	model          string
	role           string
	uuid           string
	language       string
	focused        bool
	focusRequested bool
}

func (s *codeMirrorTextState) reconcile(role, uuid, value string) {
	if s.editor.Buffer == nil || s.role != role || s.uuid != uuid {
		*s = codeMirrorTextState{role: role, uuid: uuid, model: value,
			editor: editor.State{Buffer: editor.NewBuffer(value)}}
		return
	}
	if value == s.model {
		return
	}
	s.model = value
	if role == "query" && s.focused {
		return
	}
	if s.editor.Buffer.String() != value {
		s.editor.SetTextFromModel(value)
	}
}

func codeMirrorLanguage(lang string) *editor.Language {
	lang = strings.ToLower(strings.TrimSpace(lang))
	switch lang {
	case "edn", "clj", "cljc", "cljs", "clojurescript":
		lang = "clojure"
	case "calc":
		lang = "javascript"
	}
	return editor.LanguageNamed(lang)
}

func (services *platformServices) renderLogseqCodeMirror(c *ui.Context, n luimygo.Node, _ func(), emit func(luimygo.Event)) {
	role := n.String("source-role")
	if role != "query" && role != "block" {
		extensionUnavailable(c, n, "missing or unsupported source-role")
		return
	}
	root := ui.Column(c).WidthPercent(100)
	s := ui.Local(root, "codemirror-text", func() codeMirrorTextState { return codeMirrorTextState{} })
	input := func(value string) {
		extensionEmit(n, emit, "cm-event", map[string]any{"name": "input", "value": value})
	}
	s.reconcile(role, n.String("uuid"), n.String("value"))
	s.editor.OnChange = input
	readOnly := n.Bool("read-only") || role == "block" && n.String("uuid") == ""
	s.editor.ReadOnly = readOnly
	s.editor.FitContent = true
	s.editor.SoftWrap = true
	s.editor.Label = n.String("accessibility-identifier")
	s.editor.LineNumbers = editor.LineNumbersOff
	if role == "block" {
		s.editor.LineNumbers = editor.LineNumbersOn
	}
	lang := n.String("lang")
	if s.language != lang || s.editor.Buffer.Language() == nil {
		s.language = lang
		s.editor.Buffer.SetLanguage(codeMirrorLanguage(lang))
	}
	if lang != "" && s.editor.Buffer.Language() == nil {
		extensionGap(n.Identifier, "unsupported code language "+lang+": preserving source as plain text")
	}
	s.editor.OnInput = func(ev ui.InputEvent) bool {
		if readOnly || s.editor.Composing() || ev.Kind != ui.InputKeyDown {
			return false
		}
		key := ""
		switch {
		case ev.Key == ui.KeyEscape:
			key = "Escape"
		case ev.Key == ui.KeyEnter && role == "query":
			key = "Enter"
		case ev.Key == ui.KeyEnter && ev.Mods == ui.Shift:
			key = "Shift-Enter"
		}
		if key == "" {
			return false
		}
		extensionEmit(n, emit, "cm-event", map[string]any{"name": "key", "key": key, "value": s.editor.Buffer.String()})
		return true
	}
	root.Children(func() {
		e := editor.View(c, &s.editor).Key(role + ":" + s.uuid).WidthPercent(100)
		services.bind(n, e)
		focused := e.Focused()
		if role == "block" {
			if focused != s.focused {
				name := "blur"
				if focused {
					name = "focus"
				}
				extensionEmit(n, emit, "cm-event", map[string]any{"name": name, "value": s.editor.Buffer.String()})
			}
		} else {
			if !s.focusRequested && !readOnly {
				// Remember initial focus separately from the current focus so
				// closing another control never steals focus back each frame.
				e.Focus()
				s.focusRequested = true
			}
		}
		s.focused = focused
	})
}
