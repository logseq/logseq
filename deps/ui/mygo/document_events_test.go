//go:build darwin || linux

package main

import (
	"encoding/json"
	"testing"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

func TestDocumentEscapeDismissesPopupBeforeOuterModal(t *testing.T) {
	outerOpen, popupOpen := true, true
	var backend *luimygo.Backend
	var generation int64
	apply := func(ops ...luimygo.Operation) {
		t.Helper()
		generation++
		if err := backend.ApplyBatch(luimygo.Batch{Generation: generation, Ops: ops}); err != nil {
			t.Fatal(err)
		}
	}
	backend = luimygo.New(luimygo.Config{Dispatch: func(event luimygo.Event) error {
		if event.Kind == "dismiss" && event.Node == 4 {
			popupOpen = false
			apply(luimygo.Operation{Op: "detach-subtree", ID: 4})
		}
		return nil
	}})
	defer backend.Close()
	apply(
		luimygo.Operation{Op: "create-node", ID: 1, Kind: "column"},
		luimygo.Operation{Op: "create-node", ID: 2, Kind: "dialog"},
		luimygo.Operation{Op: "insert-child", Parent: 1, Child: 2, Index: 0},
		luimygo.Operation{Op: "create-node", ID: 3, Kind: "button"},
		luimygo.Operation{Op: "set-prop", ID: 3, Property: "text", Value: "Outer action"},
		luimygo.Operation{Op: "insert-child", Parent: 2, Child: 3, Index: 0},
		luimygo.Operation{Op: "create-node", ID: 4, Kind: "popover"},
		luimygo.Operation{Op: "set-prop", ID: 4, Property: "x", Value: 200},
		luimygo.Operation{Op: "set-prop", ID: 4, Property: "y", Value: 150},
		luimygo.Operation{Op: "insert-child", Parent: 2, Child: 4, Index: 1},
		luimygo.Operation{Op: "create-node", ID: 5, Kind: "button"},
		luimygo.Operation{Op: "set-prop", ID: 5, Property: "text", Value: "Popup action"},
		luimygo.Operation{Op: "insert-child", Parent: 4, Child: 5, Index: 0},
	)
	document := NewDocumentEvents(backend, func(name, payload string) bool {
		var event struct{ Key string }
		if err := json.Unmarshal([]byte(payload), &event); err != nil {
			t.Fatal(err)
		}
		if name == "keydown" && event.Key == "Escape" {
			outerOpen = false
		}
		return false
	}, func(*ui.Context, luimygo.InputNode) codeMirrorComposition { return codeMirrorComposition{} })
	tester := ui.NewTester(func(context *ui.Context) {
		backend.View(context)
		document.Capture(context)
	}, 700, 500)
	if err := tester.Click("Popup action"); err != nil {
		t.Fatal(err)
	}
	tester.Key(0, ui.KeyEscape)
	if popupOpen || !outerOpen {
		t.Fatalf("first Escape must dismiss only the popup: popup=%v outer=%v", popupOpen, outerOpen)
	}
	tester.Frame()
	tester.Key(0, ui.KeyEscape)
	if outerOpen {
		t.Fatal("Escape after popup removal did not reach the outer document owner")
	}
}
