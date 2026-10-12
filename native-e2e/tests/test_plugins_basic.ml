open Yojson.Safe.Util

let source name = "ocaml-e2e/test/test_plugins_basic.ml::" ^ name
let str s = `String s
let uuid value = value |> member "uuid" |> to_string

let new_page app name =
  Client.press app "Mod+k";
  ignore (Client.wait_for app ".cp__cmdk-search-input");
  Client.fill app ".cp__cmdk-search-input" name;
  ignore (Client.wait_for ~text:name app ".cp__cmdk-search-input");
  ignore (Client.wait_for ~text:"Create" app ".cp__cmdk-item-main-text text");
  Client.click app "[data-cmdk-item]";
  ignore (Client.wait_for ~text:name app ".ls-page-title .block-title-wrap")

let block_count ctx app value count =
  let id = match value with `String id -> id | value -> uuid value in
  let selector = "#ls-block-" ^ id in
  ignore (Client.poll "SDK block renders in the real native UI" (fun () ->
      if List.length (Client.query app selector) = count then Some () else None));
  Suite.equal ctx "SDK block has the source-required rendered count"
    (List.length (Client.query app selector)) count;
  id

let validate ctx app =
  let result = Client.validate app in
  Suite.equal ctx "Real worker graph validation has no errors with fix=false"
    (Wire.get result "errors") (Some Wire.Nil);
  Suite.equal ctx "Real worker graph validation has no invalid entity IDs"
    (Wire.get result "invalid-entity-ids") (Some (Wire.Array []))

let tests =
  [ Suite.test ~contract:Suite.Api ~covers:[source "editor-apis-test"]
      "editor-apis-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            new_page app "test-block-apis";
            ignore (Client.sdk_call app "show_msg" [str "hello world"; str "info"]);
            let first = Client.sdk_call app "append_block_in_page"
                [str "test-block-apis"; str "append-block-in-page-0"] in
            let second = Client.sdk_call app "append_block_in_page"
                [str "append-block-in-current-page-0"] in
            let id = block_count ctx app first 1 in
            ignore (block_count ctx app second 1);
            let inserted = Client.sdk_call app "insert_block" [str id; str "insert-0"] in
            ignore (block_count ctx app inserted 1);
            ignore (Client.sdk_call app "update_block" [str id; str "append-but-updated-0"]);
            Client.press app "Escape";
            ignore (Client.wait_for ~text:"append-but-updated-0" app ".block-title-wrap");
            Suite.check ctx "Updated SDK block renders its exact content"
              (Client.query app ".block-title-wrap"
               |> List.exists (fun el -> Client.text_content el = "append-but-updated-0"));
            ignore (Client.screenshot app ~name:"sdk-updated.png");
            ignore (Client.sdk_call app "remove_block" [str id]);
            ignore (block_count ctx app (str id) 0);
            validate ctx app;
            ignore (Client.screenshot app ~name:"sdk-removed.png")));
    Suite.test ~contract:Suite.Api
      ~covers:[source "append-block-in-page-stays-at-page-root-test"]
      "append-block-in-page-stays-at-page-root-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let name = "test-append-block-root" in
            new_page app name;
            let page = Client.sdk_call app "get_page" [str name] in
            let root = Client.sdk_call app "append_block_in_page" [str name; str "root"] in
            let nested = Client.sdk_call app "insert_block"
                [str (uuid root); str "nested-1"; `Assoc ["sibling", `Bool false]] in
            ignore (Client.sdk_call app "insert_block"
                      [str (uuid nested); str "nested-2"; `Assoc ["sibling", `Bool true]]);
            let appended = Client.sdk_call app "append_block_in_page"
                [str name; str "appended"] in
            let block = Client.sdk_call app "get_block" [str (uuid appended)] in
            let parent_id = block |> member "parent" |> member "id" in
            let page_id = page |> member "id" in
            Suite.check ctx "Page and parent IDs exist" (parent_id <> `Null && page_id <> `Null);
            Suite.equal ctx "Append stays at page root after nested sibling inserts"
              parent_id page_id;
            validate ctx app;
            ignore (Client.screenshot app ~name:"sdk-appended-root.png"))) ]
