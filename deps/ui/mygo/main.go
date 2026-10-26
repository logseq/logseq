//go:build darwin || linux

// logseq-mygo hosts the Logseq OCaml application in a native MyGo window.
package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/egoist/mygo"
	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() (result error) {
	library := flag.String("library", "", "path to the Logseq native_embed shared library")
	width := flag.Int("width", 1440, "content width in DIPs")
	height := flag.Int("height", 900, "content height in DIPs")
	title := flag.String("title", "Logseq", "window title")
	flag.Parse()
	if *library == "" {
		return fmt.Errorf("-library is required")
	}
	if *width <= 0 || *height <= 0 {
		return fmt.Errorf("width and height must be positive")
	}
	if flag.NArg() != 0 {
		return fmt.Errorf("unexpected positional arguments: %v", flag.Args())
	}
	if err := prepareNativeEnvironment(); err != nil {
		return err
	}
	r, err := openOCamlRuntime(*library)
	if err != nil {
		return err
	}
	host := &windowHost{runtime: r, done: make(chan struct{})}
	logseqEditorServices.Snapshot = func(blockID string) (string, int, int, bool) {
		snapshot, err := r.EditorSnapshot(blockID)
		if err != nil {
			host.fail(err)
			return "", 0, 0, false
		}
		if snapshot == nil {
			return "", 0, 0, false
		}
		return snapshot.Source, snapshot.Anchor, snapshot.Caret, true
	}
	// App.Run returns on its main/UI thread, including initialization failures.
	defer func() { result = errors.Join(result, host.close(), host.err) }()
	mygo.App.SetName("Logseq")
	mygo.App.WhenReady(func() {
		if err := installApplicationFonts(os.Getenv("LOGSEQ_NATIVE_ASSET_DIR")); err != nil {
			host.fail(err)
			return
		}
		host.services = newPlatformServices(nil)
		host.backend = luimygo.New(luimygo.Config{
			Extensions: host.services.extensions(),
			Dispatch:   host.dispatch,
		})
		if err := installApplicationIcons(host.backend, os.Getenv("LOGSEQ_NATIVE_ASSET_DIR")); err != nil {
			host.fail(err)
			return
		}
		host.services.backend = host.backend
		host.services.mutations = newDOMMutationRenderer(host.services)
		host.services.DOMMutation = host.services.mutations.HandleDOMMutation
		host.services.resources = newResourceRenderer(host.backend)
		host.services.resources.Project = host.services.mutations.BindDOMMutations
		host.services.resources.Style = host.services.elementStyle
		host.services.NaturalSize = func(id int64) (float32, float32, bool) {
			if width, height, ready := host.services.resources.NaturalSize(id); ready {
				return width, height, true
			}
			return host.backend.NaturalImageSize(id)
		}
		host.services.EditorDOM = func(c *ui.Context, op string, body json.RawMessage) ([]platformReply, error) {
			if _, err := host.services.EditorRequest(op, string(body)); err != nil {
				return nil, err
			}
			return host.services.EditorAfterFrame(c)
		}
		host.document = NewDocumentEvents(host.backend, func(name, payload string) bool {
			if host.closing {
				return true
			}
			prevented, err := r.DocumentEvent(name, payload)
			if err != nil {
				host.fail(err)
				return true
			}
			return prevented
		})
		host.document.Pointer = host.services.EditorPointer
		host.document.Observe = host.services.ViewportInput
		host.services.mutations.Activate = func(n luimygo.Node) error {
			if n.Identifier == "logseq-input" || n.Identifier == "logseq-textarea" {
				return fmt.Errorf("native input activation requires the control's default action")
			}
			payload, err := json.Marshal(map[string]any{"nodeId": n.ID, "button": 0, "detail": 1})
			if err != nil {
				return err
			}
			_, err = r.DocumentEvent("click", string(payload))
			return err
		}
		if err := r.Start(); err != nil {
			host.fail(err)
			return
		}
		if err := host.drain(); err != nil {
			host.fail(err)
			return
		}
		host.window = mygo.NewWindow(mygo.WindowOptions{
			Title: *title, Width: *width, Height: *height,
			UseContentSize: true, Content: ui.View(host.view),
		})
		host.window.OnClose(func(e *mygo.CloseEvent) {
			if host.closeReady || host.err != nil {
				return
			}
			e.PreventDefault()
			host.requestClose(false)
		})
		host.window.OnClosed(func() {
			if err := host.close(); err != nil {
				host.err = errors.Join(host.err, err)
			}
		})
		host.services.Invalidate = host.window.Invalidate
		host.window.OnBlur(func() {
			host.services.CancelViewportPress()
			host.services.CancelEditorPointer()
		})
		if err := host.services.StartDesktopServices(host.window, func(replies []platformReply, err error) {
			for _, reply := range replies {
				if dispatchErr := r.PlatformEvent(reply); dispatchErr != nil {
					host.fail(dispatchErr)
					return
				}
			}
			if err != nil {
				log.Printf("logseq: desktop service: %v", err)
			}
			host.fail(host.drain())
			host.window.Invalidate()
		}); err != nil {
			host.fail(err)
			return
		}
		go host.watchWakeups()
	})
	mygo.App.OnWindowAllClosed(func() { mygo.App.Quit() })
	mygo.App.OnBeforeQuit(func(e *mygo.QuitEvent) {
		if host.window != nil && !host.closed && !host.closeReady && host.err == nil {
			e.PreventDefault()
			host.requestClose(true)
		}
	})
	mygo.App.OnWillQuit(func(*mygo.QuitEvent) {
		if err := host.close(); err != nil {
			host.err = errors.Join(host.err, err)
		}
	})
	return mygo.App.Run()
}

