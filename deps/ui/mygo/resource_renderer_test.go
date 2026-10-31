//go:build darwin || linux

package main

import (
	"encoding/json"
	"errors"
	"net/url"
	"testing"
	"time"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

func TestGraphAssetIdentityOverridesRetainedSource(t *testing.T) {
	s := newPlatformServices(nil)
	backend := luimygo.New(luimygo.Config{Extensions: s.extensions()})
	defer backend.Close()
	attrs := `{"src":"/old-graph/assets/image.png","data-asset-file":"image.png"}`
	if err := backend.ApplyBatch(luimygo.Batch{Generation: 1, Ops: []luimygo.Operation{
		{Op: "create-extension", ID: 1, Identifier: "logseq-img"},
		{Op: "set-extension-prop", ID: 1, Property: "attrs", Value: attrs},
	}}); err != nil {
		t.Fatal(err)
	}
	r := newResourceRenderer(backend)
	defer r.Close()
	graph := "/new-graph"
	r.ResolveAsset = func(filename string) (string, error) { return graph + "/assets/" + filename, nil }
	n, _ := backend.Node(1)
	for _, dir := range []string{"/new-graph", "/third-graph"} {
		graph = dir
		source, err := r.source(n)
		if err != nil || source.kind != "file" || source.value != dir+"/assets/image.png" {
			t.Fatalf("graph asset source = %#v, %v; want current graph %s", source, err, dir)
		}
	}
	r.ResolveAsset = func(string) (string, error) { return "", errors.New("graph closed") }
	if _, err := r.source(n); err == nil {
		t.Fatal("failed graph resolution fell back to a stale src")
	}
}

func TestResourcesBelongToCommittedPresentation(t *testing.T) {
	s := newPlatformServices(nil)
	s.backend = luimygo.New(luimygo.Config{Extensions: s.extensions()})
	defer s.backend.Close()
	s.resources = newResourceRenderer(s.backend)
	defer s.resources.Close()
	s.mutations = newDOMMutationRenderer(s)
	s.resources.Project = s.mutations.BindDOMMutations
	attrs, err := json.Marshal(map[string]string{"src": "data:image/svg+xml," + url.PathEscape(`<svg width="12" height="8"><rect width="12" height="8" fill="red"/></svg>`)})
	if err != nil {
		t.Fatal(err)
	}
	batch := luimygo.Batch{Generation: 1, Ops: []luimygo.Operation{
		{Op: "create-extension", ID: 1, Identifier: "logseq-div"},
		{Op: "create-extension", ID: 2, Identifier: "logseq-img"},
		{Op: "set-extension-prop", ID: 2, Property: "attrs", Value: string(attrs)},
		{Op: "insert-child", Parent: 1, Child: 2, Index: 0},
	}}
	if err := s.backend.ApplyBatch(batch); err != nil {
		t.Fatal(err)
	}
	s.AppliedBatch(batch, false)
	probeEvents := 0
	tester := ui.NewTester(func(c *ui.Context) {
		s.resources.BeginView(c)
		c.Fitting(false, []func(*ui.Context){func(probe *ui.Context) {
			n, _ := s.backend.Node(2)
			s.resources.Render(probe, n, "img", nil, func(luimygo.Event) { probeEvents++ })
		}}, func(committed *ui.Context, _ int) { s.backend.View(committed) })
	}, 100, 100)
	deadline := time.Now().Add(3 * time.Second)
	for {
		tester.Frame()
		width, height, ready := s.resources.NaturalSize(2)
		if ready {
			if width != 12 || height != 8 {
				t.Fatalf("decoded dimensions = %g x %g; want 12 x 8", width, height)
			}
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("resource rendered during final fitting layout did not load")
		}
		time.Sleep(time.Millisecond)
	}
	if err := s.mutations.HandleDOMMutation("set-text-content", json.RawMessage(`{"ref":{"node-id":1},"text":"replacement"}`)); err != nil {
		t.Fatal(err)
	}
	tester.Frame()
	if _, exists := s.backend.Node(2); !exists {
		t.Fatal("presentation override removed the retained document node")
	}
	if _, _, ready := s.resources.NaturalSize(2); ready || len(s.resources.cache) != 0 {
		t.Fatal("unpresented retained resource or measurement probe kept decoded resources alive")
	}
	tester.Frame()
	if len(s.resources.cache) != 0 || probeEvents != 0 {
		t.Fatalf("probe acquired resources or emitted events: cache entries=%d, events=%d", len(s.resources.cache), probeEvents)
	}
}
