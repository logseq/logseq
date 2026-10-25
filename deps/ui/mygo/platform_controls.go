//go:build darwin || linux

package main

import (
	"encoding/json"
	"fmt"
	"math"
	"unicode/utf8"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

type platformTarget struct {
	id    int64
	epoch uint64
}

type platformInputCommand struct {
	target     platformTarget
	selectAll  bool
	start, end int
	applied    bool
}

type platformFocusCommand struct {
	target  platformTarget
	focused bool
}

type platformValueCommand struct {
	target  platformTarget
	value   string
	applied bool
}

type platformScrollControl struct {
	target platformTarget
	state  *ui.ScrollState
}

type platformDOMRequest struct {
	op       string
	body     json.RawMessage
	request  map[string]json.RawMessage
	target   platformTarget
	scroller platformTarget
	scrolled map[int64]bool
}

type platformControls struct {
	epochs      map[int64]uint64
	nextEpoch   uint64
	focused     int64
	input       map[int64]platformInputCommand
	values      map[int64]platformValueCommand
	scrolls     map[int64]platformScrollControl
	editorFocus map[string]platformFocusCommand
	pending     []platformDOMRequest
}

// AppliedBatch must follow each successful Backend.ApplyJSON, before handling
// subsequent platform requests. In-flight work belongs to a node incarnation,
// not an ID that a later drop/create or snapshot can reuse.
func (s *platformServices) AppliedBatch(batch luimygo.Batch, snapshot bool) {
	if snapshot {
		s.controls = platformControls{nextEpoch: s.controls.nextEpoch}
		return
	}
	for _, op := range batch.Ops {
		if op.Op == "set-extension-prop" || op.Op == "remove-extension-prop" {
			delete(s.controls.scrolls, op.ID)
		}
		if op.Op != "drop-node" && op.Op != "create-node" && op.Op != "create-extension" {
			continue
		}
		delete(s.controls.epochs, op.ID)
		delete(s.controls.input, op.ID)
		delete(s.controls.values, op.ID)
		delete(s.controls.scrolls, op.ID)
		if s.controls.focused == op.ID {
			s.controls.focused = 0
		}
	}
	// detach-subtree retires descendants without individual drop operations.
	for id := range s.controls.epochs {
		if _, ok := s.backend.Node(id); !ok {
			delete(s.controls.epochs, id)
			delete(s.controls.input, id)
			delete(s.controls.values, id)
			delete(s.controls.scrolls, id)
			if s.controls.focused == id {
				s.controls.focused = 0
			}
		}
	}
	for i := range s.controls.pending {
		request := &s.controls.pending[i]
		if request.target.id == 0 && platformIsEditorQuery(request.op) {
			var block string
			if json.Unmarshal(request.request["block-id"], &block) == nil {
				request.target = s.controlTarget(s.editorNode(block))
			}
		}
	}
	for block, command := range s.controls.editorFocus {
		if command.target.id != 0 && !s.liveTarget(command.target) {
			delete(s.controls.editorFocus, block)
			continue
		}
		if command.target.id == 0 {
			command.target = s.controlTarget(s.editorNode(block))
			s.controls.editorFocus[block] = command
		}
	}
}

// BindInputValue applies a model's imperative DOM value before constructing
// TextInput/TextArea. Call after reconciling ordinary text props; the pointer is
// used only during this call, and the command is discarded after commitment.
func (s *platformServices) BindInputValue(n luimygo.Node, value *string) {
	if value == nil {
		panic("BindInputValue requires the native control's value")
	}
	if command, ok := s.controls.values[n.ID]; ok && s.liveTarget(command.target) {
		*value = command.value
		command.applied = true
		s.controls.values[n.ID] = command
	}
}

// BindScrollControl binds an actual custom/raw Scroll, ScrollHorizontal or
// ScrollBoth. State must be incarnation-scoped (for example ui.Local), not an
// Element retained past its build. Standard backend scrollers need no helper.
func (s *platformServices) BindScrollControl(n luimygo.Node, e ui.Element, state *ui.ScrollState) {
	if state == nil {
		panic("BindScrollControl requires native ScrollState")
	}
	if s.controls.scrolls == nil {
		s.controls.scrolls = make(map[int64]platformScrollControl)
	}
	e.TrackScroll(state)
	s.controls.scrolls[n.ID] = platformScrollControl{s.controlTarget(n.ID), state}
}

func (s *platformServices) scrollControl(id int64) *ui.ScrollState {
	control, ok := s.controls.scrolls[id]
	if ok && s.liveTarget(control.target) {
		return control.state
	}
	return nil
}

func (s *platformServices) isScroller(n luimygo.Node) bool {
	return n.Kind == "scroll" || n.Kind == "list" || n.Kind == "virtual-list" || s.scrollControl(n.ID) != nil
}

func (s *platformServices) scrollOffset(id int64) (float32, float32, error) {
	if state := s.scrollControl(id); state != nil {
		return state.X, state.Y, nil
	}
	return s.backend.ScrollOffset(id)
}

func (s *platformServices) scrollTo(id int64, x, y float32) error {
	if state := s.scrollControl(id); state != nil {
		if math.IsNaN(float64(x)) || math.IsNaN(float64(y)) || math.IsInf(float64(x), 0) || math.IsInf(float64(y), 0) {
			return fmt.Errorf("scroll offset must be finite")
		}
		state.Stop()
		state.X, state.Y = max(0, x), max(0, y)
		s.invalidateDOM()
		return nil
	}
	if err := s.backend.ScrollTo(id, x, y); err != nil {
		return err
	}
	s.invalidateDOM()
	return nil
}

func (s *platformServices) invalidateDOM() {
	if s.Invalidate != nil {
		s.Invalidate()
	}
}

func (s *platformServices) controlTarget(id int64) platformTarget {
	if id == 0 {
		return platformTarget{}
	}
	if s.controls.epochs == nil {
		s.controls.epochs = make(map[int64]uint64)
	}
	epoch := s.controls.epochs[id]
	if epoch == 0 {
		s.controls.nextEpoch++
		epoch = s.controls.nextEpoch
		s.controls.epochs[id] = epoch
	}
	return platformTarget{id, epoch}
}

func (s *platformServices) liveTarget(target platformTarget) bool {
	if target.id == 0 || s.controls.epochs[target.id] != target.epoch {
		return false
	}
	_, ok := s.backend.Node(target.id)
	return ok
}

func (s *platformServices) isTextControl(id int64) bool {
	n, ok := s.backend.Node(id)
	if !ok {
		return false
	}
	switch n.Kind {
	case "text-field", "secure-field", "input", "search-field", "textarea", "combobox":
		return true
	case "extension":
		if n.Identifier == "logseq-textarea" {
			return true
		}
		if n.Identifier != "logseq-input" {
			return false
		}
		attrs := extensionAttrs(n)
		return attrs["type"] == "" || attrs["type"] == "text" || attrs["type"] == "search" || attrs["type"] == "email" || attrs["type"] == "url"
	default:
		return false
	}
}

// BindInputControl is called during construction, on an actual TextInput or
// TextArea, after reconciling its OCaml-owned text. Returned UTF-16 offsets are
// build-time only; event handlers must query InputTextSnapshot instead. Neither
// the text nor the frame's Element is retained.
func (s *platformServices) BindInputControl(n luimygo.Node, e ui.Element, text string) (start, end int) {
	e.FocusBind(&s.controls.focused, n.ID)
	if command, ok := s.controls.input[n.ID]; ok {
		if s.liveTarget(command.target) {
			first, last := 0, utf8.RuneCountInString(text)
			if !command.selectAll {
				last = platformUTF16Rune(text, command.end)
				first = min(platformUTF16Rune(text, command.start), last)
			}
			e.SetTextSelection(first, last)
			// Fitting layouts can build discarded probes. Consume only after
			// this node has an actual committed box, not in a probe build.
			command.applied = true
			s.controls.input[n.ID] = command
		}
	}
	first, last := e.TextSelection()
	return platformRuneUTF16(text, first), platformRuneUTF16(text, last)
}

// BindEditorControl binds focus only: the editor's source and selection remain
// in OCaml. Its renderer must report actual focus/blur transitions as usual;
// requesting focus here never synthesizes those acknowledgements.
func (s *platformServices) BindEditorControl(n luimygo.Node, e ui.Element) {
	e.FocusBind(&s.controls.focused, n.ID)
	block := n.String("block-id")
	if command, ok := s.controls.editorFocus[block]; ok {
		delete(s.controls.editorFocus, block)
		if command.target.id != 0 && (command.target.id != n.ID || !s.liveTarget(command.target)) {
			return
		}
		if command.focused {
			s.controls.focused = n.ID
			e.Focus()
		} else if s.controls.focused == n.ID || e.Focused() {
			s.controls.focused = 0
		}
	}
}

// MyGo cannot place a caret inside a surrogate pair; clamp such DOM offsets to
// the preceding native rune boundary, without splitting UTF-8 text.
func platformUTF16Rune(text string, offset int) int {
	count, units := 0, 0
	for _, r := range text {
		width := 1
		if r > 0xffff {
			width = 2
		}
		if units+width > offset {
			break
		}
		units += width
		count++
	}
	return count
}

func platformRuneUTF16(text string, offset int) int {
	units := 0
	for _, r := range text {
		if offset <= 0 {
			break
		}
		units++
		if r > 0xffff {
			units++
		}
		offset--
	}
	return units
}

func appendInputTextSnapshot(backend *luimygo.Backend, c *ui.Context, id int64, payload map[string]any) bool {
	text, anchor, caret, ok := backend.InputTextSnapshot(c, id)
	if !ok {
		return false
	}
	payload["value"] = text
	payload["selectionStart"] = platformRuneUTF16(text, min(anchor, caret))
	payload["selectionEnd"] = platformRuneUTF16(text, max(anchor, caret))
	return true
}

func (s *platformServices) queueDOM(op, body string, request map[string]json.RawMessage, refField string) error {
	queued := platformDOMRequest{op: op, body: json.RawMessage(body), request: request}
	if refField != "" {
		id, err := s.resolveRef(request[refField])
		if err != nil {
			return err
		}
		queued.target = s.controlTarget(id)
	}
	if op == "scroll-row-into-view" {
		id, err := s.resolveRef(request["scroller"])
		if err != nil {
			return err
		}
		queued.scroller = s.controlTarget(id)
	}
	if refField == "" {
		var block string
		if err := platformRequired(request, "block-id", &block); err != nil {
			return err
		}
		if block == "" {
			return fmt.Errorf("block-id must not be empty")
		}
		queued.target = s.controlTarget(s.editorNode(block))
	}
	// Repeated fire-and-poll queries while layout/decoding is pending must not
	// grow the queue. They share a reply, unlike FIFO clipboard read promises.
	for _, pending := range s.controls.pending {
		if pending.op == op && pending.target == queued.target && pending.scroller == queued.scroller && string(pending.body) == body {
			return nil
		}
	}
	s.controls.pending = append(s.controls.pending, queued)
	s.invalidateDOM()
	return nil
}

func (s *platformServices) editorNode(block string) int64 {
	var find func(int64) int64
	find = func(id int64) int64 {
		n, ok := s.backend.Node(id)
		if !ok {
			return 0
		}
		if n.Identifier == "logseq-editor" && n.String("block-id") == block {
			return id
		}
		for _, child := range n.Children {
			if found := find(child); found != 0 {
				return found
			}
		}
		return 0
	}
	for _, root := range s.backend.Roots() {
		if found := find(root); found != 0 {
			return found
		}
	}
	return 0
}

func (s *platformServices) afterDOMFrame(c *ui.Context) ([]platformReply, error) {
	for id, command := range s.controls.values {
		if !s.liveTarget(command.target) {
			delete(s.controls.values, id)
		} else if command.applied {
			if _, ok := s.backend.Bounds(c, id); ok {
				delete(s.controls.values, id)
			}
		}
	}
	for id, command := range s.controls.input {
		if !s.liveTarget(command.target) {
			delete(s.controls.input, id)
		} else if command.applied {
			if _, ok := s.backend.Bounds(c, id); ok {
				delete(s.controls.input, id)
			}
		}
	}
	requests := s.controls.pending
	s.controls.pending = nil
	var replies []platformReply
	for _, request := range requests {
		result, retry, err := s.completeDOM(c, &request)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", request.op, err)
		}
		replies = append(replies, result...)
		if retry {
			s.controls.pending = append(s.controls.pending, request)
		}
	}
	return replies, nil
}

