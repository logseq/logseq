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

func TestNativeEditorCompositionBoundaries(t *testing.T) {
	for _, tc := range []struct {
		name, state, text string
		finish            func(*logseqEditorInput, ui.TextInputRange)
	}{
		{"final result", "end", "中", func(input *logseqEditorInput, marked ui.TextInputRange) {
			input.ReplaceText(&marked, "中")
		}},
		{"cancel pending result", "cancel", "", func(input *logseqEditorInput, _ ui.TextInputRange) {
			input.CancelComposition()
			input.UnmarkText()
		}},
		{"explicit acceptance", "end", "zhong", func(input *logseqEditorInput, _ ui.TextInputRange) {
			input.UnmarkText()
		}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			previous := logseqEditorServices.Snapshot
			t.Cleanup(func() { logseqEditorServices.Snapshot = previous })
			logseqEditorServices.Snapshot = func(string) (string, int, int, bool) { return "a😀z", 1, 5, true }
			var events []luimygo.Event
			input := &logseqEditorInput{emit: func(event luimygo.Event) { events = append(events, event) }}
			input.SetMarkedText(nil, "zhong", ui.TextInputRange{Start: 5, End: 5})
			marked, _ := input.MarkedRange()
			input.EndComposition()
			if _, marked := input.MarkedRange(); marked || len(events) != 2 {
				t.Fatalf("native end must unmark without committing preedit: %+v", events)
			}
			tc.finish(input, marked)
			if len(events) != 3 || events[2].Name != "composition" || events[2].Values["state"] != tc.state ||
				(tc.state == "end" && events[2].Values["text"] != tc.text) {
				t.Fatalf("composition confirmation boundary: %+v", events)
			}
			if _, marked := input.MarkedRange(); marked || input.composing {
				t.Fatal("finished composition still owns transient state")
			}
		})
	}
}

func TestNativeEditorPartialPreeditCommit(t *testing.T) {
	for _, tc := range []struct {
		name, replacement, want string
		rangeToReplace          ui.TextInputRange
		wantCaret               int
	}{
		{"replace emoji", "好", "中好文", ui.TextInputRange{Start: 2, End: 4}, 3},
		{"insert before emoji", "好", "中好😀文", ui.TextInputRange{Start: 2, End: 2}, 3},
		{"reverse range", "好", "中好文", ui.TextInputRange{Start: 4, End: 2}, 3},
	} {
		t.Run(tc.name, func(t *testing.T) {
			previous := logseqEditorServices.Snapshot
			t.Cleanup(func() { logseqEditorServices.Snapshot = previous })
			source, anchor, caret := "a😀z", 1, 5
			logseqEditorServices.Snapshot = func(string) (string, int, int, bool) { return source, anchor, caret, true }
			var events []luimygo.Event
			input := &logseqEditorInput{emit: func(event luimygo.Event) {
				events = append(events, event)
				if event.Name == "composition" && event.Values["state"] == "end" {
					source = "a" + event.Values["text"].(string) + "z"
					anchor, caret = len(source)-1, len(source)-1
				}
				if event.Name == "pointer" {
					anchor, caret = event.Values["offset"].(int), event.Values["offset"].(int)
				}
			}}
			input.SetMarkedText(nil, "中😀文", ui.TextInputRange{Start: 4, End: 4})
			r := tc.rangeToReplace
			input.ReplaceText(&r, tc.replacement)
			input.UnmarkText()
			if _, marked := input.MarkedRange(); marked {
				t.Fatal("committed preedit remains marked")
			}
			if len(events) != 4 || events[0].Values["state"] != "start" || events[1].Values["state"] != "update" || events[2].Values["state"] != "end" || events[2].Values["text"] != tc.want || events[3].Name != "pointer" {
				t.Fatalf("partial commit must reach OCaml once with complete text %q: %+v", tc.want, events)
			}
			if source != "a"+tc.want+"z" || input.Selection().Range != (ui.TextInputRange{Start: tc.wantCaret, End: tc.wantCaret}) {
				t.Fatalf("committed source or caret after partial replacement: %q %+v, want caret %d", source, input.Selection(), tc.wantCaret)
			}
		})
	}
}

func TestNativeEditorBlurCancelsPreedit(t *testing.T) {
	previous := logseqEditorServices.Snapshot
	t.Cleanup(func() { logseqEditorServices.Snapshot = previous })
	logseqEditorServices.Snapshot = func(string) (string, int, int, bool) { return "a中z", 1, 1, true }
	var events []luimygo.Event
	input := &logseqEditorInput{mounted: true, focused: true, emit: func(event luimygo.Event) { events = append(events, event) }}
	input.SetMarkedText(nil, "zhong", ui.TextInputRange{Start: 5, End: 5})
	input.setFocused(false)
	input.ReplaceText(nil, "中")
	input.UnmarkText()
	if _, marked := input.MarkedRange(); marked {
		t.Fatal("blur left cancelled preedit marked")
	}
	if len(events) != 3 || events[0].Values["state"] != "start" || events[1].Values["state"] != "update" || events[2].Name != "blur" {
		t.Fatalf("blur must cancel preedit in OCaml and ignore late native input: %+v", events)
	}
}

func TestNativeEditorPartialMarkedSelection(t *testing.T) {
	previous := logseqEditorServices.Snapshot
	t.Cleanup(func() { logseqEditorServices.Snapshot = previous })
	logseqEditorServices.Snapshot = func(string) (string, int, int, bool) { return "a😀z", 1, 5, true }
	var events []luimygo.Event
	input := &logseqEditorInput{emit: func(event luimygo.Event) { events = append(events, event) }}
	input.SetMarkedText(nil, "中😀文", ui.TextInputRange{Start: 2, End: 1})
	if got := input.Selection().Range; got != (ui.TextInputRange{Start: 2, End: 2}) {
		t.Fatalf("selection must not land inside an emoji surrogate: %+v", got)
	}
	r := ui.TextInputRange{Start: 2, End: 4}
	input.SetMarkedText(&r, "好", ui.TextInputRange{Start: 1, End: 0})
	marked, ok := input.MarkedRange()
	if !ok || marked != (ui.TextInputRange{Start: 1, End: 4}) || input.Selection().Range != (ui.TextInputRange{Start: 2, End: 3}) {
		t.Fatalf("partial marked update lost its range or selected subrange: %+v %+v %v", marked, input.Selection(), ok)
	}
	if len(events) != 3 || events[0].Values["state"] != "start" || events[1].Values["text"] != "中😀文" || events[2].Values["text"] != "中好文" {
		t.Fatalf("partial marked update must remain transient in OCaml: %+v", events)
	}
}
