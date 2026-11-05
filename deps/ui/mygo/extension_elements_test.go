//go:build darwin || linux

package main

import (
	"testing"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

func TestRawInlineTextPreservesContentAndHostIdentity(t *testing.T) {
	s := newPlatformServices(nil)
	s.backend = luimygo.New(luimygo.Config{Extensions: s.extensions()})
	defer s.backend.Close()
	batch := luimygo.Batch{Generation: 1, Ops: []luimygo.Operation{
		{Op: "create-node", ID: 10, Kind: "column"},
		{Op: "create-node", ID: 1, Kind: "text"},
		{Op: "set-prop", ID: 1, Property: "text", Value: "Before "},
		{Op: "create-extension", ID: 2, Identifier: "logseq-b"},
		{Op: "set-extension-prop", ID: 2, Property: "orientation", Value: "horizontal"},
		{Op: "set-extension-prop", ID: 2, Property: "attrs", Value: `{"style":"font-weight:bolder"}`},
		{Op: "create-node", ID: 3, Kind: "text"},
		{Op: "set-prop", ID: 3, Property: "font-weight", Value: 700},
		{Op: "create-node", ID: 4, Kind: "text"},
		{Op: "set-prop", ID: 4, Property: "text", Value: "bold"},
		{Op: "create-node", ID: 5, Kind: "text"},
		{Op: "set-prop", ID: 5, Property: "text", Value: ` E = mc^2`},
		{Op: "create-extension", ID: 11, Identifier: "logseq-span"},
		{Op: "create-extension", ID: 6, Identifier: "logseq-a"},
		{Op: "set-extension-prop", ID: 6, Property: "orientation", Value: "horizontal"},
		{Op: "create-node", ID: 7, Kind: "row"},
		{Op: "create-extension", ID: 12, Identifier: "logseq-span"},
		{Op: "create-node", ID: 8, Kind: "row"},
		{Op: "create-node", ID: 9, Kind: "text"},
		{Op: "set-prop", ID: 9, Property: "text", Value: "Layout action"},
		{Op: "insert-child", Parent: 10, Child: 1, Index: 0},
		{Op: "insert-child", Parent: 1, Child: 11, Index: 0},
		{Op: "insert-child", Parent: 11, Child: 2, Index: 0},
		{Op: "insert-child", Parent: 2, Child: 3, Index: 0},
		{Op: "insert-child", Parent: 3, Child: 4, Index: 0},
		{Op: "insert-child", Parent: 1, Child: 5, Index: 1},
		{Op: "insert-child", Parent: 10, Child: 6, Index: 1},
		{Op: "insert-child", Parent: 6, Child: 7, Index: 0},
		{Op: "insert-child", Parent: 7, Child: 12, Index: 0},
		{Op: "insert-child", Parent: 12, Child: 8, Index: 0},
		{Op: "insert-child", Parent: 8, Child: 9, Index: 0},
	}}
	if err := s.backend.ApplyBatch(batch); err != nil {
		t.Fatal(err)
	}
	var bounds ui.Rect
	tester := ui.NewTester(func(c *ui.Context) {
		s.backend.View(c)
		c.AfterFrame(func() {
			var ok bool
			bounds, ok = s.backend.Bounds(c, 2)
			if !ok {
				t.Fatal("inline emphasis lost its committed host identity")
			}
		})
	}, 400, 100)
	tester.Frame()
	if err := s.backend.Err(); err != nil {
		t.Fatal(err)
	}
	if !tester.HasText("Before bold E = mc^2") {
		t.Fatalf("inline content and TeX source must share the paragraph: %q", tester.Texts())
	}
	if !tester.HasText("Layout action") {
		t.Fatalf("a standalone anchor must preserve layout children: %q", tester.Texts())
	}
	paragraph, ok := tester.Find("Before bold E = mc^2")
	if !ok || bounds.X < paragraph.X || bounds.X+bounds.W > paragraph.X+paragraph.W || bounds.Y != paragraph.Y {
		t.Fatalf("inline host bounds must belong to the paragraph: inline=%+v paragraph=%+v", bounds, paragraph)
	}
}
