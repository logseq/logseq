//go:build darwin || linux

package main

import (
	"encoding/json"
	"fmt"
	"math"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"unicode/utf8"
	"unsafe"

	"github.com/ebitengine/purego"
	luimygo "github.com/logseq/lui/platform/mygo"
)

// platformServices handles requests on the UI goroutine. Replies cross back to
// OCaml on its worker as Name + "\n" + Payload; Payload is already encoded JSON.
type platformReply struct {
	Name    string
	Payload string
}

type pointerFunction func(int64, float64, float64, int32, int32, string) int32

type nativeFunctions struct {
	start          func(uintptr, uintptr, uintptr, int32, int32, string, int32) int32
	stop           func() int32
	pump           func() int32
	resync         func() int32
	platformEvent  func(string, int32) int32
	editorSnapshot func(string, int32, uintptr) int32
	rootNode       func() int64
	register       func() int32
	pressEx        func(int64, int32) int32
	text           func(int64, string, int32) int32
	picked         func(int64, string, int32) int32
	toggle         func(int64, int32) int32
	value          func(int64, float64) int32
	extension      func(int64, string, int32, string, int32, string, int32) int32
	visibleRange   func(int64, int64, int64) int32
	scrollDone     func(int64, int64, string) int32
	scrollEdges    func(int64, int32, int32) int32
	navigationKey  func(int64, string, int32, int32) int32
	node           map[string]func(int64) int32
	pointer        map[string]pointerFunction

	// Resolve the bridge's legacy host entries too, but use the length-carrying
	// entries for text, picker and extension data, including embedded NULs.
	legacyText      func(int64, string) int32
	legacyPicked    func(int64, string) int32
	legacyExtension func(int64, string, string, string) int32
}

type runtimeMessage struct {
	patch    string
	request  string
	snapshot bool
}

type runtimeJob struct {
	call func() error
	done chan error
}

// ocamlRuntime never owns or mutates a Backend. All native calls, including
// startup and disposal, belong to one permanently locked OS worker thread.
// OCaml domains and callbacks outlive the session, so neither the library nor
// the worker thread is released at Close.
type ocamlRuntime struct {
	jobs       chan runtimeJob
	wakeup     chan struct{}
	functions  nativeFunctions
	library    uintptr
	callbacks  [4]uintptr
	editorJSON []byte

	mu            sync.Mutex
	messages      []runtimeMessage
	callbackError error
	snapshot      bool

	// Only accessed by worker jobs.
	started bool
	closed  bool
}

var runtimeProcess struct {
	sync.Mutex
	opened bool
}

func openOCamlRuntime(path string) (*ocamlRuntime, error) {
	absolute, err := filepath.Abs(path)
	if err != nil {
		return nil, err
	}
	runtimeProcess.Lock()
	defer runtimeProcess.Unlock()
	if runtimeProcess.opened {
		return nil, fmt.Errorf("logseq: only one OCaml runtime may be loaded per process")
	}
	r := &ocamlRuntime{jobs: make(chan runtimeJob), wakeup: make(chan struct{}, 1)}
	go func() {
		// caml_startup registers this thread; moving a later call to a different
		// OS thread would violate OCaml's acquire/release protocol.
		runtime.LockOSThread()
		for job := range r.jobs {
			job.done <- job.call()
		}
	}()
	if err := r.run(func() error { return r.load(absolute) }); err != nil {
		// No runtime has started, so it is safe to retire this unused worker.
		close(r.jobs)
		return nil, err
	}
	runtimeProcess.opened = true
	return r, nil
}

func (r *ocamlRuntime) run(call func() error) error {
	done := make(chan error, 1)
	r.jobs <- runtimeJob{call: call, done: done}
	return <-done
}

