package main

import (
	"encoding/json"
	"errors"
	"reflect"
	"testing"

	"github.com/egoist/mygo/transfer"
	luimygo "github.com/logseq/lui/platform/mygo"
)

func TestDocumentClipboardPaste(t *testing.T) {
	failed := errors.New("clipboard provider failed")
	rich := transfer.New(transfer.NewItem(
		transfer.Bytes(transfer.Text, []byte("plain")),
		transfer.Bytes(transfer.HTML, []byte("<p>rich</p>")),
	))
	for _, test := range []struct {
		name, command string
		data          transfer.Data
		err           error
		want          map[string]string
		consumed      bool
	}{
		{"rich", "paste", rich, nil, map[string]string{"text/plain": "plain", "text/html": "<p>rich</p>"}, true},
		{"match style", "pasteAndMatchStyle", rich, nil, map[string]string{"text/plain": "plain"}, true},
		{"plain", "paste", transfer.TextData("plain"), nil, map[string]string{"text/plain": "plain"}, true},
		{"html only", "paste", transfer.New(transfer.NewItem(transfer.Bytes(transfer.HTML, []byte("<p>rich</p>")))), nil, map[string]string{"text/html": "<p>rich</p>"}, true},
		{"failed HTML", "paste", transfer.New(transfer.NewItem(transfer.Bytes(transfer.Text, []byte("plain")), transfer.Lazy(transfer.HTML, func() ([]byte, error) { return nil, failed }))), nil, map[string]string{"text/plain": "plain"}, true},
		{"invalid HTML", "paste", transfer.New(transfer.NewItem(transfer.Bytes(transfer.Text, []byte("plain")), transfer.Bytes(transfer.HTML, []byte{0xff}))), nil, map[string]string{"text/plain": "plain"}, true},
		{"read failure", "paste", transfer.Data{}, failed, nil, true},
		{"invalid text", "paste", transfer.TextData(string([]byte{0xff})), nil, nil, true},
		{"empty clipboard", "paste", transfer.Data{}, nil, nil, false},
		{"unsupported image", "paste", transfer.New(transfer.NewItem(transfer.Bytes(transfer.PNG, []byte("image")))), nil, nil, false},
	} {
		t.Run(test.name, func(t *testing.T) {
			var got map[string]string
			document := DocumentEvents{dispatch: func(name, payload string) bool {
				var event struct {
					NativeCommand string            `json:"nativeCommand"`
					ClipboardData map[string]string `json:"clipboardData"`
				}
				if err := json.Unmarshal([]byte(payload), &event); err != nil {
					t.Fatal(err)
				}
				if name != "paste" || event.NativeCommand != test.command {
					t.Fatalf("unexpected clipboard event: %s %+v", name, event)
				}
				got = event.ClipboardData
				return true
			}}
			consumed := document.paste(nil, luimygo.InputNode{}, test.command, test.data, test.err)
			if !reflect.DeepEqual(got, test.want) || consumed != test.consumed {
				t.Fatalf("paste = (%v, %v), want (%v, %v)", got, consumed, test.want, test.consumed)
			}
		})
	}
}

func TestClipboardWriteContract(t *testing.T) {
	for _, test := range []struct {
		name, payload string
		want          map[transfer.Format]string
	}{
		{"plain", `{"request-id":"1","text":"plain"}`, map[transfer.Format]string{transfer.Text: "plain"}},
		{"rich", `{"request-id":"2","text":"café 中文 😀","html":"<b>café 中文 😀</b>","blocks":"{:graph \"logseq_db_test\" :embed-block? nil :op :copy :blocks []}"}`, map[transfer.Format]string{transfer.Text: "café 中文 😀", transfer.HTML: "<b>café 中文 😀</b>", "application/logseq": `{:graph "logseq_db_test" :embed-block? nil :op :copy :blocks []}`}},
		{"empty representations", `{"request-id":"3","text":"","html":"","blocks":""}`, map[transfer.Format]string{transfer.Text: "", transfer.HTML: "", "application/logseq": ""}},
		{"missing text", `{"request-id":"1","html":"rich"}`, nil},
		{"unknown field", `{"request-id":"1","text":"plain","rtf":"rich"}`, nil},
		{"duplicate text", `{"request-id":"1","text":"plain","text":"other"}`, nil},
		{"duplicate HTML", `{"request-id":"1","text":"plain","html":"one","html":"two"}`, nil},
		{"wrong HTML type", `{"request-id":"1","text":"plain","html":null}`, nil},
		{"wrong blocks type", `{"request-id":"1","text":"plain","blocks":{}}`, nil},
		{"wrong identity type", `{"request-id":1,"text":"plain"}`, nil},
		{"zero identity", `{"request-id":"0","text":"plain"}`, nil},
		{"noncanonical identity", `{"request-id":"01","text":"plain"}`, nil},
		{"overflow identity", `{"request-id":"9223372036854775808","text":"plain"}`, nil},
		{"trailing input", `{"request-id":"1","text":"plain"}{}`, nil},
		{"invalid UTF-8", string([]byte{'{', '"', 0xff}), nil},
	} {
		t.Run(test.name, func(t *testing.T) {
			request, err := decodeClipboardWrite(test.payload)
			if test.want == nil {
				if err == nil {
					t.Fatal("malformed clipboard request accepted")
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			items := clipboardWriteData(request).Items()
			if len(items) != 1 {
				t.Fatalf("clipboard items = %d, want one", len(items))
			}
			got := make(map[transfer.Format]string)
			for _, format := range items[0].Formats() {
				value, err := items[0].Read(format)
				if err != nil {
					t.Fatal(err)
				}
				got[format] = string(value)
			}
			if !reflect.DeepEqual(got, test.want) {
				t.Fatalf("representations = %v, want %v", got, test.want)
			}
		})
	}
}
