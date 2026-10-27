//go:build darwin || linux

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/url"
	"sort"
	"strings"
	"unicode/utf8"

	"github.com/egoist/mygo"
	"github.com/egoist/mygo/transfer"
	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

// All methods belong to the UI goroutine. Desktop jobs marshal completion back
// onto that goroutine; document persistence and timers remain OCaml-owned.
type platformServices struct {
	backend   *luimygo.Backend
	state     *platformUIState
	snapshots map[string]platformThemeSnapshot
	gaps      map[string]bool
	controls  platformControls
	desktop   platformDesktopServices
	// Queries run on the UI thread after layout. A false natural-size result
	// means decoding is still pending, not a successful zero-sized image.
	NaturalSize func(id int64) (width, height float32, ready bool)
	EditorDOM   func(c *ui.Context, op string, body json.RawMessage) ([]platformReply, error)
	DOMMutation func(op string, body json.RawMessage) error
	Invalidate  func()
	resources   *resourceRenderer
	mutations   *domMutationRenderer
	viewport    viewportRenderer
}

type platformUIState struct {
	Language    string            `json:"lang"`
	RootClasses string            `json:"root-classes"`
	BodyClasses string            `json:"body-classes"`
	Data        map[string]string `json:"data"`
}

type platformThemeSnapshot struct {
	Mode string            `json:"mode"`
	Vars map[string]string `json:"vars"`
}

func newPlatformServices(backend *luimygo.Backend) *platformServices {
	return &platformServices{backend: backend, snapshots: make(map[string]platformThemeSnapshot), gaps: make(map[string]bool)}
}

// View applies the application's effective appearance locally. The host must
// call this instead of backend.View, AFTER sampling the system appearance.
// Overriding mygo.Theme globally would feed the app's preference back into its
// system-theme detector and lose the real desktop preference.
func (s *platformServices) View(c *ui.Context) {
	previous := c.Theme()
	defer c.SetTheme(previous)
	if err := s.ApplyTheme(c); err != nil {
		panic(err)
	}
	s.resources.BeginView(c)
	s.viewport.BeginView(s, c)
	s.backend.View(c)
}

// Measurements run after the frame commits, not while patches are being built.
func (s *platformServices) AfterFrame(c *ui.Context) ([]platformReply, error) {
	return s.afterDOMFrame(c)
}

func (s *platformServices) resolveRef(raw json.RawMessage) (int64, error) {
	if len(raw) == 0 || string(raw) == "null" {
		return 0, nil
	}
	var ref struct {
		NodeID int64           `json:"node-id"`
		Root   json.RawMessage `json:"#ref"`
		RefID  string          `json:"ref-id"`
	}
	if err := json.Unmarshal(raw, &ref); err != nil {
		return 0, err
	}
	if ref.NodeID != 0 {
		if _, ok := s.backend.Node(ref.NodeID); ok {
			return ref.NodeID, nil
		}
		return 0, nil // A stale element reference has no target.
	}
	identifier := ref.RefID
	if len(ref.Root) != 0 {
		var root int64
		if err := json.Unmarshal(ref.Root, &root); err == nil && root <= 0 {
			roots := s.backend.Roots()
			if len(roots) > 0 {
				return roots[0], nil
			}
			return 0, nil
		}
		if err := json.Unmarshal(ref.Root, &identifier); err != nil {
			return 0, fmt.Errorf("invalid element reference: %w", err)
		}
	}
	if identifier == "" {
		return 0, nil
	}
	var find func(int64) int64
	find = func(id int64) int64 {
		n, ok := s.backend.Node(id)
		if !ok {
			return 0
		}
		if n.String("accessibility-identifier") == identifier {
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
			return found, nil
		}
	}
	return 0, nil
}

// Handle preserves Host's raw clipboard/URL payloads. Only structured service
// requests are JSON; dom-op contains its own second name/newline envelope.
func (s *platformServices) Handle(request string) ([]platformReply, error) {
	name, payload, ok := strings.Cut(request, "\n")
	if !ok || name == "" || strings.ContainsAny(name, "\r\x00") {
		return nil, fmt.Errorf("invalid platform request name/envelope %q", name)
	}
	if !utf8.ValidString(request) {
		return nil, fmt.Errorf("%s: invalid UTF-8 request", name)
	}
	replies, err := s.handle(name, payload)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", name, err)
	}
	return replies, nil
}

