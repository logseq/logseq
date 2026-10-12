let goto_page app title =
  Client.press app "Mod+k";
  ignore (Client.wait_for app ".cp__cmdk-search-input");
  Client.fill app ".cp__cmdk-search-input" title;
  ignore (Client.wait_for ~text:title app ".cp__cmdk-item-main-text");
  Client.click ~text:title app "[data-cmdk-item]";
  ignore (Client.wait_for ~text:title app ".ls-page-title .block-title-wrap")

let new_blocks app titles =
  List.iteri (fun index title ->
      if index = 0 then Test_commands_basic.add_block app title
      else begin
        Client.press app "Enter";
        ignore (Test_commands_basic.wait_editor_text app "");
        Client.text app title;
        ignore (Test_commands_basic.wait_editor_text app title)
      end) titles

let page_titles app =
  Client.query app ".ls-page-blocks .ls-block"
  |> List.filter_map (fun el -> Client.attr el "data-block-title")

let indent ctx app =
  let before = Client.wait_for app ".block-editor" |> List.hd |> Client.rect in
  Client.press app "Tab";
  let after = Client.poll "Tab indents the active Library page editor" (fun () ->
      match Client.query app ".block-editor" with
      | editor :: _ ->
          let rect = Client.rect editor in
          if rect.x > before.x then Some rect else None
      | [] -> None) in
  Suite.check ctx "Real Tab moves the edited page to a deeper outline level"
    (after.x > before.x)

let assert_title ctx app title =
  let nodes = Client.wait_for ~text:title app ".ls-page-blocks .block-title-wrap" in
  Suite.check ctx ("Library displays " ^ title)
    (List.exists (fun el -> Client.text_content el = title
                           && Test_commands_basic.visible el) nodes)

let assert_hidden_content ctx app =
  let contents = page_titles app in
  List.iter (fun title ->
      Suite.check ctx ("Page outline hides ordinary content " ^ title)
        (not (List.mem title contents))) ["hello"; "world"]

let hides_normal_blocks ctx =
  Suite.with_app ~label:"library-collapse" ctx (fun app ->
      Test_commands_basic.open_page app "Library Collapse Fixture";
      goto_page app "Library";
      new_blocks app ["Outline Parent"; "Outline Child"];
      indent ctx app;
      goto_page app "Outline Child";
      new_blocks app ["hello"; "world"];
      goto_page app "Library";
      assert_title ctx app "Outline Parent";
      assert_title ctx app "Outline Child";
      let contents = page_titles app in
      List.iter (fun title ->
          Suite.check ctx ("Library contains page " ^ title)
            (List.mem title contents)) ["Outline Parent"; "Outline Child"];
      assert_hidden_content ctx app;
      goto_page app "Outline Parent";
      assert_title ctx app "Outline Child";
      Suite.check ctx "Parent page contains its child page"
        (List.mem "Outline Child" (page_titles app));
      assert_hidden_content ctx app;
      Suite.equal ctx "Collapsed page outline has no Add property control"
        (Client.query app ".ls-page-blocks .page-blocks-inner .ls-new-property"
         |> List.filter (fun el ->
             Test_commands_basic.contains (Client.text_content el) "Add property")) [];
      goto_page app "Outline Child";
      assert_title ctx app "hello";
      Test_commands_basic.validate_graph ctx app)

let enter_creates_sibling ctx =
  Suite.with_app ~label:"library-enter-sibling" ctx (fun app ->
      Test_commands_basic.open_page app "Library Enter Fixture";
      goto_page app "Library";
      new_blocks app ["Enter Parent"; "Enter Nested"];
      indent ctx app;
      Client.press app "Up";
      Suite.equal ctx "Arrow Up edits the parent page"
        (Test_commands_basic.wait_editor_text app "Enter Parent") "Enter Parent";
      Client.press app "End";
      Client.press app "Enter";
      ignore (Test_commands_basic.wait_editor_text app "");
      Client.text app "Enter Sibling";
      ignore (Test_commands_basic.wait_editor_text app "Enter Sibling");
      Test_commands_basic.exit_edit app;
      goto_page app "Library";
      List.iter (assert_title ctx app) ["Enter Parent"; "Enter Nested"; "Enter Sibling"];
      let x title =
        Client.query app ".ls-page-blocks .block-title-wrap"
        |> List.find (fun el -> Client.text_content el = title)
        |> Client.rect |> fun rect -> rect.x
      in
      let parent = x "Enter Parent" in
      Suite.check ctx "Nested page is indented to the right of parent"
        (x "Enter Nested" > parent);
      Suite.check ctx "Enter sibling aligns with its parent within source tolerance"
        (Float.abs (x "Enter Sibling" -. parent) < 8.);
      Test_commands_basic.validate_graph ctx app)

let tests =
  [ Suite.test
      ~covers:["ocaml-e2e/test/test_library_basic.ml::library-hides-normal-blocks-and-collapses-child-pages"]
      "library-hides-normal-blocks-and-collapses-child-pages" hides_normal_blocks
  ; Suite.test
      ~covers:["ocaml-e2e/test/test_library_basic.ml::library-enter-on-page-creates-sibling"]
      "library-enter-on-page-creates-sibling" enter_creates_sibling ]