func (r *ocamlRuntime) load(path string) error {
	handle, err := purego.Dlopen(path, purego.RTLD_NOW|purego.RTLD_LOCAL)
	if err != nil {
		return fmt.Errorf("logseq: load OCaml library: %w", err)
	}
	f := nativeFunctions{
		node:    make(map[string]func(int64) int32),
		pointer: make(map[string]pointerFunction),
	}
	bindings := map[string]any{
		"start": &f.start, "stop": &f.stop, "pump": &f.pump,
		"resync": &f.resync, "platform_event": &f.platformEvent,
		"root_node": &f.rootNode, "register_current_thread": &f.register,
		"press_ex": &f.pressEx, "text_changed_utf8": &f.text,
		"picked_utf8": &f.picked, "toggle_changed": &f.toggle,
		"editor_snapshot_utf8": &f.editorSnapshot,
		"slider_changed":       &f.value, "extension_event_utf8": &f.extension,
		"visible_range": &f.visibleRange, "scroll_completed": &f.scrollDone,
		"scroll_edges": &f.scrollEdges, "navigation_key_utf8": &f.navigationKey,
		"text_changed": &f.legacyText, "picked": &f.legacyPicked,
		"extension_event": &f.legacyExtension,
	}
	nodeNames := map[string]string{
		"appear": "appear", "press": "press", "long-press": "long_press",
		"submit": "submit", "dismiss": "dismiss", "double-press": "double_press",
		"pointer-enter": "pointer_enter", "pointer-leave": "pointer_leave",
		"change": "radio_changed", "load": "load",
		"navigate-previous": "navigate_previous", "navigate-next": "navigate_next",
	}
	for _, suffix := range nodeNames {
		var fn func(int64) int32
		bindings[suffix] = &fn
	}
	pointerNames := map[string]string{
		"press-detail": "press_detail", "pointer-down": "pointer_down",
		"pointer-up": "pointer_up", "context-menu-press": "context_menu_press",
	}
	for _, suffix := range pointerNames {
		var fn pointerFunction
		bindings[suffix] = &fn
	}
	// Preflight every required symbol before calling into the library. An old
	// or incomplete bridge is an error, not a partially functioning backend.
	symbols := make(map[string]uintptr, len(bindings))
	for suffix := range bindings {
		ptr, lookupErr := purego.Dlsym(handle, "lui_ocaml_"+suffix)
		if lookupErr != nil {
			closeErr := purego.Dlclose(handle)
			if closeErr != nil {
				return fmt.Errorf("logseq: missing lui_ocaml_%s: %w (unload: %v)", suffix, lookupErr, closeErr)
			}
			return fmt.Errorf("logseq: missing lui_ocaml_%s: %w", suffix, lookupErr)
		}
		symbols[suffix] = ptr
	}
	for suffix, binding := range bindings {
		purego.RegisterFunc(binding, symbols[suffix])
	}
	for event, suffix := range nodeNames {
		f.node[event] = *bindings[suffix].(*func(int64) int32)
	}
	for event, suffix := range pointerNames {
		f.pointer[event] = *bindings[suffix].(*pointerFunction)
	}
	r.callbacks[0] = purego.NewCallback(func(ptr unsafe.Pointer) {
		if ptr == nil {
			r.failCallback("patch callback received a null pointer")
			return
		}
		// The bridge borrows an OCaml string only until this callback returns.
		length := 0
		for *(*byte)(unsafe.Add(ptr, length)) != 0 {
			length++
		}
		patch := string(unsafe.Slice((*byte)(ptr), length))
		r.mu.Lock()
		r.messages = append(r.messages, runtimeMessage{patch: patch, snapshot: r.snapshot})
		r.mu.Unlock()
		r.signal()
	})
	r.callbacks[1] = purego.NewCallback(func() { r.signal() })
	r.callbacks[3] = purego.NewCallback(func(ptr unsafe.Pointer, length int32) {
		if length < 0 || ptr == nil {
			r.failCallback("editor snapshot received an invalid buffer")
			return
		}
		r.editorJSON = append(r.editorJSON[:0], unsafe.Slice((*byte)(ptr), int(length))...)
	})
	r.callbacks[2] = purego.NewCallback(func(ptr unsafe.Pointer, length int32) {
		if length < 0 || ptr == nil {
			r.failCallback("platform callback received an invalid buffer")
			return
		}
		request := string(unsafe.Slice((*byte)(ptr), int(length)))
		r.mu.Lock()
		r.messages = append(r.messages, runtimeMessage{request: request})
		r.mu.Unlock()
		r.signal()
	})
	r.library, r.functions = handle, f
	return nil
}

func (r *ocamlRuntime) signal() {
	// Wakeup may originate on an OCaml transport/timer thread. Never reenter
	// OCaml or the UI here, and never block an OCaml callback on the UI loop.
	select {
	case r.wakeup <- struct{}{}:
	default:
	}
}

func (r *ocamlRuntime) failCallback(message string) {
	r.mu.Lock()
	if r.callbackError == nil {
		r.callbackError = fmt.Errorf("logseq: %s", message)
	}
	r.mu.Unlock()
	r.signal()
}

func (r *ocamlRuntime) takeMessages() ([]runtimeMessage, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	messages := r.messages
	r.messages = nil
	return messages, r.callbackError
}

