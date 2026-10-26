//go:build darwin || linux

package main

import (
	"encoding/json"
	"testing"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

func TestRawViewportContractUsesCommittedPresentation(t *testing.T) {
	s := newPlatformServices(nil)
	var events []luimygo.Event
	s.backend = luimygo.New(luimygo.Config{Extensions: s.extensions(), Dispatch: func(e luimygo.Event) error {
		events = append(events, e)
		return nil
	}})
	defer s.backend.Close()
	s.resources = newResourceRenderer(s.backend)
	defer s.resources.Close()
	s.mutations = newDOMMutationRenderer(s)
	var generation int64
	apply := func(ops ...luimygo.Operation) {
		t.Helper()
		generation++
		batch := luimygo.Batch{Generation: generation, Ops: ops}
		if err := s.backend.ApplyBatch(batch); err != nil {
			t.Fatal(err)
		}
		s.AppliedBatch(batch, false)
	}
	row := func(id int64, key string) []luimygo.Operation {
		return []luimygo.Operation{
			{Op: "create-extension", ID: id, Identifier: "logseq-div"},
			{Op: "set-extension-prop", ID: id, Property: "attrs", Value: `{"data-lazy-mount":"` + key + `"}`},
			{Op: "set-extension-prop", ID: id, Property: "events", Value: "lazy-mount lazy-unmount"},
			{Op: "set-extension-prop", ID: id, Property: "height", Value: "40"},
			{Op: "set-extension-prop", ID: id, Property: "width", Value: "200"},
		}
	}
	apply(
		luimygo.Operation{Op: "create-node", ID: 1, Kind: "view-that-fits"},
		luimygo.Operation{Op: "create-node", ID: 2, Kind: "scroll"},
		luimygo.Operation{Op: "set-prop", ID: 2, Property: "width", Value: 200},
		luimygo.Operation{Op: "set-prop", ID: 2, Property: "height", Value: 120},
		luimygo.Operation{Op: "insert-child", Parent: 1, Child: 2, Index: 0},
		luimygo.Operation{Op: "create-extension", ID: 3, Identifier: "logseq-div"},
		luimygo.Operation{Op: "set-extension-prop", ID: 3, Property: "attrs", Value: `{"data-virt-count":"2"}`},
		luimygo.Operation{Op: "set-extension-prop", ID: 3, Property: "events", Value: "virt-end lazy-mount"},
		luimygo.Operation{Op: "insert-child", Parent: 2, Child: 3, Index: 0},
	)
	apply(row(4, "first")...)
	apply(
		luimygo.Operation{Op: "insert-child", Parent: 3, Child: 4, Index: 0},
		luimygo.Operation{Op: "create-node", ID: 5, Kind: "box"},
		luimygo.Operation{Op: "set-prop", ID: 5, Property: "height", Value: 2000},
		luimygo.Operation{Op: "insert-child", Parent: 3, Child: 5, Index: 1},
	)
	apply(row(6, "last")...)
	apply(luimygo.Operation{Op: "insert-child", Parent: 3, Child: 6, Index: 2})
	apply(row(8, "probe-only")...)
	apply(
		luimygo.Operation{Op: "set-extension-prop", ID: 8, Property: "width", Value: "500"},
		luimygo.Operation{Op: "insert-child", Parent: 1, Child: 8, Index: 0},
	)
	count := func(id int64, name string) int {
		t.Helper()
		n := 0
		for _, e := range events {
			if e.Node == id && e.Name == "dom-event" && e.Values["name"] == name {
				n++
				if name == "lazy-unmount" {
					measured := float32(40)
					if id == 4 {
						measured = 72
					}
					var payload struct{ Height float32 }
					if err := json.Unmarshal([]byte(e.Values["payload"].(string)), &payload); err != nil || payload.Height != measured {
						t.Fatalf("unmount must preserve the measured row extent: %+v, %v", e, err)
					}
				}
			}
		}
		return n
	}
	mounts := func(key string) int {
		t.Helper()
		n := 0
		for _, e := range events {
			if e.Name != "dom-event" || e.Values["name"] != "lazy-mount" {
				continue
			}
			var payload struct {
				NodeID int64 `json:"nodeId"`
				UUIDs  []string
			}
			if err := json.Unmarshal([]byte(e.Values["payload"].(string)), &payload); err != nil || e.Node != 3 || payload.NodeID != 3 || len(payload.UUIDs) == 0 {
				t.Fatalf("lazy rows must batch UUIDs to their owning container: %+v, %v", e, err)
			}
			for _, uuid := range payload.UUIDs {
				if uuid == key {
					n++
				}
			}
		}
		return n
	}
	retire := false
	tester := ui.NewTester(func(c *ui.Context) {
		replacing := retire
		if retire {
			retire = false
			c.AfterFrame(func() {
				apply(luimygo.Operation{Op: "remove-child", Parent: 4, Child: 7}, luimygo.Operation{Op: "drop-node", ID: 7})
				apply(luimygo.Operation{Op: "remove-child", Parent: 3, Child: 4})
				apply(luimygo.Operation{Op: "drop-node", ID: 4})
				apply(row(4, "replacement")...)
				apply(luimygo.Operation{Op: "insert-child", Parent: 3, Child: 4, Index: 0})
			})
		}
		s.View(c)
		if replacing {
			c.AfterFrame(func() {
				if mounts("first") != 0 {
					t.Fatal("a discarded row incarnation emitted a viewport entry")
				}
			})
		}
	}, 200, 120)
	tester.Frame()
	if mounts("first") != 1 || mounts("last") != 0 || count(3, "virt-end") != 0 || count(8, "lazy-mount") != 0 {
		t.Fatalf("committed fitting rows must enter only the real viewport band; events=%+v", events)
	}
	tester.Frame()
	if mounts("first") != 1 {
		t.Fatal("stationary rows repeated lazy-mount")
	}
	apply(
		luimygo.Operation{Op: "set-extension-prop", ID: 4, Property: "height", Value: "auto"},
		luimygo.Operation{Op: "create-node", ID: 7, Kind: "box"},
		luimygo.Operation{Op: "set-prop", ID: 7, Property: "height", Value: 72},
		luimygo.Operation{Op: "insert-child", Parent: 4, Child: 7, Index: 0},
	)
	if err := s.backend.ScrollTo(2, 0, 1900); err != nil {
		t.Fatal(err)
	}
	tester.Frame()
	if count(4, "lazy-unmount") != 1 || mounts("last") != 1 || count(3, "virt-end") != 1 {
		t.Fatalf("scrolling must leave, enter and paginate using committed clip bounds: %+v", events)
	}
	if err := s.backend.ScrollTo(2, 0, 1880); err != nil {
		t.Fatal(err)
	}
	tester.Frame()
	if count(3, "virt-end") != 1 || count(4, "lazy-unmount") != 1 {
		t.Fatal("unchanged content must not repeatedly paginate or unmount while scrolling inside the same band")
	}
	apply(luimygo.Operation{Op: "set-prop", ID: 5, Property: "height", Value: 2040})
	tester.Frame()
	if count(3, "virt-end") != 2 {
		t.Fatal("a growing list end must request the next page")
	}
	if err := s.backend.ScrollTo(2, 0, 0); err != nil {
		t.Fatal(err)
	}
	events = nil
	retire = true
	tester.Frame()
	tester.Frame()
	if mounts("replacement") != 1 {
		t.Fatal("a replacement row failed to receive its own viewport entry")
	}
	if err := s.mutations.HandleDOMMutation("set-text-content", json.RawMessage(`{"ref":{"node-id":3},"text":"replacement"}`)); err != nil {
		t.Fatal(err)
	}
	events = nil
	tester.Frame()
	if _, retained := s.backend.Node(4); !retained || mounts("replacement") != 0 || count(4, "lazy-unmount") != 0 {
		t.Fatal("projection-suppressed retained rows emitted viewport events")
	}
}
