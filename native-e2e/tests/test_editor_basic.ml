open Yojson.Safe.Util

let editor_value app =
  Client.sdk_call app "get_editing_block_content" [] |> to_string

let editing_uuid app = Client.sdk_call app "check_editing" [] |> to_string

let save_oracles app =
  let probes = ["editing", "check_editing"; "content", "get_editing_block_content";
                "cursor", "get_editing_cursor_position";
                "page-tree", "get_current_page_blocks_tree"] in
  let values = List.map (fun (name, method_name) ->
      let value = try Client.sdk_call app method_name []
        with exn -> `Assoc ["probe-error", `String (Printexc.to_string exn)] in
      name, value) probes in
  Yojson.Safe.to_file (Filename.concat (Client.artifacts app) "editor-oracles.json")
    (`Assoc values)

let caret app =
  Client.sdk_call app "get_editing_cursor_position" [] |> member "pos" |> to_int

let wait_value app value =
  try Client.poll ("editor value: " ^ value) (fun () ->
      match Client.sdk_call app "get_editing_block_content" [] with
      | `String actual when actual = value -> Some ()
      | _ -> None)
  with Client.Timeout _ as exn -> save_oracles app; raise exn

let wait_caret app expected =
  Client.poll "editor caret" (fun () ->
      match Client.sdk_call app "get_editing_cursor_position" [] with
      | `Assoc fields ->
        if List.assoc_opt "pos" fields = Some (`Int expected) then Some () else None
      | _ -> None)

let wait_focus app =
  Client.poll "focused native block editor" (fun () ->
      let focused = Client.focused app in
      Client.query app "editor.ed-input"
      |> List.find_opt (fun el -> el |> member "node-id" |> to_int = focused)
      |> Option.map (fun _ -> ()))

let wait_no_editor app =
  Client.poll "editor exited" (fun () ->
      if Client.query app ".block-editor" = [] then Some () else None)

let wait_page app name =
  Client.poll ("page title: " ^ name) (fun () ->
      if Client.query app ".ls-page-title .block-title-wrap"
         |> List.exists (fun el -> Client.text_content el = name)
      then Some () else None)

let search app name =
  Client.press app "Mod+k";
  ignore (Client.wait_for app ".cp__cmdk-search-input");
  Client.fill app ".cp__cmdk-search-input" name

let stable_create_item app name =
  let previous = ref None in
  Client.poll "laid-out Cmd-K create-page item" (fun () ->
      match Client.query app "[data-cmdk-item]"
        |> List.find_opt (fun el -> Client.attr el "data-item-key" = Some ("create-" ^ name)) with
      | None -> previous := None; None
      | Some el ->
        let rect = Client.rect el and now = Unix.gettimeofday () in
        if rect.width <= 0. || rect.height <= 0. then (previous := None; None)
        else match !previous with
          | Some (old_rect, since) when rect = old_rect ->
            if now -. since >= 0.2 then Some el else None
          | _ -> previous := Some (rect, now); None)

let create_page app name =
  search app name;
  let create = stable_create_item app name in
  let rect = Client.rect create in
  Client.click_at app (int_of_float (rect.x +. rect.width /. 2.))
    (int_of_float (rect.y +. rect.height /. 2.));
  wait_page app name;
  Client.click app ".block-add-button";
  ignore (Client.wait_for app ".block-editor");
  wait_value app "";
  wait_focus app

let goto_page app name =
  search app name;
  ignore (Client.wait_for ~text:name app ".cp__cmdk-item-main-text");
  Client.click ~text:name app ".cp__cmdk-item-main-text";
  wait_page app name

let block_title app uuid =
  Client.q app ~inputs:[Wire.Uuid uuid]
    "[:find ?title :in $ ?uuid :where [?b :block/uuid ?uuid] [?b :block/title ?title]]"

let wait_saved app uuid title =
  Client.poll ("saved block: " ^ title) (fun () ->
      if block_title app uuid = Wire.Set [Wire.Array [Wire.String title]]
      then Some () else None)