type editorSnapshot struct {
	Source string `json:"source"`
	Anchor int    `json:"anchor"`
	Caret  int    `json:"caret"`
}

func (r *ocamlRuntime) EditorSnapshot(blockID string) (*editorSnapshot, error) {
	var snapshot *editorSnapshot
	err := r.run(func() error {
		if !r.started || r.closed {
			return fmt.Errorf("logseq: editor query outside an active session")
		}
		r.editorJSON = nil
		if r.functions.editorSnapshot(blockID, int32(len(blockID)), r.callbacks[3]) != 1 {
			return fmt.Errorf("logseq: editor snapshot failed")
		}
		if err := json.Unmarshal(r.editorJSON, &snapshot); err != nil {
			return fmt.Errorf("logseq: invalid editor snapshot: %w", err)
		}
		return nil
	})
	return snapshot, err
}

func (r *ocamlRuntime) Start() error {
	return r.run(func() error {
		if r.started || r.closed {
			return fmt.Errorf("logseq: OCaml session cannot be started twice")
		}
		platform := int32(4)
		if runtime.GOOS == "darwin" {
			platform = 1
		}
		// native_embed.initialize currently ignores its payload. Assets and
		// persistence/configuration are read from the native environment, not
		// from an invented startup JSON schema. GenericHost is host code zero.
		const payload = "{}"
		r.started = true
		if r.functions.start(r.callbacks[0], r.callbacks[1], r.callbacks[2], platform, 0, payload, int32(len(payload))) != 1 {
			return fmt.Errorf("logseq: OCaml initialization failed (see bridge diagnostics)")
		}
		if r.functions.rootNode() <= 0 {
			return fmt.Errorf("logseq: initialized OCaml application has no root node")
		}
		return nil
	})
}

func (r *ocamlRuntime) invoke(name string, call func(nativeFunctions) int32) error {
	return r.run(func() error {
		if !r.started || r.closed {
			return fmt.Errorf("logseq: OCaml session is not active")
		}
		if call(r.functions) != 1 {
			return fmt.Errorf("logseq: OCaml rejected %s (see bridge diagnostics)", name)
		}
		return nil
	})
}

func (r *ocamlRuntime) Pump() error {
	return r.invoke("pump", func(f nativeFunctions) int32 { return f.pump() })
}

func (r *ocamlRuntime) PlatformEvent(reply platformReply) error {
	if reply.Name == "" || strings.ContainsAny(reply.Name, "\n\x00") || !json.Valid([]byte(reply.Payload)) {
		return fmt.Errorf("logseq: invalid platform reply %q", reply.Name)
	}
	payload := reply.Name + "\n" + reply.Payload
	if err := validateABIText(payload); err != nil {
		return err
	}
	if err := r.invoke("platform event "+reply.Name, func(f nativeFunctions) int32 {
		return f.platformEvent(payload, int32(len(payload)))
	}); err != nil {
		return err
	}
	// Some events (appearance/measurement replies) update native state without
	// enqueuing Host work themselves. Still give the app a chance to flush.
	r.signal()
	return nil
}

// Resync is the only entry that produces an authoritative snapshot. Startup,
// interactions, pump and stop all produce ordered incremental batch arrays.
func (r *ocamlRuntime) Resync() error {
	return r.invoke("resync", func(f nativeFunctions) int32 {
		r.mu.Lock()
		r.snapshot = true
		r.mu.Unlock()
		defer func() {
			r.mu.Lock()
			r.snapshot = false
			r.mu.Unlock()
		}()
		return f.resync()
	})
}

func validateABIText(text string) error {
	if len(text) > math.MaxInt32 || !utf8.ValidString(text) {
		return fmt.Errorf("logseq: invalid UTF-8 or signed 32-bit ABI string length")
	}
	return nil
}

