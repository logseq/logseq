open Test_editor_basic

let validate_graph ctx app =
  let result = Client.validate app in
  Suite.equal ctx "Graph validation reports no errors without repair"
    (Wire.get result "errors") (Some Wire.Nil);
  Suite.equal ctx "Graph validation reports no invalid entities"
    (Wire.get result "invalid-entity-ids") (Some (Wire.Array []))

let block_x app title =
  let el = Client.wait_for ~text:title app ".ls-page-blocks .block-title-wrap"
      |> List.find (fun el -> Client.text_content el = title) in
  (Client.rect el).x

let editor_x app =
  let el = Client.wait_for app ".block-editor" |> List.hd in
  (Client.rect el).x

let indent_outdent ctx app ~indent =
  wait_focus app;
  let uuid = editing_uuid app in
  let before = editor_x app in
  Client.press app (if indent then "Tab" else "Shift+Tab");
  ignore (Client.poll "editor moved by indent/outdent" (fun () ->
      match Client.query app ".block-editor" with
      | [el] ->
        let after = (Client.rect el).x in
        if (if indent then before < after else before > after) then Some () else None
      | _ -> None));
  Suite.check ctx "Indent/outdent moves the editor in the correct direction"
    (if indent then before < editor_x app else before > editor_x app);
  Suite.equal ctx "Indent/outdent retains the edited block" (editing_uuid app) uuid;
  wait_focus app

let exit app = Client.press app "Escape"; wait_no_editor app

let arrow_up_to app expected =
  Client.press app "Up";
  wait_value app expected;
  wait_focus app

let tests =
  [ Suite.test
      ~covers:["ocaml-e2e/test/test_outliner_basic.ml::create-test-page-and-insert-blocks-test"]
      "create-test-page-and-insert-blocks-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let page = "Native Create And Insert" in
            create_page app page;
            Suite.equal ctx "Fresh page has its title and one editable block"
              (List.length (Client.query app ".ls-block:not(.block-add-button)")) 2;
            wait_tree app page [Node ("", [])];
            Suite.equal ctx "Fresh page has exactly one empty persisted block"
              (worker_tree app page) [Node ("", [])];
            type_block app "first block";
            append_block app "second block";
            exit app;
            wait_titles app ["first block"; "second block"];
            wait_tree app page [Node ("first block", []); Node ("second block", [])];
            Suite.equal ctx "Insertion leaves the page title plus two blocks"
              (List.length (Client.query app ".ls-block:not(.block-add-button)")) 3;
            Suite.equal ctx "Both inserted titles render in order"
              (visible_titles app) ["first block"; "second block"];
            Suite.equal ctx "Both blocks persist as ordered siblings"
              (worker_tree app page) [Node ("first block", []); Node ("second block", [])];
            validate_graph ctx app;
            ignore (Client.screenshot app ~name:"created-blocks.png")));
    Suite.test
      ~covers:["ocaml-e2e/test/test_outliner_basic.ml::indent-and-outdent-test"]
      "indent-and-outdent-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let page = "Native Indent And Outdent" in
            create_page app page;
            type_block app "b1";
            append_block app "b2";
            indent_outdent ctx app ~indent:true;
            wait_tree app page [Node ("b1", [Node ("b2", [])])];
            Suite.equal ctx "First indent reparents b2 under b1"
              (worker_tree app page) [Node ("b1", [Node ("b2", [])])];
            indent_outdent ctx app ~indent:false;
            wait_tree app page [Node ("b1", []); Node ("b2", [])];
            Suite.equal ctx "Outdent restores two ordered root blocks"
              (worker_tree app page) [Node ("b1", []); Node ("b2", [])];
            append_block app "b3";
            indent_outdent ctx app ~indent:true;
            arrow_up_to app "b2";
            indent_outdent ctx app ~indent:true;
            exit app;
            wait_titles app ["b1"; "b2"; "b3"];
            let nested = [Node ("b1", [Node ("b2", [Node ("b3", [])])])] in
            wait_tree app page nested;
            Suite.equal ctx "Indent moves b2 together with its existing child"
              (worker_tree app page) nested;
            let x1 = block_x app "b1" and x2 = block_x app "b2"
            and x3 = block_x app "b3" in
            Suite.check ctx "Three nested levels render at increasing x positions"
              (x1 < x2 && x2 < x3);
            Client.click ~text:"b3" app ".ls-page-blocks .block-title-wrap";
            wait_value app "b3";
            wait_focus app;
            append_block app "b4";
            append_block app "b5";
            indent_outdent ctx app ~indent:true;
            arrow_up_to app "b4";
            indent_outdent ctx app ~indent:false;
            exit app;
            wait_titles app ["b1"; "b2"; "b3"; "b4"; "b5"];
            let expected = [Node ("b1", [Node ("b2", [Node ("b3", [])]);
                                          Node ("b4", [Node ("b5", [])])])] in
            wait_tree app page expected;
            Suite.equal ctx "Outdent moves b4 and its child without detaching descendants"
              (worker_tree app page) expected;
            let x2 = block_x app "b2" and x3 = block_x app "b3"
            and x4 = block_x app "b4" and x5 = block_x app "b5" in
            Suite.check ctx "Sibling subtrees preserve the original geometry assertions"
              (x2 = x4 && x3 = x5 && x2 < x3);
            validate_graph ctx app;
            ignore (Client.screenshot app ~name:"outdented-subtree.png"))) ]
