package main

import (
	"context"
	"errors"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

type resourceResult struct {
	image         ui.ImageSource
	width, height float32
	err           error
	done          bool
}

type resourceEntry struct {
	mu     sync.Mutex
	result resourceResult
	cancel context.CancelFunc
	refs   int
}

func (e *resourceEntry) snapshot() resourceResult {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.result
}

type resourceOwner struct {
	source resourceSource
	entry  *resourceEntry
	seen   uint64
}

type resourceEventState struct {
	source resourceSource
	err    string
	sent   bool
}

// One renderer belongs to one runtime/window. Its methods run on the UI thread;
// workers publish only decoded immutable images behind resourceEntry.mu.
type resourceRenderer struct {
	backend *luimygo.Backend
	owners  map[int64]resourceOwner
	cache   map[resourceSource]*resourceEntry
	workers chan struct{}
	closed  bool
	epoch   uint64
	view    *ui.Context

	// ResolveAsset must use the current OCaml-owned graph mapping, not cwd.
	// ResolveSource may resolve graph-relative src values through that same owner.
	ResolveAsset  func(filename string) (string, error)
	ResolveSource func(source string) (string, error)
	Style         func(c *ui.Context, e ui.Element, n luimygo.Node, attrs map[string]string, tag string)
	Project       func(luimygo.Node) luimygo.Node
}

func newResourceRenderer(backend *luimygo.Backend) *resourceRenderer {
	return &resourceRenderer{
		backend: backend,
		owners:  make(map[int64]resourceOwner),
		cache:   make(map[resourceSource]*resourceEntry),
		workers: make(chan struct{}, 8),
	}
}

func (r *resourceRenderer) source(n luimygo.Node) (resourceSource, error) {
	if n.Identifier == "logseq-svg" {
		svg, err := resourceRetainedSVG(r.node, n)
		return resourceSource{"svg", svg}, err
	}
	if n.Identifier != "logseq-img" {
		return resourceSource{}, errors.New("node is not an image resource")
	}
	attrs := extensionAttrs(n)
	source := attrs["src"]
	if source == "" {
		if filename := attrs["data-asset-file"]; filename != "" {
			if filename != filepath.Base(filename) || strings.ContainsAny(filename, `/\`) || filename == "." || filename == ".." {
				return resourceSource{}, errors.New("invalid graph asset filename")
			}
			if r.ResolveAsset == nil {
				return resourceSource{}, errors.New("graph asset requires an OCaml-owned resolver")
			}
			var err error
			source, err = r.ResolveAsset(filename)
			if err != nil {
				return resourceSource{}, errors.New("graph asset resolution failed")
			}
		}
	}
	resolved, err := resourceSourceForURL(source)
	if err != nil && source != "" && r.ResolveSource != nil {
		// The callback owns resolution policy; its result still passes protocol
		// admission so it cannot hand a javascript/plugin URL to a file loader.
		source, err = r.ResolveSource(source)
		if err != nil {
			return resourceSource{}, errors.New("image source resolution failed")
		}
		return resourceSourceForURL(source)
	}
	return resolved, err
}

func (r *resourceRenderer) node(id int64) (luimygo.Node, bool) {
	n, exists := r.backend.Node(id)
	if exists && r.Project != nil {
		n = r.Project(n)
	}
	return n, exists
}

func (r *resourceRenderer) release(id int64) {
	owner, ok := r.owners[id]
	if !ok {
		return
	}
	delete(r.owners, id)
	owner.entry.refs--
	if owner.entry.refs == 0 {
		owner.entry.cancel()
		delete(r.cache, owner.source)
	}
}

// Sync runs after retained patches (including snapshots) and before each view.
// Removed or changed sources cancel their work and release the last cached image.
func (r *resourceRenderer) Sync() {
	for id, owner := range r.owners {
		n, ok := r.node(id)
		if !ok {
			r.release(id)
			continue
		}
		source, err := r.source(n)
		if err != nil || source != owner.source {
			r.release(id)
		}
	}
}

// BeginView precedes Backend.View on the real frame context. Final layout can
// render fitting/virtual children after View returns; probes borrow results only.
func (r *resourceRenderer) BeginView(c *ui.Context) {
	if r.closed {
		return
	}
	r.Sync()
	r.epoch++
	epoch := r.epoch
	r.view = c
	c.AfterFrame(func() {
		if r.epoch != epoch || r.view != c {
			return
		}
		for id, owner := range r.owners {
			if owner.seen != epoch {
				r.release(id)
			}
		}
		r.view = nil
	})
}

func (r *resourceRenderer) Close() {
	r.closed = true
	r.view = nil
	for id := range r.owners {
		r.release(id)
	}
}

func (r *resourceRenderer) acquire(id int64, source resourceSource, services ui.Services) *resourceEntry {
	if owner, ok := r.owners[id]; ok && owner.source == source {
		owner.seen = r.epoch
		r.owners[id] = owner
		return owner.entry
	}
	r.release(id)
	entry := r.cache[source]
	if entry == nil {
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		entry = &resourceEntry{cancel: cancel}
		r.cache[source] = entry
		go func() {
			defer cancel()
			result := resourceResult{done: true}
			select {
			case r.workers <- struct{}{}:
				defer func() { <-r.workers }()
				payload, contentType, err := resourceRead(ctx, source)
				if err == nil {
					err = ctx.Err()
				}
				if err == nil {
					result.image, result.width, result.height, err = resourceDecode(payload, contentType)
				}
				result.err = err
			case <-ctx.Done():
				result.err = ctx.Err()
			}
			if ctx.Err() != nil {
				result = resourceResult{done: true, err: ctx.Err()}
			}
			entry.mu.Lock()
			entry.result = result
			entry.mu.Unlock()
			// Services holds the window weakly and permits background invalidation.
			services.Invalidate()
		}()
	}
	entry.refs++
	r.owners[id] = resourceOwner{source: source, entry: entry, seen: r.epoch}
	return entry
}

// NaturalSize never substitutes layout geometry for decoded dimensions. The
// caller may retry after async completion invalidates the window.
func (r *resourceRenderer) NaturalSize(id int64) (width, height float32, ready bool) {
	owner, ok := r.owners[id]
	if !ok || r.closed {
		return 0, 0, false
	}
	n, exists := r.node(id)
	if !exists {
		return 0, 0, false
	}
	source, err := r.source(n)
	if err != nil || source != owner.source {
		return 0, 0, false
	}
	result := owner.entry.snapshot()
	return result.width, result.height, result.done && result.err == nil
}

func (r *resourceRenderer) Render(c *ui.Context, n luimygo.Node, tag string, _ func(), emit func(luimygo.Event)) bool {
	if tag != "img" && tag != "svg" {
		return false
	}
	committed := c == r.view
	var source resourceSource
	var result resourceResult
	if committed {
		var err error
		source, err = r.source(n)
		result = resourceResult{done: true, err: err}
		if r.closed {
			result.err = errors.New("image renderer is closed")
		} else if err == nil {
			result = r.acquire(n.ID, source, c.Services()).snapshot()
		} else {
			r.release(n.ID)
		}
	} else if owner, ok := r.owners[n.ID]; ok && !r.closed {
		source, result = owner.source, owner.entry.snapshot()
	}
	// Image preserves SVG colors and uses inherited text color for currentColor;
	// Icon would incorrectly flatten multicolor user SVGs to a monochrome mask.
	e := ui.Image(c, result.image)
	if committed {
		if err := r.backend.BindHostElement(n.ID, e); err != nil {
			panic(err)
		}
	}
	attrs := extensionAttrs(n)
	if r.Style != nil {
		r.Style(c, e, n, attrs, tag)
	}
	if label := attrs["alt"]; label != "" {
		e.Label(label)
	} else if label := n.String("accessibility-identifier"); label != "" {
		e.Label(label)
	}
	if !committed {
		return true
	}
	state := ui.Local(e, "resource-event", func() resourceEventState { return resourceEventState{} })
	errText := ""
	if result.err != nil {
		errText = result.err.Error()
		extensionUnavailable(c, n, errText)
		if alt := attrs["alt"]; alt != "" {
			ui.Text(c, alt).Wrap()
		}
	}
	if state.source != source || state.err != errText {
		state.source, state.err, state.sent = source, errText, false
	}
	if result.done && !state.sent {
		state.sent = true
		if result.err != nil {
			extensionDOMEvent(n, emit, "error", nil)
		} else {
			extensionDOMEvent(n, emit, "load", nil)
		}
	}
	return true
}
