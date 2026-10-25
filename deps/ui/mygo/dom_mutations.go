//go:build darwin || linux

package main

import (
	"encoding/json"
	"fmt"
	"maps"
	"math"
	"slices"
	"strconv"
	"strings"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

// domMutationRenderer mirrors OCaml Dom_ext's presentation overrides, not its
// document or editable sessions. Configure Services before accepting requests.
// All methods run on the UI goroutine; the zero value has no overrides.
type domMutationRenderer struct {
	Services *platformServices
	Activate func(luimygo.Node) error
	// Custom properties belong to the host theme, not a pretend CSS engine.
	SetCustomProperty func(name, value string) error
	nodes             map[int64]*domMutationOverride
}

type domMutationAttribute struct {
	value   string
	removed bool
}

type domMutationOverride struct {
	target  platformTarget
	attrs   map[string]domMutationAttribute
	text    *string
	checked *bool
	removed bool
}

func newDOMMutationRenderer(services *platformServices) *domMutationRenderer {
	return &domMutationRenderer{Services: services}
}

// Sync follows Services.AppliedBatch, including snapshots. Bind also checks
// identity, so even a missed sweep cannot apply an override to a reused ID.
func (m *domMutationRenderer) Sync() {
	for id, state := range m.nodes {
		if !m.Services.liveTarget(state.target) {
			delete(m.nodes, id)
		}
	}
}

func domMutationRaw(n luimygo.Node) bool {
	return n.Kind == "extension" && strings.HasPrefix(n.Identifier, "logseq-") &&
		slices.Contains(logseqRawTags, strings.TrimPrefix(n.Identifier, "logseq-"))
}

// HandleDOMMutation is the Services.DOMMutation callback. Its caller already
// pins pending requests to an incarnation and replaces identifier refs by IDs.
func (m *domMutationRenderer) HandleDOMMutation(op string, body json.RawMessage) error {
	if m.Services == nil {
		return fmt.Errorf("DOM mutation renderer has no platform service")
	}
	var request map[string]json.RawMessage
	if err := platformObject(string(body), &request); err != nil {
		return err
	}
	id, err := m.Services.resolveRef(request["ref"])
	if err != nil || id == 0 {
		return err // Missing/stale references are absent, as in the native host.
	}
	n, _ := m.Services.backend.Node(id)
	if !domMutationRaw(n) {
		return fmt.Errorf("DOM mutation %s is unsupported for %s/%s", op, n.Kind, n.Identifier)
	}
	n = m.BindDOMMutations(n)
	if op == "click" {
		if m.Activate == nil {
			return fmt.Errorf("native DOM click activation is not connected")
		}
		if err := m.Activate(n); err != nil {
			return err
		}
		m.Services.invalidateDOM()
		return nil
	}
	var attribute, value, text string
	var checked bool
	removeAttribute := false
	switch op {
	case "set-attr", "remove-attr":
		if err := platformRequired(request, "name", &attribute); err != nil {
			return err
		}
		attribute = strings.ToLower(attribute)
		if attribute == "" || strings.ContainsAny(attribute, " \t\r\n\f\"'<>/=") {
			return fmt.Errorf("invalid DOM attribute name %q", attribute)
		}
		removeAttribute = op == "remove-attr"
		if !removeAttribute {
			if err := platformRequired(request, "value", &value); err != nil {
				return err
			}
		}
		if attribute == "style" && !removeAttribute {
			styles, err := domMutationStyles(value)
			if err != nil {
				return err
			}
			for name, value := range styles {
				if err := domMutationValidateStyle(name, value); err != nil {
					return err
				}
			}
		}
	case "set-class", "class-add", "class-remove":
		attribute = "class"
		if err := platformRequired(request, "class", &value); err != nil {
			return err
		}
		if op != "set-class" {
			if value == "" || strings.ContainsAny(value, " \t\r\n\f") {
				return fmt.Errorf("class mutation requires a single nonempty token")
			}
			classes := strings.Fields(n.String("style-class"))
			if len(classes) == 0 {
				classes = strings.Fields(extensionAttrs(n)["class"])
			}
			if op == "class-add" && !slices.Contains(classes, value) {
				classes = append(classes, value)
			} else if op == "class-remove" {
				classes = slices.DeleteFunc(classes, func(c string) bool { return c == value })
			}
			value = strings.Join(classes, " ")
		}
	case "style-set-property":
		var property string
		if err := platformRequired(request, "property", &property); err != nil {
			return err
		}
		if err := platformRequired(request, "value", &value); err != nil {
			return err
		}
		if strings.HasPrefix(property, "--") {
			if m.SetCustomProperty == nil {
				return fmt.Errorf("native CSS custom property %s requires the theme bridge", property)
			}
			if err := m.SetCustomProperty(property, value); err != nil {
				return err
			}
			m.Services.invalidateDOM()
			return nil
		}
		property = strings.ToLower(strings.TrimSpace(property))
		if err := domMutationValidateStyle(property, value); err != nil {
			return err
		}
		styles, err := domMutationStyles(extensionAttrs(n)["style"])
		if err != nil {
			return err
		}
		if value == "" {
			delete(styles, property)
		} else {
			styles[property] = strings.TrimSpace(value)
		}
		attribute, value = "style", domMutationStyleText(styles)
	case "set-text-content":
		if n.Identifier == "logseq-input" || n.Identifier == "logseq-textarea" {
			return fmt.Errorf("native editable controls require the set-value bridge, not a textContent override")
		}
		if err := platformRequired(request, "text", &text); err != nil {
			return err
		}
	case "set-checked":
		if n.Identifier != "logseq-input" || extensionAttrs(n)["type"] != "checkbox" {
			return fmt.Errorf("set-checked requires a native raw checkbox")
		}
		if err := platformRequired(request, "checked", &checked); err != nil {
			return err
		}
	case "remove":
	default:
		return fmt.Errorf("unsupported DOM mutation %q", op)
	}
	if m.nodes == nil {
		m.nodes = make(map[int64]*domMutationOverride)
	}
	state := m.nodes[id]
	if state == nil || !m.Services.liveTarget(state.target) {
		state = &domMutationOverride{target: m.Services.controlTarget(id), attrs: make(map[string]domMutationAttribute)}
		m.nodes[id] = state
	}
	switch op {
	case "set-text-content":
		state.text = &text
	case "set-checked":
		state.checked = &checked
	case "remove":
		state.removed = true
	default:
		state.attrs[attribute] = domMutationAttribute{value: value, removed: removeAttribute}
	}
	m.Services.invalidateDOM()
	return nil
}

// BindDOMMutations derives one frame's snapshot. Traversal must honor visible
// and Children: textContent replaces children; remove suppresses the subtree.
// Renderers must prefer an explicit checked prop over the checked attribute.
func (m *domMutationRenderer) BindDOMMutations(n luimygo.Node) luimygo.Node {
	state := m.nodes[n.ID]
	if state == nil {
		return n
	}
	if !m.Services.liveTarget(state.target) {
		delete(m.nodes, n.ID)
		return n
	}
	n.Props = maps.Clone(n.Props)
	if n.Props == nil {
		n.Props = make(map[string]any)
	}
	attrs := extensionAttrs(n)
	for name, attribute := range state.attrs {
		if attribute.removed {
			delete(attrs, name)
		} else {
			attrs[name] = attribute.value
		}
		if name == "class" {
			n.Props["style-class"] = attrs[name]
		}
	}
	encoded, err := json.Marshal(attrs)
	if err != nil {
		panic(err)
	}
	n.Props["attrs"] = string(encoded)
	if state.text != nil {
		n.Props["text"], n.Children = *state.text, nil
	}
	if state.checked != nil {
		n.Props["checked"] = *state.checked
	} else if _, changed := state.attrs["checked"]; changed {
		_, n.Props["checked"] = attrs["checked"]
	}
	styles, err := domMutationStyles(attrs["style"])
	if err != nil {
		panic(err)
	}
	n.Props["dom-mutation-style"] = styles
	for name, value := range styles {
		switch name {
		case "width", "height", "min-width", "max-width", "min-height", "max-height", "gap", "row-gap", "column-gap", "padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin", "margin-top", "margin-right", "margin-bottom", "margin-left", "display":
			n.Props[name] = value
		case "font-size", "font-weight", "opacity":
			if number, ok := domMutationNumber(value); ok {
				n.Props[name] = float64(number)
			}
		}
	}
	if styles["display"] == "flex" {
		n.Props["orientation"] = "horizontal"
	}
	_, hidden := attrs["hidden"]
	if state.removed || hidden || styles["display"] == "none" {
		n.Props["visible"] = false
	}
	if state.removed {
		n.Children = nil
	}
	return n
}

// ApplyDOMMutationStyle runs after ordinary raw styling, on the real element
// during its build. It implements the admitted inline styles missing from the
// raw adapter. It must not be deferred or retain Element across frames.
func (m *domMutationRenderer) ApplyDOMMutationStyle(n luimygo.Node, e ui.Element) {
	styles, _ := n.Props["dom-mutation-style"].(map[string]string)
	if styles["position"] == "absolute" {
		e.Absolute()
	}
	for name, value := range styles {
		v, ok := domMutationNumber(value)
		if !ok {
			continue
		}
		switch name {
		case "left":
			e.Left(v)
		case "top":
			e.Top(v)
		case "right":
			e.Right(v)
		case "bottom":
			e.Bottom(v)
		}
	}
	if styles["visibility"] == "hidden" {
		e.Opacity(0).Disabled(true).PassThrough()
	}
	if transform := styles["transform"]; transform != "" && transform != "none" {
		if x, y, ok := domMutationTranslation(transform); ok {
			e.Translate(x, y)
		}
	}
}

func domMutationNumber(value string) (float32, bool) {
	value = strings.TrimSpace(value)
	if value == "" {
		return 0, false
	}
	n, err := strconv.ParseFloat(strings.TrimSuffix(value, "px"), 32)
	return float32(n), err == nil && !math.IsNaN(n) && !math.IsInf(n, 0)
}

func domMutationValidateStyle(name, value string) error {
	value = strings.TrimSpace(value)
	valid := false
	switch name {
	case "background", "background-color", "color", "border-color":
		// The scoped theme resolver validates paint when the element is built.
		valid = value != ""
	case "display":
		valid = value == "none" || value == "block" || value == "flex"
	case "visibility":
		valid = value == "hidden" || value == "visible"
	case "position":
		valid = value == "absolute" || value == "relative" || value == "static"
	case "transform":
		_, _, valid = domMutationTranslation(value)
		valid = valid || value == "none"
	case "left", "right", "top", "bottom":
		_, valid = domMutationNumber(value)
	case "width", "height":
		n, ok := domMutationNumber(strings.TrimSuffix(value, "%"))
		valid = ok && n >= 0 || value == "auto"
	case "min-width", "max-width", "min-height", "max-height", "gap", "row-gap", "column-gap", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin-top", "margin-right", "margin-bottom", "margin-left", "font-size", "font-weight", "opacity":
		n, ok := domMutationNumber(value)
		valid = ok && n >= 0
		if name == "opacity" {
			valid = valid && n <= 1 && !strings.HasSuffix(value, "px")
		}
		if name == "font-weight" {
			valid = valid && n >= 100 && n <= 900 && float32(int(n)) == n && !strings.HasSuffix(value, "px")
		}
	case "padding", "margin":
		parts := strings.Fields(value)
		valid = len(parts) > 0 && len(parts) <= 4
		for _, part := range parts {
			n, ok := domMutationNumber(part)
			valid = valid && ok && n >= 0
		}
	default:
		return fmt.Errorf("native inline style %s is unsupported", name)
	}
	if !valid && value != "" {
		return fmt.Errorf("native inline style %s:%s is unsupported", name, value)
	}
	return nil
}

func domMutationTranslation(value string) (float32, float32, bool) {
	name, rest, found := strings.Cut(strings.TrimSpace(value), "(")
	if !found || !strings.HasSuffix(rest, ")") {
		return 0, 0, false
	}
	parts := strings.Split(strings.TrimSuffix(rest, ")"), ",")
	if name != "translate" && name != "translate3d" || len(parts) != 2 && len(parts) != 3 {
		return 0, 0, false
	}
	if name == "translate3d" && len(parts) != 3 || name == "translate" && len(parts) != 2 {
		return 0, 0, false
	}
	x, xok := domMutationNumber(parts[0])
	y, yok := domMutationNumber(parts[1])
	if len(parts) == 3 {
		z, zok := domMutationNumber(parts[2])
		if !zok || z != 0 {
			return 0, 0, false
		}
	}
	return x, y, xok && yok
}

func domMutationStyles(raw string) (map[string]string, error) {
	out := make(map[string]string)
	start, depth := 0, 0
	var quote byte
	escaped := false
	for i := 0; i <= len(raw); i++ {
		if i < len(raw) {
			c := raw[i]
			if escaped {
				escaped = false
				continue
			}
			if c == '\\' {
				escaped = true
				continue
			}
			if quote != 0 {
				if c == quote {
					quote = 0
				}
				continue
			}
			switch c {
			case '\'', '"':
				quote = c
			case '(':
				depth++
			case ')':
				depth--
			}
			if c != ';' || depth != 0 {
				continue
			}
		}
		declaration := strings.TrimSpace(raw[start:i])
		if declaration != "" {
			name, value, ok := strings.Cut(declaration, ":")
			if !ok || strings.TrimSpace(name) == "" {
				return nil, fmt.Errorf("invalid inline style declaration %q", declaration)
			}
			name = strings.TrimSpace(name)
			if !strings.HasPrefix(name, "--") {
				name = strings.ToLower(name)
			}
			out[name] = strings.TrimSpace(value)
		}
		start = i + 1
	}
	if quote != 0 || depth != 0 || escaped {
		return nil, fmt.Errorf("unbalanced inline style")
	}
	return out, nil
}

func domMutationStyleText(styles map[string]string) string {
	names := slices.Sorted(maps.Keys(styles))
	var out strings.Builder
	for _, name := range names {
		fmt.Fprintf(&out, "%s:%s;", name, styles[name])
	}
	return out.String()
}