type windowHost struct {
	runtime    *ocamlRuntime
	backend    *luimygo.Backend
	services   *platformServices
	document   *DocumentEvents
	window     *mygo.Window
	done       chan struct{}
	closed     bool
	closing    bool
	closeReady bool
	quitting   bool
	err        error

	sizeKnown       bool
	width, height   float32
	appearanceKnown bool
	dark            bool
}

func (h *windowHost) fail(err error) {
	if err == nil || h.err != nil {
		return
	}
	h.err = err
	mygo.App.Quit()
}

func (h *windowHost) dispatch(event luimygo.Event) error {
	if h.closed {
		return fmt.Errorf("logseq: event arrived after window closure")
	}
	if h.closing {
		return nil
	}
	if err := h.runtime.Dispatch(event); err != nil {
		return err
	}
	// MyGo's controlled inputs require normalized model props to be applied
	// synchronously before Dispatch returns. Only this UI goroutine applies.
	return h.drain()
}

func (h *windowHost) drain() error {
	for {
		messages, err := h.runtime.takeMessages()
		if err != nil {
			return err
		}
		if len(messages) == 0 {
			return nil
		}
		for _, message := range messages {
			switch {
			case message.patch != "":
				if err := h.applyPatches(message.patch, message.snapshot); err != nil {
					return err
				}
			case message.request != "":
				if body, ok := strings.CutPrefix(message.request, "window-close-result\n"); ok {
					if err := h.completeClose(body); err != nil {
						return err
					}
					continue
				}
				replies, err := h.services.Handle(message.request)
				if err != nil {
					return fmt.Errorf("logseq: platform request: %w", err)
				}
				for _, reply := range replies {
					if err := h.runtime.PlatformEvent(reply); err != nil {
						return err
					}
				}
			default:
				return fmt.Errorf("logseq: empty native callback message")
			}
		}
	}
}

func (h *windowHost) requestClose(quit bool) {
	h.quitting = h.quitting || quit
	if h.closing {
		return
	}
	h.closing = true
	if err := h.runtime.PlatformEvent(platformReply{Name: "window-close-request", Payload: "{}"}); err != nil {
		h.closing = false
		h.fail(err)
	}
	h.window.Invalidate()
}

