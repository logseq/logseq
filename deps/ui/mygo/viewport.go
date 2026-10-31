//go:build darwin || linux

package main

import (
	"sort"
	"strings"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

// viewportRenderer implements the native lazy-row protocol using committed
// host bindings. Only marked rows visited by the real frame are candidates.
type viewportRenderer struct {
	viewServices ui.Services
	epoch        uint64
	rows         map[int64]*viewportRow
	pressed      luimygo.InputNode
	button       int
}

type viewportRow struct {
	target     platformTarget
	seen       uint64
	key        string
	lazy, list bool
	group      bool
	handle     ui.Handle
	near       bool
	unmounted  bool
	end        float32
	count      string
	emit       func(luimygo.Event)
}

func (v *viewportRenderer) BeginView(s *platformServices, c *ui.Context) {
	v.epoch++
	epoch := v.epoch
	services := c.Services()
	v.viewServices = services
	width, height := c.Size()
	window := ui.Rect{W: width, H: height}
	generation := s.backend.Generation()
	c.AfterFrame(func() {
		if v.epoch != epoch || v.viewServices != services {
			return
		}
		defer func() { v.viewServices = ui.Services{} }()
		if s.backend.Generation() != generation {
			return
		}
		// Cache only this pass's candidates/ancestors: Node copies child slices.
		// Recopying a shared list ancestor per row would be quadratic.
		nodes := make(map[int64]luimygo.Node)
		node := func(id int64) (luimygo.Node, bool) {
			if n, ok := nodes[id]; ok {
				return n, true
			}
			n, ok := s.backend.Node(id)
			if ok {
				if s.mutations != nil {
					n = s.mutations.BindDOMMutations(n)
				}
				nodes[id] = n
			}
			return n, ok
		}
		var entering []*viewportRow
		pinned := make(map[int64]bool)
		if !v.pressed.Current() || s.desktop.closed {
			v.pressed = luimygo.InputNode{}
		}
		pin := func(id int64) {
			for id != 0 {
				n, ok := node(id)
				if !ok {
					break
				}
				pinned[id] = true
				id = n.Parent
			}
		}
		pin(v.pressed.Node.ID)
		for _, owner := range s.backend.OpenMenuOwners(c) {
			if owner.Current() {
				pin(owner.Node.ID)
			}
		}
		for id, row := range v.rows {
			if s.backend.Generation() != generation {
				return
			}
			if row.seen != epoch || !s.liveTarget(row.target) || s.desktop.closed {
				delete(v.rows, id)
				continue
			}
			n, _ := node(id)
			attrs := extensionAttrs(n)
			key, lazy := attrs["data-lazy-mount"]
			count, list := attrs["data-virt-count"]
			if !rawMarkupVisible(n) || lazy != row.lazy || list != row.list || key != row.key {
				delete(v.rows, id)
				continue
			}
			if !lazy && !list {
				continue
			}
			r, ok := s.backend.Bounds(c, id)
			if !ok {
				delete(v.rows, id)
				continue
			}
			clip, offset, ok := v.viewport(s, c, n, window, node)
			if !ok {
				delete(v.rows, id)
				continue
			}
			// Match Host_interaction.viewport_events' native overscan band.
			horizontal := clip.W > 0 && clip.H > 0 && r.X < clip.X+clip.W && r.X+r.W > clip.X
			near := horizontal && r.Y < clip.Y+clip.H+768 && r.Y+r.H > clip.Y-256
			if lazy {
				if near && !row.near {
					entering = append(entering, row)
				} else if !near && !pinned[id] && !row.handle.FocusWithin(c) && (row.near || n.String("height") == "auto" && !row.unmounted) {
					row.near, row.unmounted = false, true
					extensionDOMEvent(n, row.emit, "lazy-unmount", map[string]any{"height": r.H})
				}
			} else if list {
				bottom := r.Y + r.H
				// Scroll motion is not content growth. Compare in content DIPs,
				// otherwise a small upward scroll would republish virt-end.
				end := bottom + offset
				if horizontal && bottom < clip.Y+clip.H+768 && bottom > clip.Y-256 && (end > row.end || count != row.count) {
					row.end, row.count = end, count
					extensionDOMEvent(n, row.emit, "virt-end", nil)
				}
			}
		}
		v.mount(s, entering, node, generation)
	})
}

func (v *viewportRenderer) Bind(s *platformServices, c *ui.Context, n luimygo.Node, e ui.Element, emit func(luimygo.Event)) {
	if v.viewServices == (ui.Services{}) || v.viewServices != c.Services() || s.desktop.closed {
		return
	}
	attrs := extensionAttrs(n)
	key, lazy := attrs["data-lazy-mount"]
	_, list := attrs["data-virt-count"]
	group := !lazy && viewportEvent(n, "lazy-mount")
	if !lazy && !list && !group {
		return
	}
	if v.rows == nil {
		v.rows = make(map[int64]*viewportRow)
	}
	target := s.controlTarget(n.ID)
	row := v.rows[n.ID]
	if row == nil || row.target != target || row.key != key || row.lazy != lazy || row.list != list || row.group != group {
		row = &viewportRow{target: target, key: key, lazy: lazy, list: list, group: group, end: -1}
		v.rows[n.ID] = row
	}
	row.seen, row.emit = v.epoch, emit
	e.Bind(&row.handle)
}

// ViewportInput observes raw hits without turning them into native controls.
// Keep the pressed incarnation until its real release, even outside the row.
func (s *platformServices) ViewportInput(ev ui.InputEvent, target luimygo.InputNode) {
	v := &s.viewport
	switch ev.Kind {
	case ui.InputPointerDown:
		v.pressed, v.button = luimygo.InputNode{}, ev.Button
		if target.Current() && !s.desktop.closed {
			v.pressed = target
		}
	case ui.InputPointerUp:
		if ev.Button == v.button {
			v.pressed = luimygo.InputNode{}
		}
	}
}

// CancelViewportPress releases a gesture whose real window has lost focus.
func (s *platformServices) CancelViewportPress() {
	if s.viewport.pressed.Node.ID == 0 {
		return
	}
	s.viewport.pressed = luimygo.InputNode{}
	if s.Invalidate != nil {
		s.Invalidate()
	}
}

func viewportEvent(n luimygo.Node, event string) bool {
	for _, name := range strings.Fields(n.String("events")) {
		if name == event {
			return true
		}
	}
	return false
}

func (v *viewportRenderer) mount(s *platformServices, entering []*viewportRow, node func(int64) (luimygo.Node, bool), generation int64) {
	sort.Slice(entering, func(i, j int) bool { return entering[i].target.id < entering[j].target.id })
	groups := make(map[int64][]*viewportRow)
	for _, row := range entering {
		if s.backend.Generation() != generation {
			return
		}
		if !s.liveTarget(row.target) {
			continue
		}
		n, _ := node(row.target.id)
		owner := row
		for parent := n.Parent; parent != 0; {
			ancestor, exists := node(parent)
			if !exists {
				break
			}
			// A lazy row handles its own mount, not its children's UUIDs.
			// The first event-bearing ancestor is the ownership boundary.
			if ancestor.String("events") != "" {
				candidate := v.rows[parent]
				if candidate != nil && candidate.group && !candidate.lazy && candidate.seen == v.epoch {
					owner = candidate
				}
				break
			}
			parent = ancestor.Parent
		}
		if owner == row {
			extensionDOMEvent(n, row.emit, "lazy-mount", nil)
			row.near, row.unmounted = true, false
		} else {
			groups[owner.target.id] = append(groups[owner.target.id], row)
		}
	}
	for id, rows := range groups {
		if s.backend.Generation() != generation {
			return
		}
		owner := v.rows[id]
		if owner != nil && s.liveTarget(owner.target) {
			uuids := make([]string, 0, len(rows))
			for _, row := range rows {
				if s.liveTarget(row.target) {
					uuids = append(uuids, row.key)
				}
			}
			if len(uuids) == 0 {
				continue
			}
			n, _ := node(id)
			extensionDOMEvent(n, owner.emit, "lazy-mount", map[string]any{"uuids": uuids})
			for _, row := range rows {
				row.near, row.unmounted = true, false
			}
		}
	}
}

func (v *viewportRenderer) viewport(s *platformServices, c *ui.Context, n luimygo.Node, clip ui.Rect, node func(int64) (luimygo.Node, bool)) (ui.Rect, float32, bool) {
	var offset float32
	for parent := n.Parent; parent != 0; {
		ancestor, exists := node(parent)
		if !exists {
			return ui.Rect{}, 0, false
		}
		if !rawMarkupVisible(ancestor) {
			return ui.Rect{}, 0, false
		}
		// textContent can suppress every child without dropping backend nodes.
		if len(ancestor.Children) == 0 {
			return ui.Rect{}, 0, false
		}
		scroll := s.isScroller(ancestor) || ancestor.String("overflow") == "auto"
		if scroll || ancestor.String("overflow") == "hidden" {
			r, ok := s.backend.Bounds(c, parent)
			if !ok {
				return ui.Rect{}, 0, false
			}
			left, top := max(clip.X, r.X), max(clip.Y, r.Y)
			right, bottom := min(clip.X+clip.W, r.X+r.W), min(clip.Y+clip.H, r.Y+r.H)
			clip = ui.Rect{X: left, Y: top, W: max(0, right-left), H: max(0, bottom-top)}
			if scroll {
				_, y, known := s.backend.CommittedScrollOffset(c, parent)
				if !known {
					return ui.Rect{}, 0, false
				}
				offset += y
			}
		}
		parent = ancestor.Parent
	}
	return clip, offset, true
}
