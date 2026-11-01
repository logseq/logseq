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
	handle         ui.Handle
	focusEpoch     uint64
	focused        bool
	focusRequested bool
}

type codeMirrorCompositionSource struct {
	target           platformTarget
	state            *codeMirrorTextState
	buffer           *editor.Buffer
	role, uuid       string
	focusEpoch       uint64
	windowFocusEpoch uint64
}

type codeMirrorComposition struct {
	source    codeMirrorCompositionSource
	focused   bool
	composing bool
}

func (s *platformServices) currentCodeMirrorSource(source codeMirrorCompositionSource) bool {
	if !s.liveTarget(source.target) {
		return false
	}
	n, ok := s.backend.Node(source.target.id)
	return ok && n.Identifier == "logseq-codemirror" &&
		n.String("source-role") == source.role && n.String("uuid") == source.uuid &&
		source.state.role == source.role && source.state.uuid == source.uuid &&
		source.state.editor.Buffer == source.buffer
}

func (s *platformServices) syncCodeMirrorSources(snapshot bool) {
	if snapshot {
		s.codeMirrorSources = nil
		return
	}
	for id, source := range s.codeMirrorSources {
		if !s.currentCodeMirrorSource(source) {
			delete(s.codeMirrorSources, id)
		}
	}
}

// Key targets come from MyGo's actual focused ancestry, never an OCaml ID.
func (s *platformServices) codeMirrorComposition(c *ui.Context, target luimygo.InputNode) codeMirrorComposition {
	if !target.Current() {
		return codeMirrorComposition{}
	}
	source, ok := s.codeMirrorSources[target.Node.ID]
	if !ok || !s.currentCodeMirrorSource(source) ||
		target.Node.String("source-role") != source.role || target.Node.String("uuid") != source.uuid {
		return codeMirrorComposition{}
	}
	source.windowFocusEpoch = c.WindowFocusEpoch()
	return codeMirrorComposition{source: source, focused: source.state.handle.Focused(c),
		composing: source.state.editor.Composing()}
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
		e := editor.View(c, &s.editor).Key(role + ":" + s.uuid).WidthPercent(100).Bind(&s.handle)
		services.bind(n, e)
		focused := e.Focused()
		if focused != s.focused {
			s.focusEpoch++
		}
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
		s.focused = e.Focused()
		if services.codeMirrorSources == nil {
			services.codeMirrorSources = make(map[int64]codeMirrorCompositionSource)
		}
		services.codeMirrorSources[n.ID] = codeMirrorCompositionSource{
			target: services.controlTarget(n.ID), state: s, buffer: s.editor.Buffer,
			role: role, uuid: s.uuid, focusEpoch: s.focusEpoch,
		}
	})
}
