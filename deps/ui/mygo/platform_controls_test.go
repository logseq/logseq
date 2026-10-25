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