func (h *windowHost) completeClose(body string) error {
	var result struct {
		OK    bool   `json:"ok"`
		Error string `json:"error"`
	}
	if err := json.Unmarshal([]byte(body), &result); err != nil {
		return fmt.Errorf("logseq: close acknowledgement: %w", err)
	}
	if !h.closing {
		return fmt.Errorf("logseq: unsolicited close acknowledgement")
	}
	if !result.OK {
		h.closing, h.quitting = false, false
		log.Printf("logseq: keeping window open after save failure: %s", result.Error)
		h.window.Invalidate()
		return nil
	}
	h.closeReady = true
	go mygo.RunOnMain(func() {
		if h.closed {
			return
		}
		if h.quitting {
			mygo.App.Quit()
		} else {
			h.window.Close()
		}
	})
	return nil
}

func (h *windowHost) applyPatches(payload string, snapshot bool) error {
	// Logseq Ffi.encode_batches emits an ARRAY, unlike upstream's one-batch
	// callbacks. Do not discard intermediate generations or guess snapshots
	// from generation numbers: only an explicit resync is authoritative.
	data := bytes.TrimSpace([]byte(payload))
	if len(data) == 0 || data[0] != '[' {
		return fmt.Errorf("logseq: native patch callback must contain a batch array")
	}
	var batches []json.RawMessage
	if err := json.Unmarshal(data, &batches); err != nil {
		return fmt.Errorf("logseq: decode native batch array: %w", err)
	}
	if len(batches) == 0 || (snapshot && len(batches) != 1) {
		return fmt.Errorf("logseq: invalid batch count %d (snapshot=%t)", len(batches), snapshot)
	}
	for _, batch := range batches {
		if err := h.backend.ApplyJSON(batch, snapshot); err != nil {
			return fmt.Errorf("logseq: apply native batch: %w", err)
		}
		var applied luimygo.Batch
		if err := json.Unmarshal(batch, &applied); err != nil {
			return err
		}
		h.services.AppliedBatch(applied, snapshot)
		h.services.mutations.Sync()
		h.services.resources.Sync()
	}
	return nil
}

func (h *windowHost) pump() error {
	if err := h.runtime.Pump(); err != nil {
		return err
	}
	if err := h.drain(); err != nil {
		return err
	}
	return h.backend.Err()
}

func (h *windowHost) watchWakeups() {
	for {
		select {
		case <-h.done:
			return
		case <-h.runtime.wakeup:
			select {
			case <-h.done:
				return
			default:
			}
			// RunOnMain also pumps when the window is occluded/minimized; tying
			// Host.drain solely to rendered frames would stall async app boot.
			mygo.RunOnMain(func() {
				if h.closed || h.err != nil {
					return
				}
				if err := h.pump(); err != nil {
					h.fail(err)
					return
				}
				h.window.Invalidate()
			})
		}
	}
}

func (h *windowHost) view(c *ui.Context) {
	if h.closed || h.err != nil {
		return
	}
	width, height := c.Size()
	if !h.sizeKnown || width != h.width || height != h.height {
		h.sizeKnown, h.width, h.height = true, width, height
		payload, err := json.Marshal(struct {
			Width  float32 `json:"width"`
			Height float32 `json:"height"`
		}{width, height})
		if err != nil {
			h.fail(err)
			return
		}
		if err := h.runtime.PlatformEvent(platformReply{Name: "window-size", Payload: string(payload)}); err != nil {
			h.fail(err)
			return
		}
	}
	dark := c.Theme().Dark
	if !h.appearanceKnown || dark != h.dark {
		h.appearanceKnown, h.dark = true, dark
		payload := `{"dark":false}`
		if dark {
			payload = `{"dark":true}`
		}
		if err := h.runtime.PlatformEvent(platformReply{Name: "appearance", Payload: payload}); err != nil {
			h.fail(err)
			return
		}
	}
	h.services.View(c)
	h.document.Capture(c)
	// Backend.View enqueues its lifecycle dispatch before this callback, so
	// failures raised after layout are observed during the same frame.
	c.AfterFrame(func() {
		if err := h.backend.Err(); err != nil {
			h.fail(err)
			return
		}
		replies, err := h.services.AfterFrame(c)
		if err != nil {
			h.fail(err)
			return
		}
		editorReplies, err := h.services.EditorAfterFrame(c)
		if err != nil {
			h.fail(err)
			return
		}
		replies = append(replies, editorReplies...)
		for _, reply := range replies {
			if err := h.runtime.PlatformEvent(reply); err != nil {
				h.fail(err)
				return
			}
		}
		h.fail(h.drain())
		if len(replies) > 0 && h.window != nil {
			h.window.Invalidate()
		}
	})
}

