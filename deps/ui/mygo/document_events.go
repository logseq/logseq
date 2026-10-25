package main

import (
	"encoding/json"
	"fmt"
	"runtime"

	"github.com/egoist/mygo/transfer"
	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

// DocumentDispatch must synchronously call OCaml Platform.emit_event and return
// its default-prevented result, not its propagation-stopped state. Payload has
// nodeId but never a fabricated target: OCaml enriches the retained DOM snapshot.
type DocumentDispatch func(name, payload string) bool

// DocumentEvents owns only input routing state. The OCaml document remains the
// authority for shortcuts, selection, navigation and command execution.
type DocumentEvents struct {
	backend         *luimygo.Backend
	dispatch        DocumentDispatch
	services        ui.Services
	pressed         luimygo.InputNode
	composing       bool
	compositionNode int64
}

func NewDocumentEvents(backend *luimygo.Backend, dispatch DocumentDispatch) *DocumentEvents {
	if backend == nil || dispatch == nil {
		panic("document input requires a backend and synchronous OCaml dispatch")
	}
	return &DocumentEvents{backend: backend, dispatch: dispatch}
}

// Capture installs the window callback AFTER backend.View on every frame.
// Keep DocumentEvents for the window's lifetime. This overrides the carrier's
// observational dispatch with the host's synchronous default-prevention ABI.
func (d *DocumentEvents) Capture(c *ui.Context) {
	d.services = c.Services()
	c.CaptureInput(d.input)
}

func (s *platformServices) renderDocumentEvents(c *ui.Context, n luimygo.Node, _ func(), emit func(luimygo.Event)) {
	e := ui.Box(c).Size(0, 0)
	d := ui.Local(e, "document-events", func() DocumentEvents { return DocumentEvents{} })
	d.backend = s.backend
	d.dispatch = func(name, payload string) bool {
		extensionEmit(n, emit, "dom-event", map[string]any{"name": name, "payload": payload})
		return false // Carrier dispatch has no default-prevention return channel.
	}
	d.Capture(c)
}

func (d *DocumentEvents) send(target luimygo.InputNode, name string, payload map[string]any) bool {
	if target.Node.ID != 0 && !target.Current() {
		return false
	}
	if payload == nil {
		payload = map[string]any{}
	}
	if target.Node.ID != 0 {
		payload["nodeId"] = target.Node.ID
	}
	encoded, err := json.Marshal(payload)
	if err != nil {
		panic(fmt.Errorf("document %s: %w", name, err))
	}
	return d.dispatch(name, string(encoded))
}

func (d *DocumentEvents) input(ev ui.InputEvent, host ui.InputTarget) bool {
	target, _ := d.backend.InputNode(host)
	if d.compositionNode != target.Node.ID {
		d.composing = false
		d.compositionNode = target.Node.ID
	}
	switch ev.Kind {
	case ui.InputKeyDown, ui.InputKeyUp:
		key := extensionKey(ev.Key)
		if key == "" {
			return false
		}
		name := "keydown"
		if ev.Kind == ui.InputKeyUp {
			name = "keyup"
		}
		payload := extensionDOMKey(ev, key)
		payload["isComposing"] = d.composing
		return d.send(target, name, payload)
	case ui.InputPointerDown, ui.InputPointerUp, ui.InputPointerMove, ui.InputClick:
		payload := documentPointer(ev)
		switch ev.Kind {
		case ui.InputPointerDown:
			d.pressed = target
			taken := d.send(target, "mousedown", payload)
			if ev.Button == 1 {
				taken = d.send(target, "contextmenu", payload) || taken
			}
			return taken
		case ui.InputPointerUp:
			return d.send(target, "mouseup", payload)
		case ui.InputPointerMove:
			return d.send(target, "mousemove", payload)
		case ui.InputClick:
			// Never deliver a press to a replacement of the same retained ID.
			if d.pressed.Node.ID != 0 && !d.pressed.Current() {
				return false
			}
			taken := d.send(target, "click", payload)
			if ev.Clicks == 2 {
				taken = d.send(target, "dblclick", payload) || taken
			}
			return taken
		}
	case ui.InputScroll:
		payload := documentPointer(ev)
		payload["deltaX"], payload["deltaY"], payload["deltaMode"] = ev.DX, ev.DY, 0
		return d.send(target, "wheel", payload)
	case ui.InputCommand:
		return d.command(target, ev)
	case ui.InputCompose:
		name := "compositionupdate"
		if !d.composing && ev.Text != "" {
			name = "compositionstart"
		} else if ev.Text == "" {
			name = "compositionend"
		}
		d.composing = ev.Text != ""
		d.send(target, name, map[string]any{"data": ev.Text, "isComposing": d.composing})
	case ui.InputText:
		wasComposing := d.composing
		d.composing = false
		return d.send(target, "beforeinput", map[string]any{"data": ev.Text,
			"inputType": "insertText", "isComposing": wasComposing})
	}
	return false
}

func documentPointer(ev ui.InputEvent) map[string]any {
	button := ev.Button
	if button == 1 {
		button = 2
	} else if button == 2 {
		button = 1
	}
	return map[string]any{"clientX": ev.X, "clientY": ev.Y, "button": button, "detail": ev.Clicks,
		"shiftKey": ev.Mods&ui.Shift != 0, "altKey": ev.Mods&ui.Alt != 0,
		"metaKey": ev.Mods&ui.Super != 0, "ctrlKey": ev.Mods&ui.Ctrl != 0}
}

func (d *DocumentEvents) command(target luimygo.InputNode, ev ui.InputEvent) bool {
	payload := map[string]any{"nativeCommand": ev.Text}
	switch ev.Text {
	case "copy", "cut":
		return d.send(target, ev.Text, payload)
	case "paste", "pasteAndMatchStyle":
		data := d.services.ReadClipboardData(transfer.Text, transfer.HTML)
		clipboard := map[string]string{}
		for _, format := range []transfer.Format{transfer.Text, transfer.HTML} {
			if _, ok := data.Preferred(format); ok {
				value, err := data.Read(format)
				if err != nil {
					panic(fmt.Errorf("document paste clipboard %s: %w", format, err))
				}
				clipboard[string(format)] = string(value)
			}
		}
		payload["clipboardData"] = clipboard
		return d.send(target, "paste", payload)
	}
	// Menus carry commands rather than physical keys. Normalize only the
	// existing accelerator vocabulary; native controls still get the original
	// command when OCaml does not prevent it. No Go command model is introduced.
	var key string
	mods := ui.Ctrl
	if runtime.GOOS == "darwin" {
		mods = ui.Super
	}
	switch ev.Text {
	case "undo":
		key = "z"
	case "redo":
		key, mods = "z", mods|ui.Shift
	case "selectAll":
		key = "a"
	case "delete":
		key, mods = "Delete", 0
	case "bold":
		key = "b"
	case "italic":
		key = "i"
	default:
		return false
	}
	payload = extensionDOMKey(ui.InputEvent{Mods: mods}, key)
	payload["nativeCommand"] = ev.Text
	return d.send(target, "keydown", payload)
}