func (s *platformServices) handle(name, payload string) ([]platformReply, error) {
	switch name {
	case "clipboard":
		// WriteText discards errors; the transfer API preserves native failures.
		return platformOperationReply(name, mygo.Clipboard.Write(transfer.TextData(payload)))
	case "clipboard-read":
		if payload != "" {
			return nil, fmt.Errorf("expected an empty payload")
		}
		data, err := mygo.Clipboard.Read(transfer.Text)
		if err != nil && !errors.Is(err, transfer.ErrFormat) {
			return nil, err
		}
		var text []byte
		if err == nil {
			text, err = data.Read(transfer.Text)
			if err != nil && !errors.Is(err, transfer.ErrFormat) {
				return nil, err
			}
		}
		// An absent text representation is an empty text clipboard, not an OS
		// failure. Ownership changes and provider errors are not masked.
		if !utf8.Valid(text) {
			return nil, fmt.Errorf("clipboard text is not UTF-8")
		}
		return platformJSONReply("clipboard-read", map[string]string{"text": string(text)})
	case "open-url":
		parsed, err := url.Parse(payload)
		if err != nil {
			return nil, err
		}
		if parsed.Scheme == "" || strings.ContainsAny(payload, "\x00\r\n") {
			return nil, fmt.Errorf("expected an absolute external URL")
		}
		return platformOperationReply(name, mygo.Shell.OpenExternal(payload))
	case "app-icons":
		var icons map[string]string
		if err := platformObject(payload, &icons); err != nil {
			return nil, err
		}
		names := make([]string, 0, len(icons))
		for name := range icons {
			names = append(names, name)
		}
		sort.Strings(names)
		for _, name := range names {
			// native_embed sends unprefixed slugs; LUI's registry requires app:.
			if err := s.backend.RegisterIcon("app:"+name, []byte(icons[name])); err != nil {
				return nil, fmt.Errorf("register icon %q: %w", name, err)
			}
		}
		return nil, nil
	case "ui-state":
		var state platformUIState
		if err := platformObject(payload, &state); err != nil {
			return nil, err
		}
		if state.Language == "" || state.Data == nil {
			return nil, fmt.Errorf("lang and data are required")
		}
		if mode, exists := state.Data["theme"]; exists && mode != "light" && mode != "dark" {
			return nil, fmt.Errorf("invalid effective theme %q", mode)
		}
		s.state = &state
		s.reportGap("ui-state", "document language/classes/data are retained; MyGo has no DOM stylesheet cascade; only effective light/dark appearance is applied by platformServices.View")
		return nil, nil
	case "theme-snapshot":
		var snapshot platformThemeSnapshot
		if err := platformObject(payload, &snapshot); err != nil {
			return nil, err
		}
		return nil, s.InstallThemeSnapshot(snapshot)
	case "dom-op":
		op, body, ok := strings.Cut(payload, "\n")
		if !ok || op == "" || strings.ContainsAny(op, "\r\x00") {
			return nil, fmt.Errorf("invalid nested operation name/envelope %q", op)
		}
		replies, err := s.domOp(op, body)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", op, err)
		}
		return replies, nil
	default:
		return nil, fmt.Errorf("required service is not implemented by the MyGo host")
	}
}

