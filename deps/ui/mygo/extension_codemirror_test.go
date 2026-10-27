package main

import "testing"

func TestCodeMirrorControlledAuthorityAndDraftIsolation(t *testing.T) {
	var state codeMirrorTextState
	state.reconcile("block", "first", "initial")
	changes := 0
	state.editor.OnChange = func(string) { changes++ }
	state.editor.Insert("你😀\n")
	draft := state.editor.Buffer.String()
	state.reconcile("block", "first", "initial")
	state.reconcile("block", "first", draft)
	if state.editor.Buffer.String() != draft || !state.editor.Buffer.CanUndo() || changes != 1 {
		t.Fatal("model echo replaced a local edit or its history")
	}
	state.reconcile("block", "first", "remote")
	if state.editor.Buffer.String() != "remote" || state.editor.Buffer.CanUndo() || changes != 1 {
		t.Fatal("authoritative replacement leaked a user edit or retained stale history")
	}
	state.reconcile("query", "", "query")
	state.editor.Insert("draft ")
	draft = state.editor.Buffer.String()
	state.focused = true
	state.reconcile("query", "", "older evaluation")
	if state.editor.Buffer.String() != draft {
		t.Fatal("focused query draft was replaced by an evaluation snapshot")
	}
	state.reconcile("block", "second", "second block")
	if state.editor.Buffer.String() != "second block" || state.editor.Buffer.CanUndo() || state.focused {
		t.Fatal("query state leaked across a role and UUID change")
	}
	state.reconcile("block", "third", "third block")
	if state.editor.Buffer.String() != "third block" {
		t.Fatal("block text leaked across a UUID change")
	}
}
