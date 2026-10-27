package main

import (
	"errors"
	"strings"
	"unicode/utf8"

	"github.com/egoist/mygo"
	"github.com/egoist/mygo/transfer"
	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

// The existing OCaml sink sends runs/caret/composition, not its source or
// selection anchor. The host supplies this READ-ONLY query from the OCaml
// model. Never reconstruct source from rendered pills,
// nor add a second Go document. Unwired services are explicitly unsupported.
// Snapshot offsets and OffsetAt results are UTF-8 bytes; source includes the
// current composition preview. Queries must run synchronously on the UI thread.
var logseqEditorServices struct {
	Snapshot func(blockID string) (source string, anchor, caret int, ok bool)
}

type logseqEditorInput struct {
	n                luimygo.Node
	emit             func(luimygo.Event)
	focused, mounted bool
	composing        bool
	compositionEnded bool
	preedit          string // Transient IME text only, never a document mirror.
	marked           ui.TextInputRange
	markedSelection  ui.TextInputRange
	dragging         bool
	layout           *editorLayout
	handle           ui.Handle
}

func (services *platformServices) renderLogseqEditor(c *ui.Context, n luimygo.Node, _ func(), emit func(luimygo.Event)) {
	// Startup declares paintsCaret=false, so Edit_view renders the measured
	// caret alongside text, pills and selections. This extension is only the sink.
	e := ui.Box(c).Size(1, 1).Focusable().Cursor(ui.CursorText).InputMethod(true)
	services.bind(n, e)
	services.BindEditorControl(n, e)
	s := ui.Local(e, "logseq-editor-input", func() logseqEditorInput { return logseqEditorInput{} })
	s.n, s.emit = n, emit
	e.Bind(&s.handle)
	services.editorHost().sinks[n.ID] = s
	if id := n.String("accessibility-identifier"); id != "" {
		e.Label(id)
	}
	e.HandleInput(s.input)
	// The candidate rectangle comes from BoundsForRange after commit. Do not
	// install a made-up font box before the sibling text has been laid out.
	c.AfterFrame(func() {
		layout, err := services.measureEditor(c, s)
		if err != nil {
			extensionGap(n.Identifier, err.Error())
			return
		}
		s.layout = layout
	})
	if _, _, _, ok := s.snapshot(); ok {
		e.HandleTextInput(s)
	} else {
		// Never attach an incomplete TextInputClient that lies about its source.
		extensionGap(n.Identifier, "source/selection snapshot absent: native surrounding-text queries, replacement ranges, clipboard copy/cut and assistive selection unavailable")
	}
	if !s.mounted {
		s.mounted = true
		// The sink exists only while OCaml is editing this block.
		e.Focus()
	}
	focused := e.Focused()
	s.setFocused(focused)
}

func (s *logseqEditorInput) send(name string, values map[string]any) {
	extensionEmit(s.n, s.emit, name, values)
}

func (s *logseqEditorInput) setFocused(focused bool) {
	if focused == s.focused {
		return
	}
	s.focused = focused
	if focused {
		s.send("focus", nil)
	} else {
		s.clearComposition()
		s.send("blur", nil)
	}
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
		if s.composing {
			return false // Native input methods own keys during preedit.
		}
		// Model keys retain structural semantics (Backspace at zero merges,
		// Enter splits, Tab indents). Never also emit delete/insert for them.
		s.send("key", extensionKeyValues(ev, key))
		if ev.Mods&(ui.Ctrl|ui.Super) != 0 && ev.Mods&ui.Alt == 0 {
			command := ""
			switch strings.ToLower(key) {
			case "c":
				if ev.Mods&ui.Shift == 0 {
					command = "copy"
				}
			case "x":
				if ev.Mods&ui.Shift == 0 {
					command = "cut"
				}
			case "v":
				if ev.Mods&ui.Shift == 0 {
					command = "paste"
				}
			case "z", "y":
				return true // The model key above owns history.
			}
			if command != "" {
				return s.editCommand(command)
			}
		}
		return key == "Backspace" || key == "Delete" || key == "Tab" || key == "Escape" ||
			strings.HasPrefix(key, "Arrow") || key == "Home" || key == "End" ||
			(key == "Enter" && ev.Mods&(ui.Shift|ui.Ctrl|ui.Super) == 0) ||
			(strings.EqualFold(key, "a") && ev.Mods&(ui.Ctrl|ui.Super) != 0)
	case ui.InputText:
		s.ReplaceText(nil, ev.Text)
		return true
	case ui.InputCompose:
		if s.mounted && !s.focused {
			return true
		}
		if ev.Text == "" {
			s.CancelComposition()
		} else {
			index := ui.UTF16Len(ev.Text[:extensionRuneByte(ev.Text, ev.Caret)])
			s.SetMarkedText(nil, ev.Text, ui.TextInputRange{Start: index, End: index})
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
		if !s.dragging {
			return false
		}
		offset, ok := s.offsetAt(ui.Point{X: ev.X, Y: ev.Y})
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
			return s.editCommand(ev.Text)
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
	if r.Start > r.End {
		r.Start, r.End = r.End, r.Start
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
	return s.marked, s.composing && !s.compositionEnded
}

func (s *logseqEditorInput) replaceRange(r *ui.TextInputRange) bool {
	if r == nil {
		return true // OCaml owns the current selection/composition.
	}
	start, end := min(r.Start, r.End), max(r.Start, r.End)
	if s.composing {
		if start == s.marked.Start && end == s.marked.End {
			return true
		}
		extensionGap(s.n.Identifier, "replacement outside active preedit requires an OCaml composition range contract")
		return false
	}
	text, _, _, ok := s.snapshot()
	if !ok {
		return false
	}
	s.selectBytes(ui.UTF16ByteOffset(text, start), ui.UTF16ByteOffset(text, end))
	return true
}

func (s *logseqEditorInput) replacePreedit(r *ui.TextInputRange, text string) (string, int, bool) {
	if !s.composing || r == nil {
		return text, 0, false
	}
	start, end := min(r.Start, r.End), max(r.Start, r.End)
	if start < s.marked.Start || end > s.marked.End {
		return text, 0, false
	}
	lo := ui.UTF16ByteOffset(s.preedit, start-s.marked.Start)
	hi := ui.UTF16ByteOffset(s.preedit, end-s.marked.Start)
	return s.preedit[:lo] + text + s.preedit[hi:], ui.UTF16Len(s.preedit[:lo]), true
}

func (s *logseqEditorInput) clearComposition() {
	s.composing, s.preedit = false, ""
	s.compositionEnded = false
	s.marked, s.markedSelection = ui.TextInputRange{}, ui.TextInputRange{}
}

func (s *logseqEditorInput) ReplaceText(r *ui.TextInputRange, text string) {
	if s.mounted && !s.focused {
		return
	}
	caret := -1
	if combined, prefix, ok := s.replacePreedit(r, text); ok {
		if prefix+ui.UTF16Len(text) < ui.UTF16Len(combined) {
			caret = s.marked.Start + prefix + ui.UTF16Len(text)
		}
		text, r = combined, nil
	}
	if !s.replaceRange(r) {
		return
	}
	if s.composing {
		s.clearComposition()
		s.send("composition", map[string]any{"state": "end", "text": text})
		if caret >= 0 {
			if source, _, _, ok := s.snapshot(); ok {
				byteCaret := ui.UTF16ByteOffset(source, caret)
				s.selectBytes(byteCaret, byteCaret)
			} else {
				extensionGap(s.n.Identifier, "source/selection snapshot absent after composition commit")
			}
		}
	} else {
		s.send("insert", map[string]any{"text": text})
	}
}

func (s *logseqEditorInput) SetMarkedText(r *ui.TextInputRange, text string, selected ui.TextInputRange) {
	if s.mounted && !s.focused {
		return
	}
	selected = ui.TextInputRange{
		Start: ui.UTF16Len(text[:ui.UTF16ByteOffset(text, min(selected.Start, selected.End))]),
		End:   ui.UTF16Len(text[:ui.UTF16ByteOffset(text, max(selected.Start, selected.End))]),
	}
	// A native IME may replace only part of its active preedit. This transient
	// string is IME state, not an independently editable document.
	if combined, prefix, ok := s.replacePreedit(r, text); ok {
		selected.Start += prefix
		selected.End += prefix
		text = combined
		r = nil
	}
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
			start = ui.UTF16Len(source[:ui.UTF16ByteOffset(source, min(r.Start, r.End))])
		}
		s.marked.Start = start
		s.composing = true
		s.send("composition", map[string]any{"state": "start"})
	}
	s.preedit = text
	s.compositionEnded = false
	length := ui.UTF16Len(text)
	s.marked.End = s.marked.Start + length
	s.markedSelection = ui.TextInputRange{Start: s.marked.Start + min(max(0, selected.Start), length), End: s.marked.Start + min(max(0, selected.End), length)}
	s.send("composition", map[string]any{"state": "update", "text": text})
}

// Native end can precede the final candidate. Retain only transient preedit
// until ReplaceText confirms it or CancelComposition discards it.
func (s *logseqEditorInput) EndComposition() {
	if s.composing {
		s.compositionEnded = true
	}
}

func (s *logseqEditorInput) CancelComposition() {
	if !s.composing {
		return
	}
	s.clearComposition()
	s.send("composition", map[string]any{"state": "cancel"})
}

func (s *logseqEditorInput) UnmarkText() {
	if !s.composing {
		return
	}
	text := s.preedit
	s.clearComposition()
	s.send("composition", map[string]any{"state": "end", "text": text})
}

func (s *logseqEditorInput) BoundsForRange(r ui.TextInputRange) (ui.Rect, ui.TextInputRange, bool) {
	text, _, _, ok := s.snapshot()
	if !ok {
		return ui.Rect{}, ui.TextInputRange{}, false
	}
	offset := ui.UTF16ByteOffset(text, r.Start)
	rect, ok := s.caretRect(offset)
	index := ui.UTF16Len(text[:offset])
	return rect, ui.TextInputRange{Start: index, End: index}, ok
}

func (s *logseqEditorInput) IndexForPoint(p ui.Point) (int, bool) {
	text, _, _, ok := s.snapshot()
	if !ok {
		return 0, false
	}
	offset, ok := s.offsetAt(p)
	if !ok || !extensionByteBoundary(text, offset) {
		return 0, false
	}
	return ui.UTF16Len(text[:offset]), true
}

func (s *logseqEditorInput) caretRect(offset int) (ui.Rect, bool) {
	if l, ok := s.currentLayout(); ok {
		r, ok := l.caret(offset)
		if !ok {
			return ui.Rect{}, false
		}
		a, ok := l.space.WindowToLocal(ui.Point{X: r.X, Y: r.Y})
		if !ok {
			return ui.Rect{}, false
		}
		b, ok := l.space.WindowToLocal(ui.Point{X: r.X + r.W, Y: r.Y + r.H})
		if !ok {
			return ui.Rect{}, false
		}
		return ui.Rect{X: min(a.X, b.X), Y: min(a.Y, b.Y), W: absEditor(a.X - b.X), H: absEditor(a.Y - b.Y)}, true
	}
	return ui.Rect{}, false
}

func absEditor(value float32) float32 {
	if value < 0 {
		return -value
	}
	return value
}

func (s *logseqEditorInput) offsetAt(p ui.Point) (int, bool) {
	if l, ok := s.currentLayout(); ok {
		point, ok := l.space.LocalToWindow(p)
		if !ok {
			return 0, false
		}
		return l.offsetAt(point)
	}
	return 0, false
}

func (s *logseqEditorInput) editCommand(command string) bool {
	if s.composing {
		return false
	}
	switch command {
	case "copy", "cut":
		text, a, b, ok := s.snapshot()
		if !ok {
			return false
		}
		lo, hi := min(a, b), max(a, b)
		if lo == hi {
			return true
		}
		if err := mygo.Clipboard.Write(transfer.TextData(text[lo:hi])); err != nil {
			extensionGap(s.n.Identifier, err.Error())
			return true
		}
		if command == "cut" {
			s.send("delete", map[string]any{"kind": "selection"})
		}
		return true
	case "paste", "pasteAndMatchStyle":
		data, err := mygo.Clipboard.Read(transfer.Text)
		if errors.Is(err, transfer.ErrFormat) {
			return true
		}
		if err != nil {
			extensionGap(s.n.Identifier, err.Error())
			return true
		}
		payload, err := data.Read(transfer.Text)
		if err != nil {
			extensionGap(s.n.Identifier, err.Error())
			return true
		}
		if len(payload) != 0 {
			s.ReplaceText(nil, string(payload))
		}
		return true
	case "undo", "redo":
		s.send("key", map[string]any{"key": "z", "ctrl": true, "shift": command == "redo"})
		return true
	}
	return false
}
