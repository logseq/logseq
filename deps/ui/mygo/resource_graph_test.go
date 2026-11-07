package main

import (
	"testing"

	luimygo "github.com/logseq/lui/platform/mygo"
)

func TestResourceGraphOwnership(t *testing.T) {
	r := newResourceRenderer(nil)
	defer r.Close()
	node := func(attrs string) luimygo.Node {
		return luimygo.Node{Identifier: "logseq-img", Props: map[string]any{"attrs": attrs}}
	}
	asset := node(`{"src":"/old/assets/image.png","data-asset-file":"image.png"}`)
	for _, graph := range []string{"first", "second"} {
		if err := r.InstallGraphContext(`{"graph":"` + graph + `","graph-dir":"/graphs/` + graph + `","asset-dir":"/graphs/` + graph + `/assets"}`); err != nil {
			t.Fatal(err)
		}
		for _, n := range []luimygo.Node{asset, node(`{"src":"assets/image.png"}`), node(`{"src":"../assets/image.png"}`)} {
			source, err := r.source(n)
			if err != nil || source != (resourceSource{"file", "/graphs/" + graph + "/assets/image.png"}) {
				t.Fatalf("graph %s source = %#v, %v", graph, source, err)
			}
		}
		for _, src := range []string{"../../other/image.png", "../assets/../../other/image.png", "assets/%2e%2e/%2e%2e/other.png", "javascript:alert(1)", "//remote/image.png"} {
			if _, err := r.source(node(`{"src":"` + src + `"}`)); err == nil {
				t.Fatalf("graph source escaped ownership: %s", src)
			}
		}
	}
	for _, payload := range []string{`{}`, `{"graph":"broken","graph-dir":"relative","asset-dir":"relative/assets"}`} {
		if err := r.InstallGraphContext(payload); err == nil {
			t.Fatalf("invalid context admitted: %s", payload)
		}
	}
	if err := r.InstallGraphContext(`{"graph":"","graph-dir":"","asset-dir":""}`); err != nil {
		t.Fatal(err)
	}
	for _, n := range []luimygo.Node{asset, node(`{"src":"assets/image.png"}`)} {
		if _, err := r.source(n); err == nil {
			t.Fatal("closed graph resolved a graph image")
		}
	}
	if source, err := r.source(node(`{"src":"https://example.org/image.png"}`)); err != nil || source.kind != "url" {
		t.Fatalf("graph close broke external image: %#v, %v", source, err)
	}
}
