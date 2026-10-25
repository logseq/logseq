package main

import (
	"fmt"
	"log"
	"sort"
	"strconv"
	"strings"
	"sync"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

// These are the schemas registered by native_embed.ml, not replacements for
// portable LUI kinds. In particular logseq-br is raw markup, not the removed
// standard br component (see LUI docs/api-migrations.md).
var logseqRawTags = strings.Fields(`div span a button textarea input img main
header h1 h2 h3 h4 h5 h6 p ul li nav section strong em code pre label form select
option video audio iframe small kbd table thead tbody tr td th br hr canvas
article aside footer details summary u mark b i del ins sub blockquote svg path
circle rect line polyline polygon g defs use ellipse tspan sup em-emoji pdf`)

// extensions is the sole extension registry entry point for the runtime.
// Schemas below mirror native/logseq_{el,editor,codemirror}.ml. The fingerprint
// encoder is a literal port of Lui_extension.fingerprint, not a guessed hash.
func (s *platformServices) extensions() map[string]luimygo.Extension {
	out := make(map[string]luimygo.Extension, len(logseqRawTags)+3)
	children := make([]string, 0, len(logseqRawTags)+1)
	for _, tag := range logseqRawTags {
		children = append(children, "logseq-"+tag)
	}
	children = append(children, "logseq-codemirror")
	rawProps := extensionFields("string", false, `attrs events text style-class accessibility-identifier
orientation flex-wrap padding padding-top padding-right padding-bottom padding-left
padding-horizontal padding-vertical margin margin-top margin-right margin-bottom
margin-left margin-horizontal margin-vertical width height min-width min-height
max-width max-height gap row-gap column-gap background shadow display main cross`)
	rawProps = append(rawProps, extensionFields("float", false,
		"font-size font-weight line-height letter-spacing opacity corner-radius")...)
	dom := extensionEventSchema{"dom-event", append(extensionFields("string", true, "name"), extensionFields("string", false, "payload")...)}
	for _, tag := range logseqRawTags {
		id := "logseq-" + tag
		out[id] = luimygo.Extension{
			Fingerprint: extensionFingerprint(id, true, children, rawProps, []extensionEventSchema{dom}),
			Render:      s.renderLogseqElement(tag),
		}
	}
	out["logseq-dom"] = luimygo.Extension{
		Fingerprint: extensionFingerprint("logseq-dom", false, nil, nil, []extensionEventSchema{dom}),
		Render:      s.renderDocumentEvents,
	}
	editorProps := extensionFields("string", false, "composition runs accessibility-identifier data-testid style-class attrs")
	editorProps = append(editorProps, extensionFields("string", true, "block-id")...)
	editorProps = append(editorProps, extensionFields("int", false, "caret")...)
	editorEvents := []extensionEventSchema{
		{"key", append(extensionFields("string", true, "key"), extensionFields("bool", false, "shift alt meta ctrl repeat")...)},
		{"insert", extensionFields("string", true, "text")},
		{"delete", extensionFields("string", true, "kind")},
		{"composition", append(extensionFields("string", true, "state"), extensionFields("string", false, "text range")...)},
		{"focus", nil}, {"blur", nil},
		{"pointer", append(extensionFields("int", true, "offset"), extensionFields("bool", false, "extend")...)},
		{"dblclick", extensionFields("int", true, "offset")},
		dom,
	}
	out["logseq-editor"] = luimygo.Extension{
		Fingerprint: extensionFingerprint("logseq-editor", false, nil, editorProps, editorEvents),
		Render:      s.renderLogseqEditor,
	}
	cmProps := extensionFields("string", false, "uuid lang value source-role style-class accessibility-identifier")
	cmProps = append(cmProps, extensionFields("bool", false, "read-only")...)
	out["logseq-codemirror"] = luimygo.Extension{
		Fingerprint: extensionFingerprint("logseq-codemirror", false, nil, cmProps, []extensionEventSchema{
			{"cm-event", append(extensionFields("string", true, "name"), extensionFields("string", false, "value key")...)},
		}),
		Render: s.renderLogseqCodeMirror,
	}
	return out
}

func (s *platformServices) bind(n luimygo.Node, e ui.Element) {
	if err := s.backend.BindHostElement(n.ID, e); err != nil {
		panic(err)
	}
}

type extensionFieldSchema struct {
	name, kind string
	required   bool
}

type extensionEventSchema struct {
	name   string
	fields []extensionFieldSchema
}

func extensionFields(kind string, required bool, names string) []extensionFieldSchema {
	var fields []extensionFieldSchema
	for _, name := range strings.Fields(names) {
		fields = append(fields, extensionFieldSchema{name, kind, required})
	}
	return fields
}

func extensionToken(s string) string { return strconv.Itoa(len(s)) + ":" + s }

func extensionFieldToken(f extensionFieldSchema) string {
	required := "optional"
	if f.required {
		required = "required"
	}
	return extensionToken(f.name) + ":" + f.kind + ":" + required
}

func extensionFingerprint(id string, standardChildren bool, children []string, props []extensionFieldSchema, events []extensionEventSchema) string {
	// Sort encoded field/property/event strings, but sort child identifiers
	// BEFORE encoding. Those different ordering rules are part of the ABI.
	childIDs := append([]string(nil), children...)
	sort.Strings(childIDs)
	for i := range childIDs {
		childIDs[i] = extensionToken(childIDs[i])
	}
	properties := make([]string, 0, len(props))
	for _, p := range props {
		// All current Logseq schemas have None defaults. Do not invent defaults.
		properties = append(properties, extensionFieldToken(p)+":none")
	}
	sort.Strings(properties)
	eventTokens := make([]string, 0, len(events))
	for _, event := range events {
		fields := make([]string, 0, len(event.fields))
		for _, field := range event.fields {
			fields = append(fields, extensionFieldToken(field))
		}
		sort.Strings(fields)
		eventTokens = append(eventTokens, extensionToken(event.name)+"["+strings.Join(fields, ",")+"]")
	}
	sort.Strings(eventTokens)
	standard := "0"
	if standardChildren {
		standard = "1"
	}
	return "lui-extension-v1|" + extensionToken(id) +
		"|profiles:linux/generic,macos/generic,web/web,windows/generic" +
		"|standard-children:" + standard + "|children:" + strings.Join(childIDs, ",") +
		"|properties:" + strings.Join(properties, ",") + "|events:" + strings.Join(eventTokens, ",")
}

func extensionEmit(n luimygo.Node, emit func(luimygo.Event), name string, values map[string]any) {
	emit(luimygo.Event{Kind: "extension-event", Node: n.ID, Identifier: n.Identifier, Name: name, Values: values})
}

var extensionReportedGaps sync.Map

// Report once per feature, rather than once per frame or per mounted node.
func extensionGap(id, detail string) {
	key := id + ": " + detail
	if _, seen := extensionReportedGaps.LoadOrStore(key, true); !seen {
		log.Printf("MyGo extension unsupported: %s", key)
	}
}

func extensionUnavailable(c *ui.Context, n luimygo.Node, detail string) {
	extensionGap(n.Identifier, detail)
	// A diagnostic placeholder is deliberately visible, not an empty widget.
	ui.Text(c, fmt.Sprintf("(Dev) [MyGo: %s — %s]", n.Identifier, detail)).Wrap()
}