func platformIsEditorQuery(op string) bool {
	switch op {
	case "caret-rect", "selection-rects", "offset-at", "line-ranges", "scroll-height":
		return true
	default:
		return false
	}
}

func (s *platformServices) completeDOM(c *ui.Context, request *platformDOMRequest) ([]platformReply, bool, error) {
	live := s.liveTarget(request.target)
	switch request.op {
	case "measure-node":
		ref := request.request["ref"]
		if len(ref) == 0 {
			ref = json.RawMessage("null")
		}
		result := map[string]any{"ref": ref, "rect": nil}
		if live {
			if r, ok := s.backend.Bounds(c, request.target.id); ok {
				result["nodeId"] = request.target.id
				result["rect"] = map[string]float32{"left": r.X, "top": r.Y, "right": r.X + r.W,
					"bottom": r.Y + r.H, "width": r.W, "height": r.H}
			}
		}
		reply, err := platformJSONReply("node-rect", result)
		return reply, false, err
	case "natural-size":
		if !live {
			return nil, false, nil
		}
		if s.NaturalSize == nil {
			s.reportGap("natural-size", "decoded-image query is not connected; requests remain pending")
			return nil, true, nil
		}
		width, height, ready := s.NaturalSize(request.target.id)
		if !ready {
			return nil, true, nil
		}
		if width <= 0 || height <= 0 || math.IsNaN(float64(width)) || math.IsNaN(float64(height)) || math.IsInf(float64(width), 0) || math.IsInf(float64(height), 0) {
			return nil, false, fmt.Errorf("invalid decoded image dimensions")
		}
		reply, err := platformJSONReply("node-natural-size", map[string]any{"nodeId": request.target.id, "width": width, "height": height})
		return reply, false, err
	case "set-scroll-top":
		if !live {
			return nil, false, nil
		}
		n, _ := s.backend.Node(request.target.id)
		if !s.isScroller(n) {
			if n.Kind == "extension" {
				s.reportGap("scroll-control", "raw native scroller is not bound; requests remain pending")
				return nil, true, nil
			}
			return nil, false, fmt.Errorf("target is not a native scroller")
		}
		var top float32
		if err := platformRequired(request.request, "top", &top); err != nil {
			return nil, false, err
		}
		x, _, err := s.scrollOffset(n.ID)
		if err != nil {
			return nil, false, err
		}
		return nil, false, s.scrollTo(n.ID, x, top)
	case "scroll-into-view", "scroll-to-node", "scroll-row-into-view":
		if !live {
			return nil, false, nil
		}
		if request.op == "scroll-row-into-view" && !s.liveTarget(request.scroller) {
			return nil, false, nil
		}
		retry, err := s.scrollIntoView(c, request)
		return nil, retry, err
	case "set-text-content", "set-attr", "remove-attr", "set-class", "class-add", "class-remove", "style-set-property", "set-checked", "remove", "click":
		if !live {
			return nil, false, nil
		}
		// These commands belong to the authoritative OCaml tree/renderer,
		// not a Go shadow document or local backend generation stream.
		if s.DOMMutation == nil {
			s.reportGap("dom-mutation", "model/renderer mutation bridge is not connected; requests remain pending")
			return nil, true, nil
		}
		normalized := make(map[string]json.RawMessage, len(request.request))
		for key, value := range request.request {
			normalized[key] = value
		}
		// Resolve identifier refs once. A later rename must not redirect
		// this command to a different node with the same identifier.
		normalized["ref"] = json.RawMessage(fmt.Sprintf(`{"node-id":%d}`, request.target.id))
		body, err := json.Marshal(normalized)
		if err != nil {
			return nil, false, err
		}
		return nil, false, s.DOMMutation(request.op, body)
	default:
		// Editor queries can precede the sink's mount. A dropped incarnation
		// must not answer a later incarnation's model-offset request.
		if request.target.id != 0 && !live {
			return nil, false, nil
		}
		if request.target.id == 0 {
			return nil, true, nil
		}
		var block string
		if err := platformRequired(request.request, "block-id", &block); err != nil {
			return nil, false, err
		}
		node, _ := s.backend.Node(request.target.id)
		if node.String("block-id") != block {
			return nil, false, nil
		}
		if s.EditorDOM == nil {
			s.reportGap("editor-layout", "post-frame editor query is not connected; requests remain pending")
			return nil, true, nil
		}
		reply, err := s.EditorDOM(c, request.op, request.body)
		return reply, len(reply) == 0 && err == nil, err
	}
}