let enter_next app =
  let previous = editing_uuid app in
  Client.press app "Enter";
  ignore (Client.poll "Enter focuses successor block" (fun () ->
      match Client.sdk_call app "check_editing" [] with
      | `String uuid when uuid <> previous -> Some uuid
      | _ -> None));
  wait_focus app

let type_block app text =
  wait_focus app;
  Client.text app text;
  wait_value app text;
  wait_saved app (editing_uuid app) text

let move_to_end app =
  Client.press app "Mod+a";
  Client.press app "Right";
  wait_caret app (String.length (editor_value app))

let append_block app text =
  move_to_end app;
  enter_next app;
  wait_value app "";
  type_block app text

let visible_titles app =
  Client.query app ".ls-page-blocks .block-title-wrap" |> List.map Client.text_content

let wait_titles app expected =
  try Client.poll "ordered rendered block titles" (fun () ->
      if visible_titles app = expected then Some () else None)
  with Client.Timeout _ as exn -> save_oracles app; raise exn

type tree = Node of string * tree list

let rec decode_tree = function
  | Wire.Array nodes | Wire.List nodes -> List.map decode_node nodes
  | _ -> failwith "Expected a worker page-block tree array"
and decode_node node =
  let title = match Wire.map_get_string node "block/title" with
    | Some title -> title
    | None -> failwith "Worker tree block has no title"
  in
  let children = match Wire.get node "block/children" with
    | None -> []
    | Some nodes -> decode_tree nodes
  in
  Node (title, children)

let worker_tree app page =
  let _, _, repo = Client.daemon app in
  Client.read app "thread-api/get-page-blocks-tree"
    [Wire.String repo; Wire.String page; Wire.Map []] |> decode_tree

let wait_tree app page expected =
  try Client.poll "ordered persisted block tree" (fun () ->
      if worker_tree app page = expected then Some () else None)
  with Client.Timeout _ as exn -> save_oracles app; raise exn

let tests =
  [ Suite.test
      ~covers:["ocaml-e2e/test/test_editor_basic.ml::editor-exit-and-unicode-persistence-test"]
      "editor-exit-and-unicode-persistence-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let page = "Native Unicode Persistence" in
            let content = "中文🙂 é editor persistence" in
            create_page app page;
            type_block app content;
            let uuid = editing_uuid app in
            Client.press app "Escape";
            wait_no_editor app;
            wait_titles app [content];
            Suite.equal ctx "Escape removes the editor" (Client.query app ".block-editor") [];
            Suite.equal ctx "Exact Unicode renders after exit" (visible_titles app) [content];
            Client.click app "#main-content-container";
            ignore (Client.poll "autocomplete and popovers dismissed" (fun () ->
                if Client.query app ".ui__popover-content, .autocomplete" = [] then Some () else None));
            Suite.equal ctx "No editor popup remains after background click"
              (Client.query app ".ui__popover-content, .autocomplete") [];
            create_page app "editor exit destination";
            Client.press app "Escape";
            wait_no_editor app;
            goto_page app page;
            wait_titles app [content];
            Suite.equal ctx "Navigation back preserves exact Unicode" (visible_titles app) [content];
            Client.reload app;
            goto_page app page;
            wait_titles app [content];
            Suite.equal ctx "Daemon contains exact Unicode after reload"
              (block_title app uuid) (Wire.Set [Wire.Array [Wire.String content]]);
            let block = Client.sdk_call app "get_block" [`String uuid] in
            Suite.equal ctx "Production SDK agrees with persisted title"
              (block |> member "content" |> to_string) content;
            Suite.equal ctx "Reload renders exact Unicode" (visible_titles app) [content];
            ignore (Client.screenshot app ~name:"unicode-persisted.png")));
    Suite.test
      ~covers:["ocaml-e2e/test/test_editor_basic.ml::enter-splits-block-at-cursor-test"]
      "enter-splits-block-at-cursor-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let page = "Native Enter Split" in
            create_page app page;
            type_block app "alphaomega";
            let first = editing_uuid app in
            Client.press app "Home";
            wait_caret app 0;
            for _ = 1 to 5 do Client.press app "Right" done;
            wait_caret app 5;
            enter_next app;
            wait_value app "omega";
            Client.text app "middle-";
            wait_value app "middle-omega";
            let second = editing_uuid app in
            Suite.equal ctx "Exactly one block editor is mounted"
              (List.length (Client.query app ".block-editor")) 1;
            Suite.equal ctx "Insertion occurs before the split suffix" (editor_value app) "middle-omega";
            Suite.check ctx "Enter moved editing to a new UUID" (first <> second);
            Client.press app "Escape";
            wait_no_editor app;
            wait_titles app ["alpha"; "middle-omega"];
            wait_tree app page [Node ("alpha", []); Node ("middle-omega", [])];
            Suite.equal ctx "Rendered split order matches the source"
              (visible_titles app) ["alpha"; "middle-omega"];
            Suite.equal ctx "Split persists ordered siblings"
              (worker_tree app page) [Node ("alpha", []); Node ("middle-omega", [])];
            Suite.equal ctx "The original block contains only the prefix"
              (block_title app first) (Wire.Set [Wire.Array [Wire.String "alpha"]]);
            Suite.equal ctx "The successor contains insertion plus suffix"
              (block_title app second) (Wire.Set [Wire.Array [Wire.String "middle-omega"]]);
            ignore (Client.screenshot app ~name:"split-blocks.png"))) ]