func (r *ocamlRuntime) Dispatch(event luimygo.Event) error {
	const maxOCamlInt = int64(math.MaxInt64 >> 1)
	if event.Node <= 0 || event.Node > maxOCamlInt {
		return fmt.Errorf("logseq: event node is outside OCaml's integer range")
	}
	for _, text := range []string{event.Text, event.Payload, event.Identifier, event.Name, event.TargetClass, event.Outcome, event.Key} {
		if err := validateABIText(text); err != nil {
			return err
		}
	}
	var call func(nativeFunctions) int32
	switch event.Kind {
	case "press-detail", "pointer-down", "pointer-up", "context-menu-press":
		if strings.ContainsRune(event.TargetClass, 0) {
			return fmt.Errorf("logseq: target class contains NUL, unsupported by the Logseq pointer ABI")
		}
		if math.IsNaN(event.X) || math.IsNaN(event.Y) || math.IsInf(event.X, 0) || math.IsInf(event.Y, 0) || event.Modifiers < 0 || event.Modifiers&^15 != 0 || event.Button < 0 || event.Button > 2 {
			return fmt.Errorf("logseq: invalid pointer detail")
		}
		call = func(f nativeFunctions) int32 {
			return f.pointer[event.Kind](event.Node, event.X, event.Y, event.Modifiers, event.Button, event.TargetClass)
		}
	case "press-modifiers":
		if event.Modifiers < 0 || event.Modifiers&^15 != 0 {
			return fmt.Errorf("logseq: invalid press modifiers")
		}
		call = func(f nativeFunctions) int32 { return f.pressEx(event.Node, event.Modifiers) }
	case "text-changed":
		call = func(f nativeFunctions) int32 { return f.text(event.Node, event.Text, int32(len(event.Text))) }
	case "picked":
		call = func(f nativeFunctions) int32 { return f.picked(event.Node, event.Payload, int32(len(event.Payload))) }
	case "toggle-changed":
		call = func(f nativeFunctions) int32 { return f.toggle(event.Node, nativeBool(event.Checked)) }
	case "value-changed":
		if math.IsNaN(event.Value) || math.IsInf(event.Value, 0) {
			return fmt.Errorf("logseq: nonfinite control value")
		}
		call = func(f nativeFunctions) int32 { return f.value(event.Node, event.Value) }
	case "visible-range":
		if event.First < 0 || event.First > maxOCamlInt || event.Last < -1 || event.Last > maxOCamlInt || (event.Last < event.First && !(event.First == 0 && event.Last == -1)) {
			return fmt.Errorf("logseq: invalid inclusive visible range")
		}
		call = func(f nativeFunctions) int32 { return f.visibleRange(event.Node, event.First, event.Last) }
	case "scroll-completed":
		if event.Token < 0 || event.Token > maxOCamlInt || (event.Outcome != "succeeded" && event.Outcome != "cancelled" && event.Outcome != "missing-target") {
			return fmt.Errorf("logseq: invalid scroll completion")
		}
		call = func(f nativeFunctions) int32 { return f.scrollDone(event.Node, event.Token, event.Outcome) }
	case "scroll-edges":
		call = func(f nativeFunctions) int32 {
			return f.scrollEdges(event.Node, nativeBool(event.AtStart), nativeBool(event.AtEnd))
		}
	case "navigation-key":
		switch event.Key {
		case "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown":
		default:
			return fmt.Errorf("logseq: unsupported navigation key %q", event.Key)
		}
		call = func(f nativeFunctions) int32 {
			return f.navigationKey(event.Node, event.Key, int32(len(event.Key)), nativeBool(event.Shift))
		}
	case "extension-event":
		if event.Identifier == "" || event.Name == "" {
			return fmt.Errorf("logseq: extension event requires an identifier and name")
		}
		for name, value := range event.Values {
			switch value.(type) {
			case string, bool, int, int32, int64, float32, float64, json.Number:
			default:
				return fmt.Errorf("logseq: extension value %q is not a wire scalar", name)
			}
		}
		values := "{}"
		if event.Values != nil {
			data, err := json.Marshal(event.Values)
			if err != nil {
				return fmt.Errorf("logseq: encode extension event: %w", err)
			}
			values = string(data)
		}
		if err := validateABIText(values); err != nil {
			return err
		}
		call = func(f nativeFunctions) int32 {
			return f.extension(event.Node, event.Identifier, int32(len(event.Identifier)), event.Name, int32(len(event.Name)), values, int32(len(values)))
		}
	default:
		if fn := r.functions.node[event.Kind]; fn != nil {
			call = func(nativeFunctions) int32 { return fn(event.Node) }
		} else {
			return fmt.Errorf("logseq: unsupported runtime event %q", event.Kind)
		}
	}
	return r.invoke(event.Kind, call)
}

func nativeBool(value bool) int32 {
	if value {
		return 1
	}
	return 0
}

func (r *ocamlRuntime) Close() error {
	return r.run(func() error {
		if r.closed {
			return nil
		}
		r.closed = true
		if r.started && r.functions.stop() != 1 {
			return fmt.Errorf("logseq: OCaml disposal failed (see bridge diagnostics)")
		}
		return nil
	})
}
