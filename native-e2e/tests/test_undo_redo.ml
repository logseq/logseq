open Test_editor_basic

let tests =
  [ Suite.test
      ~covers:["ocaml-e2e/test/test_undo_redo.ml::undo-latest-saved-block-content-once"]
      "undo-latest-saved-block-content-once" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let page = "Native Undo Saved Content" in
            create_page app page;
            type_block app "b1";
            let uuid = editing_uuid app in
            Unix.sleepf 2.;
            move_to_end app;
            String.iter (fun c -> Client.text app (String.make 1 c); Unix.sleepf 0.02) " new text";
            wait_value app "b1 new text";
            wait_saved app uuid "b1 new text";
            Suite.equal ctx "The appended content reached the daemon before undo"
              (block_title app uuid) (Wire.Set [Wire.Array [Wire.String "b1 new text"]]);
            Unix.sleepf 1.;
            Client.press app "Mod+z";
            Client.press app "Escape";
            wait_no_editor app;
            wait_titles app ["b1"];
            wait_tree app page [Node ("b1", [])];
            Suite.equal ctx "Exactly one undo restores the saved content"
              (visible_titles app) ["b1"];
            Suite.equal ctx "Undo restores one persisted block, not deletion or duplicates"
              (worker_tree app page) [Node ("b1", [])];
            Suite.equal ctx "The original block UUID survives the undo"
              (block_title app uuid) (Wire.Set [Wire.Array [Wire.String "b1"]]);
            Test_outliner_basic.validate_graph ctx app;
            ignore (Client.screenshot app ~name:"undo-restored.png"))) ]
