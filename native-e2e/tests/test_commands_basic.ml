open Yojson.Safe.Util

let contains text needle =
  let rec go i =
    i + String.length needle <= String.length text
    && (String.sub text i (String.length needle) = needle || go (i + 1))
  in
  go 0

let wait_absent app selector =
  Client.poll ("Hidden " ^ selector) (fun () ->
      if Client.query app selector = [] then Some () else None)

let wait_editor_text app expected =
  Client.poll "Exact native editor buffer" (fun () ->
      let content = Client.sdk_call app "get_editing_block_content" [] in
      if content = `String expected then Some expected else None)

let wait_input_text app expected =
  Client.poll "Exact native text input" (fun () ->
      let shadow = Client.status app |> member "shadow" |> to_string in
      if shadow = expected then Some shadow else None)

let open_page app name =
  Client.press app "Mod+k";
  ignore (Client.wait_for app ".cp__cmdk-search-input");
  Client.fill app ".cp__cmdk-search-input" name;
  ignore (Client.wait_for ~text:name app ".cp__cmdk-search-input");
  ignore (Client.wait_for ~text:name app ".cp__cmdk-item-main-text");
  ignore (Client.wait_for ~text:"Create" app ".cp__cmdk-item-main-text text");
  Client.click ~text:name app "[data-cmdk-item]";
  ignore (Client.wait_for ~text:name app ".ls-page-title .block-title-wrap")

let add_block app text =
  Client.click app ".block-add-button";
  ignore (Client.wait_for app ".block-editor");
  Client.text app text;
  ignore (wait_editor_text app text)

let assert_persisted_title ctx app page expected =
  let query = Printf.sprintf
      "[:find ?title :where [?b :block/title ?title] [?b :block/page ?p] [?p :block/title %S]]"
      page in
  let result = Wire.Set [Wire.Array [Wire.String expected]] in
  ignore (Client.poll "Exact title persisted through real daemon" (fun () ->
      if Client.q app query = result then Some () else None));
  Suite.equal ctx "Exact block title in real daemon" (Client.q app query) result

let validate_graph ctx app =
  let result = Client.validate app in
  Suite.equal ctx "Graph validation has no errors without autofix"
    (Wire.map_get result "errors") (Some Wire.Nil);
  Suite.equal ctx "Graph has no invalid entities without autofix"
    (Wire.map_get result "invalid-entity-ids") (Some (Wire.Array []))

let command_trigger ctx =
  Suite.with_app ~label:"command-trigger" ctx (fun app ->
      let page = "Command Trigger" in
      open_page app page;
      add_block app "b2";
      Client.text app " /";
      let chosen = Client.wait_for ~text:"Node reference" app ".menu-link.chosen" in
      Suite.check ctx "Slash selects Node reference"
        (List.exists (fun el -> contains (Client.text_content el) "Node reference") chosen);
      Client.press app "Backspace";
      wait_absent app ".ui__popover-content";
      Suite.equal ctx "Backspace dismisses the slash popover"
        (Client.query app ".ui__popover-content") [];
      Suite.equal ctx "Backspace removes only the trigger"
        (wait_editor_text app "b2 ") "b2 ";
      assert_persisted_title ctx app page "b2 ";
      validate_graph ctx app;
      ignore (Client.screenshot ~name:"backspace-dismissed.png" app))

let slash_group_headings ctx =
  Suite.with_app ~label:"slash-group-headings" ctx (fun app ->
      let page = "Slash Group Headings" in
      open_page app page;
      add_block app "slash-headings";
      Client.text app " /";
      ignore (Client.wait_for ~text:"Node reference" app ".menu-link.chosen");
      Suite.check ctx "Unfiltered slash selects Node reference"
        (Client.query app ".menu-link.chosen"
         |> List.exists (fun el -> contains (Client.text_content el) "Node reference"));
      List.iter (fun heading ->
          ignore (Client.wait_for ~text:heading app ".ui__ac-group-name");
          Suite.check ctx ("Unfiltered slash group " ^ heading ^ " is visible")
            (Client.query app ".ui__ac-group-name"
             |> List.exists (fun el -> Client.text_content el = heading)))
        ["BASIC"; "FORMAT"; "Heading"];
      Suite.check ctx "Clear heading is absent for an ordinary block"
        (Client.query app ".menu-link"
         |> List.for_all (fun el -> not (contains (Client.text_content el) "Clear heading")));
      Client.text app "node";
      ignore (Client.wait_for ~text:"Node reference" app ".menu-link");
      wait_absent app ".ui__ac-group-name";
      Suite.check ctx "Filtered slash retains Node reference"
        (Client.query app ".menu-link"
         |> List.exists (fun el -> contains (Client.text_content el) "Node reference"));
      Suite.equal ctx "Filtered slash omits group headings"
        (Client.query app ".ui__ac-group-name") [];
      Suite.equal ctx "Filtering preserves the editor buffer"
        (wait_editor_text app "slash-headings /node") "slash-headings /node";
      assert_persisted_title ctx app page "slash-headings /node";
      validate_graph ctx app;
      ignore (Client.screenshot ~name:"filtered-slash.png" app))

let input_command ?label app command =
  let label = Option.value label ~default:command in
  Client.text app "/";
  ignore (Client.wait_for ~text:"Node reference" app ".menu-link.chosen");
  Client.text app command;
  ignore (Client.wait_for ~text:label app ".menu-link.chosen");
  Client.press app "Enter"

let page_reference ctx =
  Suite.with_app ~label:"page-reference" ctx (fun app ->
      let page = "Page Reference" in
      open_page app page;
      add_block app "b1";
      let previous_focus = Client.focused app in
      Client.press app "Enter";
      ignore (Client.poll "New empty block has native editor focus" (fun () ->
          if Client.focused app <> previous_focus && Client.focused app <> 0
             && Client.sdk_call app "get_editing_block_content" [] = `String ""
          then Some () else None));
      input_command app "Node reference";
      Client.text app "Another page";
      ignore (Client.wait_for ~text:"Another page" app ".menu-link.chosen");
      Client.press app "Enter";
      Suite.equal ctx "Node reference inserts exact source syntax"
        (wait_editor_text app "[[Another page]]") "[[Another page]]";
      let source_uuid = Client.sdk_call app "check_editing" [] |> to_string in
      Client.press app "Escape";
      wait_absent app ".block-editor";
      ignore (Client.wait_for ~text:"Another page" app "a.page-ref");
      Suite.check ctx "Rendered page reference has exact text"
        (Client.query app "a.page-ref"
         |> List.exists (fun el -> Client.text_content el = "Another page"));
      let query = Printf.sprintf
          "[:find ?target :in $ ?source :where [?b :block/uuid ?source] [?b :block/page ?p] [?p :block/title %S] [?b :block/refs ?r] [?r :block/title ?target]]"
          page in
      let refs () = Client.q ~inputs:[Wire.Uuid source_uuid] app query in
      let expected = Wire.Set [Wire.Array [Wire.String "Another page"]] in
      ignore (Client.poll "Real daemon contains the page reference" (fun () ->
          if refs () = expected then Some () else None));
      Suite.equal ctx "Worker refs resolve to Another page"
        (refs ()) expected;
      validate_graph ctx app;
      ignore (Client.screenshot ~name:"page-reference.png" app))

