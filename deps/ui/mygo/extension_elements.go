package main

import (
	"encoding/json"
	"fmt"
	"math"
	"strconv"
	"strings"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

func extensionAttrs(n luimygo.Node) map[string]string {
	attrs := map[string]string{}
	if raw := n.String("attrs"); raw != "" {
		if err := json.Unmarshal([]byte(raw), &attrs); err != nil {
			panic(fmt.Errorf("%s attrs: %w", n.Identifier, err))
		}
	}
	return attrs
}

// Platform.emit_event injects the complete target/ancestor snapshot from
// nodeId. Do not manufacture a partial target here and suppress that enrichment.
func extensionDOMEvent(n luimygo.Node, emit func(luimygo.Event), name string, payload map[string]any) {
	if payload == nil {
		payload = map[string]any{}
	}
	payload["nodeId"] = n.ID
	encoded, err := json.Marshal(payload)
	if err != nil {
		panic(fmt.Errorf("%s %s payload: %w", n.Identifier, name, err))
	}
	extensionEmit(n, emit, "dom-event", map[string]any{"name": name, "payload": string(encoded)})
}

func extensionKey(key ui.Key) string {
	if key >= ui.KeyA && key <= ui.KeyZ {
		return string(rune('a' + key - ui.KeyA))
	}
	if key >= ui.Key0 && key <= ui.Key9 {
		return string(rune('0' + key - ui.Key0))
	}
	switch key {
	case ui.KeyEnter:
		return "Enter"
	case ui.KeyEscape:
		return "Escape"
	case ui.KeyBackspace:
		return "Backspace"
	case ui.KeyDelete:
		return "Delete"
	case ui.KeyTab:
		return "Tab"
	case ui.KeySpace:
		return " "
	case ui.KeyLeft:
		return "ArrowLeft"
	case ui.KeyRight:
		return "ArrowRight"
	case ui.KeyUp:
		return "ArrowUp"
	case ui.KeyDown:
		return "ArrowDown"
	case ui.KeyHome:
		return "Home"
	case ui.KeyEnd:
		return "End"
	case ui.KeyPageUp:
		return "PageUp"
	case ui.KeyPageDown:
		return "PageDown"
	case ui.KeyMinus:
		return "-"
	case ui.KeyEqual:
		return "="
	case ui.KeyComma:
		return ","
	case ui.KeyPeriod:
		return "."
	case ui.KeySlash:
		return "/"
	case ui.KeySemicolon:
		return ";"
	case ui.KeyQuote:
		return "'"
	case ui.KeyBracketLeft:
		return "["
	case ui.KeyBracketRight:
		return "]"
	case ui.KeyBackslash:
		return "\\"
	case ui.KeyBackquote:
		return "`"
	}
	return ""
}

func extensionKeyValues(ev ui.InputEvent, key string) map[string]any {
	return map[string]any{"key": key, "shift": ev.Mods&ui.Shift != 0, "alt": ev.Mods&ui.Alt != 0,
		"meta": ev.Mods&ui.Super != 0, "ctrl": ev.Mods&ui.Ctrl != 0, "repeat": ev.Repeat}
}

func extensionDOMKey(ev ui.InputEvent, key string) map[string]any {
	return map[string]any{"key": key, "shiftKey": ev.Mods&ui.Shift != 0, "altKey": ev.Mods&ui.Alt != 0,
		"metaKey": ev.Mods&ui.Super != 0, "ctrlKey": ev.Mods&ui.Ctrl != 0, "repeat": ev.Repeat}
}

type extensionTextState struct {
	value, model string
	initialized  bool
	focused      bool
}

// Native text controls own only their platform editing state. The wire value
// is authoritative, including rejection/normalization of input proposals.
func (s *extensionTextState) reconcile(value string) {
	s.value, s.model, s.initialized = value, value, true
}

func (services *platformServices) renderLogseqElement(tag string) luimygo.Renderer {
	return func(c *ui.Context, n luimygo.Node, children func(), emit func(luimygo.Event)) {
		attrs := extensionAttrs(n)
		_, hidden := attrs["hidden"]
		if n.String("display") == "none" || hidden {
			ui.Box(c).Size(0, 0)
			return
		}
		if services.resources.Render(c, n, tag, children, emit) {
			return
		}
		switch tag {
		case "img", "video", "audio", "iframe", "canvas", "pdf", "svg", "path", "circle", "rect", "line", "polyline", "polygon", "g", "defs", "use", "ellipse", "select", "option":
			extensionUnavailable(c, n, "raw resource/SVG/select embedding requires a host adapter")
			if text := attrs["alt"]; text != "" {
				ui.Text(c, text).Wrap()
			}
			return
		case "br":
			ui.Box(c).Height(1).WidthPercent(100)
			return
		case "hr":
			ui.Box(c).Height(1).WidthPercent(100).Background(ui.Hex("#888888"))
			return
		}
		var e ui.Element
		var textState *extensionTextState
		if tag == "input" && attrs["type"] == "checkbox" {
			root := ui.Column(c)
			checked := ui.Local(root, "raw-checkbox", func() bool { return false })
			_, *checked = attrs["checked"]
			root.Children(func() { e = ui.Checkbox(c, checked, n.String("text")) })
			e.OnChange(func() {
				payload := map[string]any{"checked": *checked}
				extensionDOMEvent(n, emit, "input", payload)
				extensionDOMEvent(n, emit, "change", payload)
			})
		} else if tag == "textarea" || tag == "input" {
			if tag == "input" && attrs["type"] != "" && attrs["type"] != "text" && attrs["type"] != "search" && attrs["type"] != "email" && attrs["type"] != "url" {
				extensionUnavailable(c, n, "raw input type "+attrs["type"]+" is not implemented")
				return
			}
			// Scope state to this LUI incarnation's toolkit root, not a global
			// node-ID map that would survive removals or ID reuse.
			root := ui.Column(c)
			textState = ui.Local(root, "raw-text", func() extensionTextState { return extensionTextState{} })
			value := attrs["value"]
			if _, hasValue := attrs["value"]; !hasValue {
				value = n.String("text")
			}
			textState.reconcile(value)
			services.BindInputValue(n, &textState.value)
			root.Children(func() {
				if tag == "textarea" {
					e = ui.TextArea(c, &textState.value)
				} else {
					e = ui.TextInput(c, &textState.value)
				}
			})
			_, readOnly := attrs["readonly"]
			e.ReadOnly(readOnly).Placeholder(attrs["placeholder"])
			services.BindInputControl(n, e, textState.value)
			e.OnChange(func() {
				extensionDOMEvent(n, emit, "input", map[string]any{"value": textState.value})
				extensionDOMEvent(n, emit, "change", map[string]any{"value": textState.value})
			})
		} else {
			if attrs["data-scroll-container"] != "" {
				e = ui.Scroll(c)
				state := ui.Local(e, "raw-scroll", func() ui.ScrollState { return ui.ScrollState{} })
				services.BindScrollControl(n, e, state)
			} else if n.String("orientation") == "horizontal" || n.String("orientation") == "row" || strings.Contains(" span a b i em strong code small kbd u mark del ins sub sup tspan label img em-emoji tr ", " "+tag+" ") {
				e = ui.Row(c)
			} else {
				e = ui.Column(c)
			}
			if n.String("flex-wrap") == "wrap" {
				e.Wrap()
			}
			services.elementStyle(c, e, n, attrs, tag)
			e.Children(func() {
				if text := n.String("text"); text != "" {
					ui.Text(c, text).Wrap()
				} else if tag == "em-emoji" && attrs["data-emoji"] != "" {
					ui.Text(c, attrs["data-emoji"])
				}
				children()
			})
		}
		if tag == "input" || tag == "textarea" {
			services.elementStyle(c, e, n, attrs, tag)
		}
		services.bind(n, e)
		_, disabled := attrs["disabled"]
		e.Disabled(disabled)
		if label := attrs["aria-label"]; label != "" {
			e.Label(label)
		} else if id := n.String("accessibility-identifier"); id != "" {
			e.Label(id)
		}
		if tag == "button" || tag == "a" {
			e.Focusable().Cursor(ui.CursorPointer)
		}
		if title := attrs["title"]; title != "" {
			e.Tooltip(title)
		}
		if tag == "a" && attrs["href"] != "" {
			extensionGap(n.Identifier, "external href navigation requires the OCaml host; click is forwarded")
		}
		if n.String("style-class") != "" || attrs["style"] != "" {
			extensionGap("raw markup", "CSS classes/styles are not a MyGo stylesheet; only supported typed properties and tag emphasis are rendered")
		}
		if textState != nil {
			focused := e.Focused()
			if focused != textState.focused {
				textState.focused = focused
				name := "blur"
				if focused {
					name = "focus"
				}
				extensionDOMEvent(n, emit, name, nil)
			}
		}
	}
}

func extensionLength(text string) (float32, bool) {
	text = strings.TrimSpace(strings.TrimSuffix(text, "px"))
	value, err := strconv.ParseFloat(text, 32)
	return float32(value), err == nil && !math.IsNaN(value) && !math.IsInf(value, 0) && value >= 0
}

func (services *platformServices) elementStyle(c *ui.Context, e ui.Element, n luimygo.Node, attrs map[string]string, tag string) {
	for name, set := range map[string]func(float32){"font-size": func(v float32) { e.FontSize(v) }, "opacity": func(v float32) { e.Opacity(v) }, "corner-radius": func(v float32) { e.Radius(v) }} {
		if _, ok := n.Props[name]; ok {
			set(float32(n.Number(name, 0)))
		}
	}
	if _, ok := n.Props["font-weight"]; ok {
		e.FontWeight(int(n.Number("font-weight", 400)))
	} else if tag == "strong" || tag == "b" || tag == "th" || strings.HasPrefix(tag, "h") && len(tag) == 2 {
		e.FontWeight(700)
	}
	if tag == "em" || tag == "i" {
		e.Italic()
	}
	if tag == "code" || tag == "pre" || tag == "kbd" {
		e.Font("monospace")
	}
	if tag == "u" || tag == "a" {
		e.Underline()
	}
	if tag == "del" {
		e.Strikethrough()
	}
	for name, set := range map[string]func(float32){
		"width": func(v float32) { e.Width(v) }, "height": func(v float32) { e.Height(v) },
		"min-width": func(v float32) { e.MinWidth(v) }, "max-width": func(v float32) { e.MaxWidth(v) },
		"min-height": func(v float32) { e.MinHeight(v) }, "max-height": func(v float32) { e.MaxHeight(v) },
		"gap": func(v float32) { e.Gap(v) }, "row-gap": func(v float32) { e.GapY(v) }, "column-gap": func(v float32) { e.GapX(v) },
	} {
		value := n.String(name)
		if value == "" {
			value = attrs[name]
		}
		if value == "" || value == "auto" {
			continue
		}
		if strings.HasSuffix(value, "%") && (name == "width" || name == "height") {
			if v, ok := extensionLength(strings.TrimSuffix(value, "%")); ok {
				if name == "width" {
					e.WidthPercent(v)
				} else {
					e.HeightPercent(v)
				}
			}
		} else if v, ok := extensionLength(value); ok {
			set(v)
		} else {
			extensionGap(n.Identifier, "unsupported length unit in "+name)
		}
	}
	for _, kind := range []string{"padding", "margin"} {
		var edges [4]float32
		if value := n.String(kind); value != "" {
			parts := strings.Fields(value)
			if len(parts) > 0 && len(parts) <= 4 {
				var values [4]float32
				valid := true
				for i, part := range parts {
					v, ok := extensionLength(part)
					values[i], valid = v, valid && ok
				}
				if valid {
					switch len(parts) {
					case 1:
						edges = [4]float32{values[0], values[0], values[0], values[0]}
					case 2:
						edges = [4]float32{values[0], values[1], values[0], values[1]}
					case 3:
						edges = [4]float32{values[0], values[1], values[2], values[1]}
					case 4:
						edges = values
					}
				} else {
					extensionGap(n.Identifier, "unsupported "+kind+" length")
				}
			}
		}
		for i, suffix := range []string{"top", "right", "bottom", "left"} {
			if v, ok := extensionLength(n.String(kind + "-" + suffix)); ok {
				edges[i] = v
			}
		}
		if v, ok := extensionLength(n.String(kind + "-horizontal")); ok {
			edges[1], edges[3] = v, v
		}
		if v, ok := extensionLength(n.String(kind + "-vertical")); ok {
			edges[0], edges[2] = v, v
		}
		if kind == "padding" {
			e.Padding(edges[:]...)
		} else {
			e.Margin(edges[:]...)
		}
	}
	if background := n.String("background"); background != "" {
		if _, err := services.ApplyElementColor(c, e, "background", background); err != nil {
			panic(err)
		}
	}
	for declaration := range strings.SplitSeq(attrs["style"], ";") {
		property, value, ok := strings.Cut(declaration, ":")
		if !ok {
			continue
		}
		if _, err := services.ApplyElementColor(c, e, property, value); err != nil {
			panic(err)
		}
	}
	for _, name := range []string{"line-height", "letter-spacing", "shadow", "main", "cross"} {
		if _, ok := n.Props[name]; ok {
			extensionGap(n.Identifier, "typed "+name+" is not implemented by the raw adapter")
		}
	}
}
