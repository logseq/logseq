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
