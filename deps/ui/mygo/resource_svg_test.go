//go:build darwin || linux

package main

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

func TestRetainedSVGStopsPaintingRemovedLeaves(t *testing.T) {
	s := newPlatformServices(nil)
	s.backend = luimygo.New(luimygo.Config{Extensions: s.extensions()})
	defer s.backend.Close()
	s.resources = newResourceRenderer(s.backend)
	defer s.resources.Close()
	s.mutations = newDOMMutationRenderer(s)
	s.resources.Project = s.mutations.BindDOMMutations
	batch := luimygo.Batch{Generation: 1, Ops: []luimygo.Operation{
		{Op: "create-extension", ID: 1, Identifier: "logseq-svg"},
		{Op: "set-extension-prop", ID: 1, Property: "attrs", Value: `{"width":"20","height":"20"}`},
		{Op: "create-extension", ID: 2, Identifier: "logseq-path"},
		{Op: "set-extension-prop", ID: 2, Property: "attrs", Value: `{"d":"M0 0H20V20H0Z","fill":"#ff0000"}`},
		{Op: "insert-child", Parent: 1, Child: 2, Index: 0},
	}}
	if err := s.backend.ApplyBatch(batch); err != nil {
		t.Fatal(err)
	}
	s.AppliedBatch(batch, false)
	tester := ui.NewTester(func(c *ui.Context) {
		s.resources.BeginView(c)
		ui.Column(c).Background(ui.Hex("#ffffff")).Children(func() { s.backend.View(c) })
	}, 40, 40)
	wait := func() {
		t.Helper()
		deadline := time.Now().Add(3 * time.Second)
		for {
			_, _, decoded := s.resources.NaturalSize(1)
			tester.Frame()
			if decoded {
				return
			}
			if time.Now().After(deadline) {
				t.Fatal("retained SVG did not decode")
			}
			time.Sleep(time.Millisecond)
		}
	}
	redVisible := func() bool {
		pixels := tester.Image()
		for y := pixels.Bounds().Min.Y; y < pixels.Bounds().Max.Y; y++ {
			for x := pixels.Bounds().Min.X; x < pixels.Bounds().Max.X; x++ {
				pixel := pixels.RGBAAt(x, y)
				if pixel.R > 200 && pixel.G < 50 && pixel.B < 50 && pixel.A > 200 {
					return true
				}
			}
		}
		return false
	}
	wait()
	if !redVisible() {
		t.Fatal("visible SVG path was not painted")
	}
	if err := s.mutations.HandleDOMMutation("remove", json.RawMessage(`{"ref":{"node-id":2}}`)); err != nil {
		t.Fatal(err)
	}
	wait()
	if _, exists := s.backend.Node(2); !exists {
		t.Fatal("presentation removal deleted the retained SVG node")
	}
	if redVisible() {
		t.Fatal("removed SVG leaf remained painted from the retained resource")
	}
}
