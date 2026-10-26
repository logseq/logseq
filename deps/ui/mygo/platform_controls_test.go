//go:build darwin || linux

package main

import (
	"encoding/json"
	"testing"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

func TestPlatformRequestsDoNotCrossNodeIncarnations(t *testing.T) {
	s := newPlatformServices(nil)
	s.backend = luimygo.New(luimygo.Config{Extensions: s.extensions()})
	defer s.backend.Close()
	apply := func(batch luimygo.Batch) {
		t.Helper()
		encoded, err := json.Marshal(batch)
		if err != nil {
			t.Fatal(err)
		}
		if err := s.backend.ApplyJSON(encoded, false); err != nil {
			t.Fatal(err)
		}
		s.AppliedBatch(batch, false)
	}
	if _, err := s.Handle("dom-op\nscroll-height\n{\"block-id\":\"block\"}"); err != nil {
		t.Fatal(err)
	}
	apply(luimygo.Batch{Generation: 1, Ops: []luimygo.Operation{
		{Op: "create-extension", ID: 1, Identifier: "logseq-editor"},
		{Op: "set-extension-prop", ID: 1, Property: "block-id", Value: "block"},
	}})
	if _, err := s.AfterFrame(nil); err != nil {
		t.Fatal(err)
	}
	apply(luimygo.Batch{Generation: 2, Ops: []luimygo.Operation{
		{Op: "drop-node", ID: 1},
		{Op: "create-extension", ID: 1, Identifier: "logseq-editor"},
		{Op: "set-extension-prop", ID: 1, Property: "block-id", Value: "block"},
	}})
	s.EditorDOM = func(_ *ui.Context, op string, _ json.RawMessage) ([]platformReply, error) {
		return platformJSONReply(op, map[string]any{"block-id": "block", "height": 120})
	}
	replies, err := s.AfterFrame(nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(replies) != 0 {
		t.Fatalf("obsolete request answered with replacement editor geometry: %#v", replies)
	}
}

func TestEditorCaretQueryResolvesAfterMount(t *testing.T) {
	previous := logseqEditorServices.Snapshot
	t.Cleanup(func() { logseqEditorServices.Snapshot = previous })
	logseqEditorServices.Snapshot = func(string) (string, int, int, bool) { return "", 0, 0, true }
	s := newPlatformServices(nil)
	s.backend = luimygo.New(luimygo.Config{Extensions: s.extensions()})
	defer s.backend.Close()
	defer s.CloseEditor()
	s.EditorDOM = func(c *ui.Context, op string, body json.RawMessage) ([]platformReply, error) {
		if _, err := s.EditorRequest(op, string(body)); err != nil {
			return nil, err
		}
		return s.EditorAfterFrame(c)
	}
	if _, err := s.Handle("dom-op\ncaret-rect\n{\"block-id\":\"block\",\"offset\":0}"); err != nil {
		t.Fatal(err)
	}
	var replies []platformReply
	tester := ui.NewTester(func(c *ui.Context) {
		s.backend.View(c)
		c.AfterFrame(func() {
			result, err := s.AfterFrame(c)
			if err != nil {
				t.Fatal(err)
			}
			replies = append(replies, result...)
		})
	}, 320, 100)
	tester.Frame()
	if len(replies) != 0 {
		t.Fatal("unmounted editor answered with fabricated geometry")
	}
	batch := luimygo.Batch{Generation: 1, Ops: []luimygo.Operation{
		{Op: "create-node", ID: 1, Kind: "column"},
		{Op: "set-prop", ID: 1, Property: "style-class", Value: "block-editor"},
		{Op: "create-node", ID: 2, Kind: "text"},
		{Op: "set-prop", ID: 2, Property: "style-class", Value: "ed-r"},
		{Op: "set-prop", ID: 2, Property: "text", Value: "\u200b"},
		{Op: "create-extension", ID: 3, Identifier: "logseq-editor"},
		{Op: "set-extension-prop", ID: 3, Property: "block-id", Value: "block"},
		{Op: "set-extension-prop", ID: 3, Property: "runs", Value: "0,0,z"},
		{Op: "insert-child", Parent: 1, Child: 2, Index: 0},
		{Op: "insert-child", Parent: 1, Child: 3, Index: 1},
	}}
	if err := s.backend.ApplyBatch(batch); err != nil {
		t.Fatal(err)
	}
	s.AppliedBatch(batch, false)
	tester.Frame()
	if err := s.backend.Err(); err != nil {
		t.Fatal(err)
	}
	if len(replies) != 1 || replies[0].Name != "caret-rect" {
		t.Fatalf("mounted editor did not answer pending caret query: %#v", replies)
	}
	var caret struct {
		Block  string  `json:"block-id"`
		Offset int     `json:"offset"`
		Height float32 `json:"h"`
	}
	if err := json.Unmarshal([]byte(replies[0].Payload), &caret); err != nil {
		t.Fatal(err)
	}
	if caret.Block != "block" || caret.Offset != 0 || caret.Height <= 0 {
		t.Fatalf("caret query did not use the mounted empty editor's text geometry: %+v", caret)
	}
}