let node_id element = element |> member "node-id" |> to_number |> int_of_float

let wait_focus app element =
  Client.poll "Native keyboard focus" (fun () ->
      if Client.focused app = node_id element then Some () else None)

let add_link ctx app =
  input_command ~label:"Link" app "link";
  ignore (Client.wait_for app ".ls-editor-link-form input");
  let inputs = Client.query app ".ls-editor-link-form input" in
  Suite.equal ctx "Link form has URL and label fields" (List.length inputs) 2;
  let url = List.nth inputs 0 and label = List.nth inputs 1 in
  wait_focus app url;
  Suite.equal ctx "Link URL field is autofocused" (Client.focused app) (node_id url);
  Client.text app "https://logseq.com";
  ignore (wait_input_text app "https://logseq.com");
  Client.press app "Tab";
  wait_focus app label;
  Suite.equal ctx "Tab moves focus from URL to label" (Client.focused app) (node_id label);
  Client.text app "Logseq";
  ignore (wait_input_text app "Logseq");
  Client.press app "Tab";
  let submit = Client.wait_for ~text:"Submit" app ".ls-editor-link-form button" |> List.hd in
  wait_focus app submit;
  Suite.equal ctx "Tab moves focus from label to Submit" (Client.focused app) (node_id submit);
  Client.press app "Enter";
  wait_absent app ".ls-editor-link-form"

let link ctx =
  Suite.with_app ~label:"link" ctx (fun app ->
      let page = "Link Insertion" in
      open_page app page;
      add_block app "";
      add_link ctx app;
      let first = "[Logseq](https://logseq.com)" in
      Suite.equal ctx "First link replaces only the slash trigger"
        (wait_editor_text app first) first;
      assert_persisted_title ctx app page first;
      Client.text app " some content ";
      ignore (wait_editor_text app (first ^ " some content "));
      add_link ctx app;
      let both = first ^ " some content " ^ first in
      Suite.equal ctx "Second link appends after the exact intervening text"
        (wait_editor_text app both) both;
      assert_persisted_title ctx app page both;
      validate_graph ctx app;
      ignore (Client.screenshot ~name:"two-links.png" app))

let tests =
  [ Suite.test
      ~covers:["ocaml-e2e/test/test_commands_basic.ml::command-trigger-test"]
      "command-trigger-test" command_trigger
  ; Suite.test
      ~covers:["ocaml-e2e/test/test_commands_basic.ml::slash-command-group-headings-test"]
      "slash-command-group-headings-test" slash_group_headings
  ; Suite.test
      ~covers:["ocaml-e2e/test/test_commands_basic.ml::page-reference-test"]
      "page-reference-test" page_reference
  ; Suite.test
      ~covers:["ocaml-e2e/test/test_commands_basic.ml::link-test"]
      "link-test" link ]