// Use a new committed box after each inner scroll: ScrollTo is clamped by the
// next layout, so subtracting its requested offset would fabricate geometry.
func (s *platformServices) scrollIntoView(c *ui.Context, request *platformDOMRequest) (bool, error) {
	target, stop := request.target.id, request.scroller.id
	r, ok := s.backend.Bounds(c, target)
	if !ok {
		return true, nil
	}
	n, _ := s.backend.Node(target)
	if stop != 0 {
		ancestor := n.Parent
		for ancestor != 0 && ancestor != stop {
			parent, _ := s.backend.Node(ancestor)
			ancestor = parent.Parent
		}
		if ancestor != stop {
			return false, nil // Reparented since this request was queued.
		}
		parent, _ := s.backend.Node(stop)
		if !s.isScroller(parent) {
			if parent.Kind == "extension" {
				s.reportGap("scroll-control", "raw native scroller is not bound; requests remain pending")
				return true, nil
			}
			return false, fmt.Errorf("requested scroller is not a native scroll container")
		}
	}
	for n.Parent != 0 {
		n, ok = s.backend.Node(n.Parent)
		if !ok {
			return false, fmt.Errorf("target has a missing ancestor")
		}
		if !request.scrolled[n.ID] && s.isScroller(n) {
			viewport, visible := s.backend.Bounds(c, n.ID)
			if !visible {
				return true, nil
			}
			x, y, err := s.scrollOffset(n.ID)
			if err != nil {
				return false, err
			}
			dx := platformRevealDelta(r.X, r.W, viewport.X, viewport.W)
			dy := platformRevealDelta(r.Y, r.H, viewport.Y, viewport.H)
			if dx != 0 || dy != 0 {
				if err := s.scrollTo(n.ID, x+dx, y+dy); err != nil {
					return false, err
				}
				if request.scrolled == nil {
					request.scrolled = make(map[int64]bool)
				}
				request.scrolled[n.ID] = true
				return n.ID != stop && n.Parent != 0, nil
			}
		}
		if n.ID == stop {
			return false, nil
		}
	}
	return false, nil
}

func platformRevealDelta(start, size, viewportStart, viewportSize float32) float32 {
	if start < viewportStart && start+size < viewportStart+viewportSize {
		return start - viewportStart
	}
	if start > viewportStart && start+size > viewportStart+viewportSize {
		return min(start-viewportStart, start+size-viewportStart-viewportSize)
	}
	return 0
}
