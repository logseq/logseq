package main

import (
	"testing"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

func TestNativeEditorUnicodeCompositionProtocol(t *testing.T) {
	previous := logseqEditorServices.Snapshot
	t.Cleanup(func() { logseqEditorServices.Snapshot = previous })
	logseqEditorServices.Snapshot = func(string) (string, int, int, bool) { return "a😀中z", 1, 5, true }
	var events []luimygo.Event
	input := &logseqEditorInput{emit: func(event luimygo.Event) { events = append(events, event) }}
	if got := input.Selection().Range; got != (ui.TextInputRange{Start: 1, End: 3}) {
		t.Fatalf("native selection: %+v", got)
	}
	text, actual := input.TextForRange(ui.TextInputRange{Start: 3, End: 1})
	if text != "😀" || actual != (ui.TextInputRange{Start: 1, End: 3}) {
		t.Fatalf("Unicode surrounding range: %q %+v", text, actual)
	}
	input.SetMarkedText(nil, "中文😀", ui.TextInputRange{Start: 2, End: 4})
	marked, ok := input.MarkedRange()
	if !ok || marked != (ui.TextInputRange{Start: 1, End: 5}) {
		t.Fatalf("marked UTF-16 range: %+v %v", marked, ok)
	}
	if got := input.Selection().Range; got != (ui.TextInputRange{Start: 3, End: 5}) {
		t.Fatalf("native preedit selection: %+v", got)
	}
	input.ReplaceText(nil, "中文😀")
	if _, ok := input.MarkedRange(); ok {
		t.Fatal("committed preedit remains marked")
	}
	if len(events) != 3 || events[0].Name != "composition" || events[0].Values["state"] != "start" || events[1].Values["state"] != "update" || events[2].Values["state"] != "end" || events[2].Values["text"] != "中文😀" {
		t.Fatalf("composition must commit exactly once through OCaml: %+v", events)
	}
}