func (h *windowHost) close() error {
	if h.closed {
		return nil
	}
	h.closed = true
	close(h.done)
	if h.services != nil {
		h.services.CloseDesktopServices()
		h.services.CloseEditor()
		if h.services.resources != nil {
			h.services.resources.Close()
		}
	}
	err := h.runtime.Close()
	// Disposal patches are deliberately not rendered after the window closes.
	// Runtime disposal may still enqueue patches; do not render them after close.
	_, callbackErr := h.runtime.takeMessages()
	if h.backend != nil {
		h.backend.Close()
	}
	return errors.Join(err, callbackErr)
}

func installApplicationFonts(assetDir string) error {
	for _, face := range []string{
		"Regular", "Italic", "Light", "Medium", "MediumItalic",
		"SemiBold", "SemiBoldItalic", "Bold", "BoldItalic",
	} {
		filename := filepath.Join(assetDir, "fonts", "Inter-"+face+".ttf")
		data, err := os.ReadFile(filename)
		if err != nil {
			return fmt.Errorf("read application font %s: %w", filename, err)
		}
		if err := ui.RegisterFont(data, "Inter"); err != nil {
			return fmt.Errorf("register application font %s: %w", filename, err)
		}
	}
	return nil
}

func prepareNativeEnvironment() error {
	// These names/defaults come from native/services/platform_native.ml and
	// native/daemon_client.ml. caml_startup's synthetic argv[0] cannot locate
	// resources relative to the real Go executable, so resolve assets here.
	assets, set := os.LookupEnv("LOGSEQ_NATIVE_ASSET_DIR")
	if !set {
		executable, err := os.Executable()
		if err != nil {
			return err
		}
		assets = filepath.Join(filepath.Dir(executable), "..", "Resources")
	}
	if assets == "" {
		return fmt.Errorf("LOGSEQ_NATIVE_ASSET_DIR must not be empty")
	}
	assets, err := filepath.Abs(assets)
	if err != nil {
		return err
	}
	info, err := os.Stat(assets)
	if err != nil {
		return fmt.Errorf("logseq: native assets (set LOGSEQ_NATIVE_ASSET_DIR): %w", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("logseq: native asset path is not a directory: %s", assets)
	}
	if err := os.Setenv("LOGSEQ_NATIVE_ASSET_DIR", assets); err != nil {
		return err
	}
	home := os.Getenv("HOME")
	if home == "" {
		return fmt.Errorf("HOME must be set for native persistence and daemon configuration")
	}
	stateDefault := filepath.Join(home, "Library", "Application Support", "logseq")
	if runtime.GOOS == "linux" {
		stateHome := os.Getenv("XDG_STATE_HOME")
		if stateHome == "" || !filepath.IsAbs(stateHome) {
			// The XDG specification ignores empty/relative state directories.
			stateHome = filepath.Join(home, ".local", "state")
		}
		stateDefault = filepath.Join(stateHome, "logseq")
	}
	for name, defaultPath := range map[string]string{
		"LOGSEQ_UI_STATE_DIR": stateDefault,
		"LOGSEQ_ROOT_DIR":     filepath.Join(home, "logseq"),
	} {
		value, set := os.LookupEnv(name)
		if !set {
			value = defaultPath
		}
		if value == "" {
			return fmt.Errorf("%s must not be empty", name)
		}
		absolute, err := filepath.Abs(value)
		if err != nil {
			return err
		}
		if err := os.Setenv(name, absolute); err != nil {
			return err
		}
	}
	if value, set := os.LookupEnv("LOGSEQ_DB_WORKER_BIN"); set {
		if value == "" {
			return fmt.Errorf("LOGSEQ_DB_WORKER_BIN must not be empty")
		}
		absolute, err := filepath.Abs(value)
		if err != nil {
			return err
		}
		if err := os.Setenv("LOGSEQ_DB_WORKER_BIN", absolute); err != nil {
			return err
		}
	}
	return nil
}
