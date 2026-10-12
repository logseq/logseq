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
            ignore (Client.screenshot app ~name:"sdk-appended-root.png")));
    Suite.test ~contract:Suite.Api ~covers:[source "block-properties-test"]
      "block-properties-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let name = "test-block-properties-apis" in
            new_page app name;
            let block = Client.sdk_call app "append_block_in_page"
                [str name; str "block-in-page-0";
                 `Assoc ["properties", `Assoc ["new-p1", `Int 1]]] in
            let id = block_count ctx app block 1 in
            let prop1 = Client.sdk_call app "get_block_property" [str id; str "new-p1"] in
            let props1 = Client.sdk_call app "get_block_properties" [str id; str "new-p1"] in
            let props2 = Client.sdk_call app "get_page_properties" [str name] in
            ignore (Client.wait_for ~text:"new-p1" app ".property-k");
            Suite.equal ctx "Initial number property value" (member "value" prop1) (`Int 1);
            Suite.equal ctx "Initial property plugin ident" (member "ident" prop1)
              (str ":plugin.property._test_plugin/new-p1");
            Suite.equal ctx "Block properties expose the initial number"
              (member ":plugin.property._test_plugin/new-p1" props1) (`Int 1);
            Suite.equal ctx "Page properties include the Page tag"
              (member ":block/tags" props2) (`List [str "Page"]);
            let json_value = `Assoc ["a", `Int 1; "b", `List [`Int 2; `Int 3]] in
            ignore (Client.sdk_call app "upsert_block_property" [str id; str "p2"; str "p2"]);
            ignore (Client.sdk_call app "upsert_block_property" [str id; str "p3"; `Bool true]);
            ignore (Client.sdk_call app "upsert_block_property" [str id; str "p4"; json_value]);
            let prop2 = Client.sdk_call app "get_block_property" [str id; str "p2"] in
            let prop3 = Client.sdk_call app "get_block_property" [str id; str "p3"] in
            let prop4 = Client.sdk_call app "get_block_property" [str id; str "p4"] in
            ignore (Client.wait_for ~text:"p2" app ".property-k");
            Suite.equal ctx "String property value" (member "value" prop2) (str "p2");
            Suite.equal ctx "Checkbox property is true" prop3 (`Bool true);
            Suite.equal ctx "JSON object property retains its object and array" prop4 json_value;
            ignore (Client.sdk_call app "remove_block_property" [str id; str "p4"]);
            ignore (Client.poll "Removed JSON property disappears from the native UI" (fun () ->
                if Client.query app ".property-k"
                   |> List.exists (fun el -> Client.text_content el = "p4")
                then None else Some ()));
            Suite.check ctx "Removed property is absent in rendered properties"
              (Client.query app ".property-k"
               |> List.for_all (fun el -> Client.text_content el <> "p4"));
            ignore (Client.sdk_call app "upsert_block_property" [str id; str "p3"; `Bool false]);
            ignore (Client.sdk_call app "upsert_block_property" [str id; str "p2"; str "p2-updated"]);
            let values = Client.wait_for ~text:"p2-updated" app
                ("#ls-block-" ^ id ^ " .property-block-container") in
            Suite.check ctx "Updated property text is rendered in its owning native block"
              (List.exists (fun el ->
                   let rect = Client.rect el in
                   Client.text_content el = "p2-updated" && rect.width > 0. && rect.height > 0.) values);
            let props = Client.sdk_call app "get_block_properties" [str id] in
            Suite.equal ctx "Updated checkbox property is false"
              (member ":plugin.property._test_plugin/p3" props) (`Bool false);
            Suite.equal ctx "Updated string property value"
              (member ":plugin.property._test_plugin/p2" props) (str "p2-updated");
            validate ctx app;
            ignore (Client.screenshot app ~name:"sdk-block-properties.png")));
    Suite.test ~contract:Suite.Api ~covers:[source "property-upsert-test"]
      "property-upsert-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let check_property name typ cardinality =
              let property = Client.sdk_call app "get_property" [str name] in
              Suite.equal ctx (name ^ " type") (member "type" property) (str typ);
              Suite.equal ctx (name ^ " cardinality") (member "cardinality" property)
                (str (":db.cardinality/" ^ cardinality))
            in
            ignore (Client.sdk_call app "upsert_property" [str "test-property-1"]);
            check_property "test-property-1" "default" "one";
            ignore (Client.sdk_call app "upsert_property"
                      [str "test-property-2"; `Assoc ["type", str "number"; "cardinality", str "one"]]);
            check_property "test-property-2" "number" "one";
            ignore (Client.sdk_call app "upsert_property"
                      [str "test-property-3"; `Assoc ["type", str "number"; "cardinality", str "many"]]);
            check_property "test-property-3" "number" "many";
            ignore (Client.sdk_call app "upsert_property"
                      [str "test-property-3"; `Assoc ["type", str "default"]]);
            let property = Client.sdk_call app "get_property" [str "test-property-3"] in
            Suite.equal ctx "Existing property's type changes to default"
              (member "type" property) (str "default");
            validate ctx app));
    Suite.test ~contract:Suite.Api ~covers:[source "property-related-test"]
      "property-related-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            List.iter (fun typ ->
                let name = "test-property-related-" ^ typ in
                ignore (Client.sdk_call app "upsert_property"
                          [str name; `Assoc ["type", str typ]]);
                let property = Client.sdk_call app "get_property" [str name] in
                Suite.equal ctx (typ ^ " plugin property identifier")
                  (member "ident" property)
                  (str (":plugin.property._test_plugin/" ^ name));
                Suite.equal ctx (typ ^ " property schema type")
                  (member "type" property) (str typ);
                ignore (Client.sdk_call app "remove_property" [str name]);
                Suite.equal ctx (typ ^ " property is absent after removal")
                  (Client.sdk_call app "get_property" [str name]) `Null)
              ["default"; "number"; "date"; "datetime"; "checkbox"; "url";
               "node"; "json"; "string"];
            validate ctx app)) ]
