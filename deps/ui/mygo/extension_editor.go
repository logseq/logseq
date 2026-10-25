package main

import (
	"strings"
	"unicode/utf8"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

// The existing OCaml sink sends runs/caret/composition, not its source or
// selection anchor. A host may supply these READ-ONLY queries from the OCaml
// model and its measured layout. Never reconstruct source from rendered pills,
// nor add a second Go document. Unwired services are explicitly unsupported.
// Snapshot offsets and OffsetAt results are UTF-8 bytes; source includes the
// current composition preview. Queries must run synchronously on the UI thread.
var logseqEditorServices struct {
	Snapshot  func(blockID string) (source string, anchor, caret int, ok bool)
	CaretRect func(blockID string, offset int) (ui.Rect, bool)
	OffsetAt  func(blockID string, x, y float32) (int, bool)
}

type logseqEditorInput struct {
	n                luimygo.Node
	emit             func(luimygo.Event)
	focused, mounted bool
	composing        bool
	preedit          string // Transient IME text only, never a document mirror.
	marked           ui.TextInputRange
	markedSelection  ui.TextInputRange
	dragging         bool
}

func (services *platformServices) renderLogseqEditor(c *ui.Context, n luimygo.Node, _ func(), emit func(luimygo.Event)) {
	// Edit_view already renders all text, pills, selections and the caret in
	// sibling standard nodes. This extension is intentionally only the sink.
	e := ui.Box(c).Size(1, 1).Focusable().Cursor(ui.CursorText).InputMethod(true)
	services.bind(n, e)
	s := ui.Local(e, "logseq-editor-input", func() logseqEditorInput { return logseqEditorInput{} })
	s.n, s.emit = n, emit
	if id := n.String("accessibility-identifier"); id != "" {
		e.Label(id)
	}
	caretRect := ui.Rect{W: 1, H: 18}
	if logseqEditorServices.CaretRect != nil {
		if r, ok := logseqEditorServices.CaretRect(n.String("block-id"), int(n.Number("caret", 0))); ok {
			caretRect = r
		}
	} else {
		extensionGap(n.Identifier, "caret/IME geometry and pointer hit testing require the OCaml editor layout bridge")
	}
	e.TextCaret(caretRect).HandleInput(s.input)
	if _, _, _, ok := s.snapshot(); ok {
		e.HandleTextInput(s)
	} else {
		// TextCaret is itself MyGo's native IME/text-input API. Unlike a
		// TextArea it creates no Go text buffer. Do not attach an incomplete
		// TextInputClient that lies about the surrounding document.
		extensionGap(n.Identifier, "source/selection snapshot absent: native surrounding-text queries, replacement ranges, clipboard copy/cut and assistive selection unavailable")
	}
	if !s.mounted {
		s.mounted = true
		// The sink exists only while OCaml is editing this block.
		e.Focus()
	}
	focused := e.Focused()
	if focused != s.focused {
		s.focused = focused
		if focused {
			s.send("focus", nil)
		} else {
			s.send("blur", nil)
		}
	}
}

func (s *logseqEditorInput) send(name string, values map[string]any) {
	extensionEmit(s.n, s.emit, name, values)
}

func (s *logseqEditorInput) snapshot() (string, int, int, bool) {
	if logseqEditorServices.Snapshot == nil {
		return "", 0, 0, false
	}
	text, anchor, caret, ok := logseqEditorServices.Snapshot(s.n.String("block-id"))
	if !ok || !extensionByteBoundary(text, anchor) || !extensionByteBoundary(text, caret) {
		return "", 0, 0, false
	}
	return text, anchor, caret, true
}

func extensionByteBoundary(text string, offset int) bool {
	return offset >= 0 && offset <= len(text) && (offset == len(text) || utf8.RuneStart(text[offset]))
}

func extensionRuneByte(text string, offset int) int {
	if offset <= 0 {
		return 0
	}
	for i := range text {
		if offset == 0 {
			return i
		}
		offset--
	}
	return len(text)
}

func (s *logseqEditorInput) selectBytes(anchor, caret int) {
	// Two pointer proposals represent a directed selection; no UTF-16 or
	// rune indices escape into the Edit_input byte-offset conduit.
	s.send("pointer", map[string]any{"offset": anchor, "extend": false})
	if caret != anchor {
		s.send("pointer", map[string]any{"offset": caret, "extend": true})
	}
}

func (s *logseqEditorInput) input(ev ui.InputEvent) bool {
	switch ev.Kind {
	case ui.InputKeyDown:
		key := extensionKey(ev.Key)
		if key == "" {
			return false
		}
		// Model keys retain structural semantics (Backspace at zero merges,
		// Enter splits, Tab indents). Never also emit delete/insert for them.
		s.send("key", extensionKeyValues(ev, key))
		payload := extensionDOMKey(ev, key)
		payload["isComposing"] = s.composing
		extensionDOMEvent(s.n, s.emit, "keydown", payload)
		if s.composing {
			return false // Native input methods own keys during preedit.
		}
		return key == "Backspace" || key == "Delete" || key == "Tab" || key == "Escape" ||
			strings.HasPrefix(key, "Arrow") || key == "Home" || key == "End" ||
			(key == "Enter" && ev.Mods&(ui.Shift|ui.Ctrl|ui.Super) == 0) ||
			(strings.EqualFold(key, "a") && ev.Mods&(ui.Ctrl|ui.Super) != 0)
	case ui.InputText:
		if s.composing {
			s.composing = false
			s.send("composition", map[string]any{"state": "end", "text": ev.Text})
		} else {
			s.send("insert", map[string]any{"text": ev.Text})
		}
		return true
	case ui.InputCompose:
		if ev.Text == "" {
			if s.composing {
				s.composing = false
				s.send("composition", map[string]any{"state": "cancel"})
			}
		} else {
			if !s.composing {
				s.composing = true
				s.send("composition", map[string]any{"state": "start"})
			}
			s.send("composition", map[string]any{"state": "update", "text": ev.Text})
		}
		return true
	case ui.InputSelect:
		if source, _, _, ok := s.snapshot(); ok {
			s.selectBytes(extensionRuneByte(source, ev.Start), extensionRuneByte(source, ev.End))
			return true
		}
	case ui.InputPointerDown, ui.InputPointerMove:
		if ev.Kind == ui.InputPointerDown {
			s.dragging = ev.Button == 0
		}
		if !s.dragging || logseqEditorServices.OffsetAt == nil {
			return false
		}
		offset, ok := logseqEditorServices.OffsetAt(s.n.String("block-id"), ev.X, ev.Y)
		if !ok || offset < 0 {
			return false
		}
		if source, _, _, known := s.snapshot(); known && !extensionByteBoundary(source, offset) {
			return false
		}
		if ev.Kind == ui.InputPointerDown && ev.Clicks == 2 {
			s.send("dblclick", map[string]any{"offset": offset})
		} else {
			s.send("pointer", map[string]any{"offset": offset, "extend": ev.Kind == ui.InputPointerMove || ev.Mods&ui.Shift != 0})
		}
		return true
	case ui.InputPointerUp:
		taken := s.dragging
		s.dragging = false
		return taken
	case ui.InputCommand:
		switch ev.Text {
		case "delete":
			s.send("delete", map[string]any{"kind": "selection"})
			return true
		case "selectAll":
			s.send("key", map[string]any{"key": "a", "ctrl": true})
			return true
		case "copy", "cut", "paste", "pasteAndMatchStyle", "undo", "redo":
			extensionGap(s.n.Identifier, "Edit-menu clipboard and undo commands need an OCaml-owned host service")
		}
	}
	return false
}

// TextInputClient is enabled only when the host supplies authoritative source
// and selection. MyGo native ranges are UTF-16; OCaml offsets remain UTF-8 bytes.
var _ ui.TextInputClient = (*logseqEditorInput)(nil)

func (s *logseqEditorInput) TextForRange(r ui.TextInputRange) (string, ui.TextInputRange) {
	text, _, _, ok := s.snapshot()
	if !ok {
		return "", ui.TextInputRange{}
	}
	lo, hi := ui.UTF16ByteOffset(text, r.Start), ui.UTF16ByteOffset(text, r.End)
	hi = max(lo, hi)
	return text[lo:hi], ui.TextInputRange{Start: ui.UTF16Len(text[:lo]), End: ui.UTF16Len(text[:hi])}
}

func (s *logseqEditorInput) Selection() ui.TextInputSelection {
	text, anchor, caret, ok := s.snapshot()
	if !ok {
		return ui.TextInputSelection{}
	}
	if s.composing {
		return ui.TextInputSelection{Range: s.markedSelection}
	}
	a, b := ui.UTF16Len(text[:anchor]), ui.UTF16Len(text[:caret])
	return ui.TextInputSelection{Range: ui.TextInputRange{Start: min(a, b), End: max(a, b)}, Reversed: a > b}
}

func (s *logseqEditorInput) MarkedRange() (ui.TextInputRange, bool) {
	return s.marked, s.composing
}

func (s *logseqEditorInput) replaceRange(r *ui.TextInputRange) bool {
	if r == nil {
		return true // OCaml owns the current selection/composition.
	}
	if s.composing {
		if *r == s.marked {
			return true
		}
		extensionGap(s.n.Identifier, "partial replacement of active preedit is not supported by the OCaml composition contract")
		return false
	}
	text, _, _, ok := s.snapshot()
	if !ok {
		return false
	}
	s.selectBytes(ui.UTF16ByteOffset(text, r.Start), ui.UTF16ByteOffset(text, max(r.Start, r.End)))
	return true
}

func (s *logseqEditorInput) ReplaceText(r *ui.TextInputRange, text string) {
	if !s.replaceRange(r) {
		return
	}
	if s.composing {
		s.composing = false
		s.send("composition", map[string]any{"state": "end", "text": text})
	} else {
		s.send("insert", map[string]any{"text": text})
	}
}

func (s *logseqEditorInput) SetMarkedText(r *ui.TextInputRange, text string, selected ui.TextInputRange) {
	if !s.replaceRange(r) {
		return
	}
	if !s.composing {
		source, anchor, caret, ok := s.snapshot()
		if !ok {
			return
		}
		start := ui.UTF16Len(source[:min(anchor, caret)])
		if r != nil {
			start = max(0, r.Start)
		}
		s.marked.Start = start
		s.composing = true
		s.send("composition", map[string]any{"state": "start"})
	}
	s.preedit = text
	length := ui.UTF16Len(text)
	s.marked.End = s.marked.Start + length
	s.markedSelection = ui.TextInputRange{Start: s.marked.Start + min(max(0, selected.Start), length), End: s.marked.Start + min(max(0, selected.End), length)}
	s.send("composition", map[string]any{"state": "update", "text": text})
}

func (s *logseqEditorInput) UnmarkText() {
	if !s.composing {
		return
	}
	text := s.preedit
	s.composing, s.preedit = false, ""
	s.send("composition", map[string]any{"state": "end", "text": text})
}

func (s *logseqEditorInput) BoundsForRange(r ui.TextInputRange) (ui.Rect, ui.TextInputRange, bool) {
	text, _, _, ok := s.snapshot()
	if !ok || logseqEditorServices.CaretRect == nil {
		return ui.Rect{}, ui.TextInputRange{}, false
	}
	offset := ui.UTF16ByteOffset(text, r.Start)
	rect, ok := logseqEditorServices.CaretRect(s.n.String("block-id"), offset)
	index := ui.UTF16Len(text[:offset])
	return rect, ui.TextInputRange{Start: index, End: index}, ok
}

func (s *logseqEditorInput) IndexForPoint(p ui.Point) (int, bool) {
	text, _, _, ok := s.snapshot()
	if !ok || logseqEditorServices.OffsetAt == nil {
		return 0, false
	}
	offset, ok := logseqEditorServices.OffsetAt(s.n.String("block-id"), p.X, p.Y)
	if !ok || !extensionByteBoundary(text, offset) {
		return 0, false
	}
	return ui.UTF16Len(text[:offset]), true
}