func (s *platformServices) domOp(op, body string) ([]platformReply, error) {
	var request map[string]json.RawMessage
	if err := platformObject(body, &request); err != nil {
		return nil, err
	}
	switch op {
	case "measure-node":
		return nil, s.queueDOM(op, body, request, "ref")
	case "focus", "set-scroll-top", "select", "set-selection-range", "set-value":
		id, err := s.resolveRef(request["ref"])
		if err != nil || id == 0 {
			return nil, err
		}
		if op == "focus" {
			if err := s.backend.RequestFocus(id); err != nil {
				return nil, err
			}
			s.invalidateDOM()
			return nil, nil
		}
		if op == "set-value" {
			if !s.isTextControl(id) {
				return nil, fmt.Errorf("node %d is not a native text control", id)
			}
			var value string
			if err := platformRequired(request, "value", &value); err != nil {
				return nil, err
			}
			if s.controls.values == nil {
				s.controls.values = make(map[int64]platformValueCommand)
			}
			s.controls.values[id] = platformValueCommand{target: s.controlTarget(id), value: value}
			s.invalidateDOM()
			return nil, nil
		}
		if op == "select" || op == "set-selection-range" {
			command := platformInputCommand{target: s.controlTarget(id), selectAll: op == "select"}
			if !command.selectAll {
				if err := platformRequired(request, "start", &command.start); err != nil {
					return nil, err
				}
				if err := platformRequired(request, "end", &command.end); err != nil {
					return nil, err
				}
				if command.start < 0 || command.end < 0 {
					return nil, fmt.Errorf("selection offsets must not be negative")
				}
			}
			if !s.isTextControl(id) {
				return nil, fmt.Errorf("node %d is not a native text control", id)
			}
			if s.controls.input == nil {
				s.controls.input = make(map[int64]platformInputCommand)
			}
			s.controls.input[id] = command
			s.invalidateDOM()
			if command.selectAll {
				return nil, s.backend.RequestFocus(id)
			}
			return nil, nil
		}
		var top float32
		if err := platformRequired(request, "top", &top); err != nil {
			return nil, err
		}
		return nil, s.queueDOM(op, body, request, "ref")
	case "set-input-focus":
		var block string
		var focused bool
		if err := platformRequired(request, "block-id", &block); err != nil {
			return nil, err
		}
		if block == "" {
			return nil, fmt.Errorf("block-id must not be empty")
		}
		if err := platformRequired(request, "focused", &focused); err != nil {
			return nil, err
		}
		if s.controls.editorFocus == nil {
			s.controls.editorFocus = make(map[string]platformFocusCommand)
		}
		// The model can request focus before its sink's mount patch arrives.
		// BindEditorControl consumes the latest intent, never a fake focus ack.
		s.controls.editorFocus[block] = platformFocusCommand{s.controlTarget(s.editorNode(block)), focused}
		s.invalidateDOM()
		return nil, nil
	case "open-file-picker", "download-text", "download-binary":
		return nil, s.desktopFileRequest(op, request)
	case "natural-size":
		return nil, s.queueDOM(op, body, request, "ref")
	case "scroll-into-view", "scroll-to-node":
		return nil, s.queueDOM(op, body, request, "ref")
	case "scroll-row-into-view":
		return nil, s.queueDOM(op, body, request, "row")
	case "caret-rect", "selection-rects", "offset-at", "line-ranges", "scroll-height":
		return nil, s.queueDOM(op, body, request, "")
	case "set-text-content", "set-attr", "remove-attr", "set-class", "class-add", "class-remove", "style-set-property", "set-checked", "remove", "click":
		return nil, s.queueDOM(op, body, request, "ref")
	default:
		return nil, fmt.Errorf("required DOM operation is not implemented by the MyGo host")
	}
}

func platformRequired(request map[string]json.RawMessage, name string, result any) error {
	raw, ok := request[name]
	if !ok || string(raw) == "null" {
		return fmt.Errorf("%s is required", name)
	}
	if err := json.Unmarshal(raw, result); err != nil {
		return fmt.Errorf("invalid %s: %w", name, err)
	}
	return nil
}

func platformObject(payload string, result any) error {
	trimmed := strings.TrimSpace(payload)
	if len(trimmed) == 0 || trimmed[0] != '{' {
		return fmt.Errorf("expected a JSON object")
	}
	if err := json.Unmarshal([]byte(payload), result); err != nil {
		return fmt.Errorf("decode JSON object: %w", err)
	}
	return nil
}

func platformOperationReply(operation string, err error) ([]platformReply, error) {
	if err == nil {
		return nil, nil
	}
	log.Printf("logseq: platform operation %s: %v", operation, err)
	return platformJSONReply("platform-error", map[string]string{"operation": operation, "message": err.Error()})
}

func platformJSONReply(name string, value any) ([]platformReply, error) {
	payload, err := json.Marshal(value)
	if err != nil {
		return nil, fmt.Errorf("encode %s reply: %w", name, err)
	}
	return []platformReply{{Name: name, Payload: string(payload)}}, nil
}

func (s *platformServices) reportGap(name, detail string) {
	if !s.gaps[name] {
		s.gaps[name] = true
		log.Printf("MyGo platform gap: %s: %s", name, detail)
	}
}
