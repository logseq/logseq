package main

import (
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

// This is a read-only projection of one committed display model onto its
// painted runs. It never edits or reconstructs an OCaml document.
type editorRun struct {
	lo, hi   int
	tag      byte
	hidden   bool
	text     string
	geometry []ui.CommittedText
}

type editorLayout struct {
	backend             *luimygo.Backend
	generation          int64
	source, encodedRuns string
	origin              ui.Rect
	space               ui.CommittedSpace
	runs                []editorRun
}

type editorGeometryHost struct {
	sinks   map[int64]*logseqEditorInput
	pending map[string]editorGeometryRequest
}

type editorGeometryRequest struct {
	name                string
	node                int64
	block, source, runs string
	values              map[string]any
}

var editorGeometryHosts = map[*platformServices]*editorGeometryHost{}

func (s *platformServices) editorHost() *editorGeometryHost {
	h := editorGeometryHosts[s]
	if h == nil {
		h = &editorGeometryHost{sinks: map[int64]*logseqEditorInput{}, pending: map[string]editorGeometryRequest{}}
		editorGeometryHosts[s] = h
	}
	return h
}

// CloseEditor retires this window's input/measurement state. The host calls it
// on disposal; no retained Element or OS edit history is owned here.
func (s *platformServices) CloseEditor() { delete(editorGeometryHosts, s) }

// CancelEditorPointer releases this window's drag capture without emitting input.
// Call on the UI thread from the window's real blur callback.
func (s *platformServices) CancelEditorPointer() {
	if h := editorGeometryHosts[s]; h != nil {
		for _, input := range h.sinks {
			input.dragging = false
		}
	}
}

// EditorPointer routes a pre-dispatch window-space pointer to the input sink
// of its actual block-editor ancestor. The sink is intentionally only 1 DIP;
// the standard rich text, not an invisible replacement editor, receives hits.
// Call this after global DOM capture and before ordinary target dispatch.
func (s *platformServices) EditorPointer(ev ui.InputEvent, target int64) bool {
	switch ev.Kind {
	case ui.InputPointerDown, ui.InputPointerMove, ui.InputPointerUp:
	default:
		return false
	}
	h := s.editorHost()
	var input *logseqEditorInput
	for _, candidate := range h.sinks {
		if candidate.dragging {
			input = candidate
			break
		}
	}
	if input == nil {
		n, ok := s.backend.Node(target)
		for ok && !editorClass(n, "block-editor") {
			if n.Parent == 0 {
				return false
			}
			n, ok = s.backend.Node(n.Parent)
		}
		if !ok {
			return false
		}
		for id, candidate := range h.sinks {
			sink, ok := s.backend.Node(id)
			if !ok {
				continue
			}
			for sink.Parent != 0 && sink.Parent != n.ID {
				sink, ok = s.backend.Node(sink.Parent)
				if !ok {
					break
				}
			}
			if ok && sink.Parent == n.ID {
				input = candidate
				break
			}
		}
	}
	if input == nil {
		return false
	}
	l, ok := input.currentLayout()
	if !ok {
		return false
	}
	p, ok := l.space.WindowToLocal(ui.Point{X: ev.X, Y: ev.Y})
	if !ok {
		return false
	}
	ev.X, ev.Y = p.X, p.Y
	return input.input(ev)
}

func editorClass(n luimygo.Node, class string) bool {
	for _, c := range strings.Fields(n.String("style-class")) {
		if c == class {
			return true
		}
	}
	return false
}

func editorRunSpans(source, encoded string) ([]editorRun, error) {
	var runs []editorRun
	previous := 0
	for _, field := range strings.Split(encoded, ";") {
		if field == "" {
			continue
		}
		parts := strings.Split(field, ",")
		if len(parts) != 3 || len(parts[2]) != 1 || !strings.Contains("pdarz", parts[2]) {
			return nil, fmt.Errorf("invalid editor run %q", field)
		}
		lo, e1 := strconv.Atoi(parts[0])
		hi, e2 := strconv.Atoi(parts[1])
		if e1 != nil || e2 != nil || lo < previous || hi < lo || !extensionByteBoundary(source, lo) || !extensionByteBoundary(source, hi) {
			return nil, fmt.Errorf("invalid UTF-8 editor span %q", field)
		}
		runs = append(runs, editorRun{lo: lo, hi: hi, tag: parts[2][0]})
		previous = hi
	}
	if len(runs) == 0 {
		return nil, fmt.Errorf("editor runs absent")
	}
	return runs, nil
}

func (s *platformServices) measureEditor(c *ui.Context, input *logseqEditorInput) (*editorLayout, error) {
	n, ok := s.backend.Node(input.n.ID)
	if !ok || n.Identifier != input.n.Identifier || n.String("block-id") != input.n.String("block-id") {
		return nil, nil
	}
	source, _, _, ok := input.snapshot()
	if !ok {
		return nil, nil
	}
	runs, err := editorRunSpans(source, n.String("runs"))
	if err != nil {
		return nil, err
	}
	container := n
	for !editorClass(container, "block-editor") {
		if container.Parent == 0 {
			return nil, fmt.Errorf("editor %s has no block-editor ancestor", n.String("block-id"))
		}
		container, ok = s.backend.Node(container.Parent)
		if !ok {
			return nil, nil
		}
	}
	origin, ok := s.backend.CommittedBounds(c, container.ID)
	if !ok {
		return nil, nil
	}
	space, ok := input.handle.Coordinates(c)
	if !ok {
		return nil, nil
	}
	var nodes []luimygo.Node
	var walk func(luimygo.Node)
	walk = func(node luimygo.Node) {
		if editorClass(node, "ed-r") {
			nodes = append(nodes, node)
			return
		}
		for _, id := range node.Children {
			if child, found := s.backend.Node(id); found {
				walk(child)
			}
		}
	}
	walk(container)
	if len(nodes) != len(runs) {
		return nil, fmt.Errorf("editor run/layout mismatch: %d spans, %d nodes", len(runs), len(nodes))
	}
	for i, node := range nodes {
		run := &runs[i]
		run.hidden = node.String("display") == "none"
		if run.hidden {
			continue
		}
		var collect func(luimygo.Node)
		collect = func(current luimygo.Node) {
			if current.String("display") == "none" {
				return
			}
			if g, found := s.backend.TextGeometry(c, current.ID); found {
				t, valid := g.Text()
				if valid {
					run.geometry = append(run.geometry, g)
					run.text += t
				}
				return
			}
			for _, id := range current.Children {
				if child, found := s.backend.Node(id); found {
					collect(child)
				}
			}
		}
		collect(node)
		if len(run.geometry) == 0 {
			return nil, nil
		} // No committed text: do not invent a font box.
		if run.tag != 'a' && run.tag != 'z' && run.text != source[run.lo:run.hi] {
			return nil, fmt.Errorf("editor display/source mismatch at byte %d", run.lo)
		}
	}
	return &editorLayout{s.backend, s.backend.Generation(), source, n.String("runs"), origin, space, runs}, nil
}

func (s *logseqEditorInput) currentLayout() (*editorLayout, bool) {
	l := s.layout
	if l == nil || l.backend.Generation() != l.generation {
		return nil, false
	}
	if _, ok := l.space.Bounds(); !ok {
		return nil, false
	}
	n, ok := l.backend.Node(s.n.ID)
	if !ok || n.String("runs") != l.encodedRuns || n.String("block-id") != s.n.String("block-id") {
		return nil, false
	}
	source, _, _, ok := s.snapshot()
	if !ok || source != l.source {
		return nil, false
	}
	for _, run := range l.runs {
		for _, g := range run.geometry {
			if _, ok := g.Text(); !ok {
				return nil, false
			}
		}
	}
	return l, true
}

func (r editorRun) caret(offset int) (ui.Rect, bool) {
	if r.hidden || len(r.geometry) == 0 {
		return ui.Rect{}, false
	}
	if r.tag == 'a' {
		g := r.geometry[0]
		index := 0
		if offset >= r.hi {
			g = r.geometry[len(r.geometry)-1]
			text, ok := g.Text()
			if !ok {
				return ui.Rect{}, false
			}
			index = utf8.RuneCountInString(text)
		}
		return g.Caret(index)
	}
	index := 0
	if r.tag != 'z' {
		index = utf8.RuneCountInString(r.text[:min(max(0, offset-r.lo), len(r.text))])
	}
	return r.geometry[0].Caret(index)
}

func (l *editorLayout) caret(offset int) (ui.Rect, bool) {
	if !extensionByteBoundary(l.source, offset) {
		return ui.Rect{}, false
	}
	// Prefer the following run at a shared boundary, preserving downstream wrap
	// affinity. Hidden delimiters borrow a real adjacent painted boundary.
	for i := len(l.runs) - 1; i >= 0; i-- {
		r := l.runs[i]
		if offset >= r.lo && offset <= r.hi {
			if rect, ok := r.caret(offset); ok {
				return rect, true
			}
		}
	}
	for _, r := range l.runs {
		if r.lo >= offset {
			if rect, ok := r.caret(r.lo); ok {
				return rect, true
			}
		}
	}
	for i := len(l.runs) - 1; i >= 0; i-- {
		r := l.runs[i]
		if r.hi <= offset {
			if rect, ok := r.caret(r.hi); ok {
				return rect, true
			}
		}
	}
	return ui.Rect{}, false
}

func (l *editorLayout) selection(first, last int) ([]ui.Rect, bool) {
	if first > last {
		first, last = last, first
	}
	if !extensionByteBoundary(l.source, first) || !extensionByteBoundary(l.source, last) {
		return nil, false
	}
	out := []ui.Rect{}
	for _, r := range l.runs {
		if r.hidden || r.tag == 'z' || last <= r.lo || first >= r.hi {
			continue
		}
		for _, g := range r.geometry {
			text, ok := g.Text()
			if !ok {
				return nil, false
			}
			a, b := 0, utf8.RuneCountInString(text)
			if r.tag != 'a' {
				a = utf8.RuneCountInString(text[:max(first, r.lo)-r.lo])
				b = utf8.RuneCountInString(text[:min(last, r.hi)-r.lo])
			}
			rects, ok := g.SelectionRects(a, b)
			if !ok {
				return nil, false
			}
			out = append(out, rects...)
		}
	}
	return out, true
}

func editorDistance(r ui.Rect, p ui.Point) float64 {
	dx := max(r.X-p.X, p.X-r.X-r.W, 0)
	dy := max(r.Y-p.Y, p.Y-r.Y-r.H, 0)
	return float64(dx*dx + dy*dy)
}

func (l *editorLayout) offsetAt(p ui.Point) (int, bool) {
	best := math.Inf(1)
	offset := 0
	found := false
	for _, r := range l.runs {
		if r.hidden {
			continue
		}
		for _, g := range r.geometry {
			lines, ok := g.Lines()
			if !ok {
				return 0, false
			}
			for _, line := range lines {
				d := editorDistance(line.Bounds, p)
				if d >= best {
					continue
				}
				i, ok := g.IndexAt(p)
				if !ok {
					continue
				}
				mapped := r.lo
				if r.tag == 'a' {
					mapped = min(r.hi, r.lo+1)
				} else if r.tag != 'z' {
					mapped = r.lo + extensionRuneByte(r.text, i)
				}
				best, offset, found = d, mapped, true
			}
		}
	}
	return offset, found
}

type editorVisualLine struct {
	first, last int
	rect        ui.Rect
}

func (l *editorLayout) lines() ([]editorVisualLine, bool) {
	var lines []editorVisualLine
	for _, r := range l.runs {
		if r.hidden {
			continue
		}
		for _, g := range r.geometry {
			visual, ok := g.Lines()
			if !ok {
				return nil, false
			}
			for _, v := range visual {
				a, b := r.lo, r.hi
				if r.tag != 'a' && r.tag != 'z' {
					a = r.lo + extensionRuneByte(r.text, v.Start)
					b = r.lo + extensionRuneByte(r.text, v.End)
				}
				lines = append(lines, editorVisualLine{a, b, v.Bounds})
			}
		}
	}
	sort.SliceStable(lines, func(i, j int) bool {
		if lines[i].rect.Y == lines[j].rect.Y {
			return lines[i].first < lines[j].first
		}
		return lines[i].rect.Y < lines[j].rect.Y
	})
	var out []editorVisualLine
	for _, line := range lines {
		if len(out) > 0 {
			last := &out[len(out)-1]
			if line.rect.Y < last.rect.Y+last.rect.H && last.rect.Y < line.rect.Y+line.rect.H {
				last.first = min(last.first, line.first)
				last.last = max(last.last, line.last)
				continue
			}
		}
		out = append(out, line)
	}
	if len(out) > 0 {
		out[0].first = 0
		out[len(out)-1].last = len(l.source)
	}
	for i := 1; i < len(out); i++ {
		if out[i].first < out[i-1].last {
			return nil, false
		} // A multiline atomic decoration cannot partition source.
		if strings.TrimSpace(l.source[out[i-1].last:out[i].first]) != "" {
			out[i-1].last = out[i].first
		}
	}
	return out, len(out) > 0
}

// EditorRequest queues geometry until the actual frame commits. The parent
// routes only these five platform operations here, then calls EditorAfterFrame.
// set-input-focus remains owned by BindEditorControl/platform controls.
func (s *platformServices) EditorRequest(name, payload string) (bool, error) {
	switch name {
	case "caret-rect", "selection-rects", "offset-at", "line-ranges", "scroll-height":
	default:
		return false, nil
	}
	var values map[string]any
	if err := json.Unmarshal([]byte(payload), &values); err != nil {
		return true, err
	}
	block, ok := values["block-id"].(string)
	if !ok || block == "" {
		return true, fmt.Errorf("editor measurement requires block-id")
	}
	h := s.editorHost()
	var locate func(int64) (luimygo.Node, bool)
	locate = func(id int64) (luimygo.Node, bool) {
		n, ok := s.backend.Node(id)
		if !ok {
			return n, false
		}
		if n.Kind == "logseq-editor" && n.String("block-id") == block {
			return n, true
		}
		for _, child := range n.Children {
			if node, ok := locate(child); ok {
				return node, true
			}
		}
		return luimygo.Node{}, false
	}
	for _, id := range s.backend.Roots() {
		n, ok := locate(id)
		if !ok {
			continue
		}
		if logseqEditorServices.Snapshot == nil {
			return true, fmt.Errorf("editor snapshot service absent")
		}
		source, _, _, ok := logseqEditorServices.Snapshot(block)
		if !ok {
			return true, fmt.Errorf("editor snapshot absent for %s", block)
		}
		h.pending[name+"|"+payload] = editorGeometryRequest{name, n.ID, block, source, n.String("runs"), values}
		return true, nil
	}
	return true, fmt.Errorf("editor %s is not mounted", block)
}

// EditorAfterFrame resolves only requests that still name the same displayed
// source/runs. Uncommitted or superseded measurements produce no fabricated
// reply; OCaml's epoch/pending query protocol requests them again.
func (s *platformServices) EditorAfterFrame(c *ui.Context) ([]platformReply, error) {
	h := s.editorHost()
	for id, input := range h.sinks {
		if _, ok := s.backend.Node(id); !ok {
			delete(h.sinks, id)
			continue
		}
		layout, err := s.measureEditor(c, input)
		if err != nil {
			return nil, err
		}
		input.layout = layout
	}
	requests := h.pending
	h.pending = map[string]editorGeometryRequest{}
	var replies []platformReply
	for _, request := range requests {
		input := h.sinks[request.node]
		if input == nil {
			continue
		}
		l, ok := input.currentLayout()
		if !ok || l.source != request.source || l.encodedRuns != request.runs {
			continue
		}
		values := request.values
		num := func(key string) (int, bool) { v, ok := values[key].(float64); return int(v), ok && v == math.Trunc(v) }
		reply := map[string]any{"block-id": request.block}
		switch request.name {
		case "caret-rect":
			off, ok := num("offset")
			if !ok {
				return nil, fmt.Errorf("caret-rect requires byte offset")
			}
			r, ok := l.caret(off)
			if !ok {
				continue
			}
			reply["offset"], reply["x"], reply["y"], reply["h"], reply["ox"], reply["oy"] = off, r.X-l.origin.X, r.Y-l.origin.Y, r.H, l.origin.X, l.origin.Y
		case "selection-rects":
			a, ok := num("first")
			if !ok {
				return nil, fmt.Errorf("selection-rects requires first")
			}
			b, ok := num("last")
			if !ok {
				return nil, fmt.Errorf("selection-rects requires last")
			}
			rects, ok := l.selection(a, b)
			if !ok {
				continue
			}
			out := []map[string]float32{}
			for _, r := range rects {
				out = append(out, map[string]float32{"x": r.X - l.origin.X, "y": r.Y - l.origin.Y, "w": r.W, "h": r.H})
			}
			reply["first"], reply["last"], reply["rects"] = a, b, out
		case "offset-at":
			x, ok := num("x")
			if !ok {
				return nil, fmt.Errorf("offset-at requires x")
			}
			y, ok := num("y")
			if !ok {
				return nil, fmt.Errorf("offset-at requires y")
			}
			off, ok := l.offsetAt(ui.Point{X: float32(x) + l.origin.X, Y: float32(y) + l.origin.Y})
			if !ok {
				continue
			}
			reply["x"], reply["y"], reply["offset"] = x, y, off
		case "line-ranges":
			lines, ok := l.lines()
			if !ok {
				continue
			}
			var ranges []string
			for _, line := range lines {
				ranges = append(ranges, fmt.Sprintf("%d,%d", line.first, line.last))
			}
			reply["ranges"] = strings.Join(ranges, ";")
		case "scroll-height":
			lines, ok := l.lines()
			if !ok {
				continue
			}
			height := float32(0)
			for _, line := range lines {
				height = max(height, line.rect.Y+line.rect.H-l.origin.Y)
			}
			reply["height"] = height
		}
		data, err := json.Marshal(reply)
		if err != nil {
			return nil, err
		}
		replies = append(replies, platformReply{Name: request.name, Payload: string(data)})
	}
	return replies, nil
}
