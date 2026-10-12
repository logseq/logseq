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
            validate ctx app));
    Suite.test ~contract:Suite.Api ~covers:[source "insert-block-with-properties"]
      "insert-block-with-properties" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let name = "insert-block-properties-test" in
            new_page app name;
            let properties = `Assoc
                [ "x1", `Bool true; "x2", str "https://logseq.com"; "x3", `Int 1
                ; "x4", `List [`Int 1]; "x5", `Assoc ["foo", str "bar"]
                ; "x6", str "Page x"; "x7", `List [str "Page y"; str "Page z"]
                ; "x8", str "some content" ] in
            let schema = `Assoc
                ["x6", `Assoc ["type", str "page"]
                ; "x7", `Assoc ["type", str "page"]] in
            let block = Client.sdk_call app "insert_block"
                [str name; str "b1";
                 `Assoc ["properties", properties; "schema", schema]] in
            let field key = member (":plugin.property._test_plugin/" ^ key) block in
            let get value = Client.sdk_call app "get_block" [value] in
            Suite.equal ctx "Inferred checkbox is true" (field "x1") (`Bool true);
            Suite.equal ctx "URL property resolves to its exact block title"
              (member "title" (get (field "x2"))) (str "https://logseq.com");
            Suite.equal ctx "Number property resolves to its exact value"
              (member ":logseq.property/value" (get (field "x3"))) (`Int 1);
            Suite.equal ctx "Many-number property preserves its first value"
              (member ":logseq.property/value" (get (field "x4" |> to_list |> List.hd))) (`Int 1);
            Suite.equal ctx "JSON property is serialized exactly"
              (field "x5") (str "{\"foo\":\"bar\"}");
            Suite.equal ctx "Explicit page schema resolves the first page name"
              (member "name" (get (field "x6"))) (str "page x");
            Suite.equal ctx "Explicit page schema preserves many page names"
              (`List (field "x7" |> to_list |> List.map (fun value -> member "name" (get value))))
              (`List [str "page y"; str "page z"]);
            let text_block = get (field "x8") in
            Suite.equal ctx "Text property resolves to its exact block title"
              (member "title" text_block) (str "some content");
            Suite.check ctx "Text property block belongs to a page"
              (member "page" text_block <> `Null);
            validate ctx app));
    Suite.test ~contract:Suite.Api ~covers:[source "update-block-with-properties"]
      "update-block-with-properties" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let name = "update-block-properties-test" in
            new_page app name;
            let block = Client.sdk_call app "insert_block" [str name; str "b1"] in
            let properties = `Assoc
                [ "y1", `Bool true; "y2", str "https://logseq.com"; "y3", `Int 1
                ; "y4", `List [`Int 1]; "y5", `Assoc ["foo", str "bar"]
                ; "y6", str "Page x"; "y7", `List [str "Page y"; str "Page z"]
                ; "y8", str "some content" ] in
            let schema = `Assoc
                ["y6", `Assoc ["type", str "page"]
                ; "y7", `Assoc ["type", str "page"]] in
            ignore (Client.sdk_call app "update_block"
                      [str (uuid block); str "b1-new-content";
                       `Assoc ["properties", properties; "schema", schema]]);
            let updated = Client.sdk_call app "get_block" [str (uuid block)] in
            let field key = member (":plugin.property._test_plugin/" ^ key) updated in
            let get value = Client.sdk_call app "get_block" [member "id" value] in
            Suite.equal ctx "Updated inferred checkbox is true" (field "y1") (`Bool true);
            Suite.equal ctx "Updated URL property resolves to its exact block title"
              (member "title" (get (field "y2"))) (str "https://logseq.com");
            Suite.equal ctx "Updated number property resolves to its exact value"
              (member ":logseq.property/value" (get (field "y3"))) (`Int 1);
            Suite.equal ctx "Updated many-number property preserves its first value"
              (member ":logseq.property/value" (get (field "y4" |> to_list |> List.hd))) (`Int 1);
            Suite.equal ctx "Updated JSON property is serialized exactly"
              (field "y5") (str "{\"foo\":\"bar\"}");
            Suite.equal ctx "Updated explicit page schema resolves the first page name"
              (member "name" (get (field "y6"))) (str "page x");
            Suite.equal ctx "Updated explicit page schema preserves many page names"
              (`List (field "y7" |> to_list |> List.map (fun value -> member "name" (get value))))
              (`List [str "page y"; str "page z"]);
            let text_block = get (field "y8") in
            Suite.equal ctx "Updated text property resolves to its exact block title"
              (member "title" text_block) (str "some content");
            Suite.check ctx "Updated text property block belongs to a page"
              (member "page" text_block <> `Null);
            validate ctx app));
    Suite.test ~contract:Suite.Api ~covers:[source "create-page-test"]
      "create-page-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let get value = Client.sdk_call app "get_block" [value] in
            let tag_ident page =
              page |> member "tags" |> to_list |> List.hd |> get |> member "ident"
            in
            let first = Client.sdk_call app "create_page" [str "Test page 1"] in
            Suite.equal ctx "Created page has the requested title"
              (member "title" first) (str "Test page 1");
            Suite.equal ctx "Created page carries the Page class tag"
              (tag_ident first) (str ":logseq.class/Page");
            let properties = `Assoc
                ["px1", str "test"; "px2", `Int 1; "px3", str "Page 1"
                ; "px4", `List [str "Page 2"; str "Page 3"]] in
            let schema = `Assoc
                ["px3", `Assoc ["type", str "page"]
                ; "px4", `Assoc ["type", str "page"]] in
            let second = Client.sdk_call app "create_page"
                [str "Test page 2"; properties; `Assoc ["schema", schema]] in
            let page = get (str "Test page 2") in
            let field key = member (":plugin.property._test_plugin/" ^ key) page in
            let get_ref value = get (member "id" value) in
            Suite.equal ctx "Page with properties has the requested title"
              (member "title" second) (str "Test page 2");
            Suite.equal ctx "Page with properties carries the Page class tag"
              (tag_ident second) (str ":logseq.class/Page");
            Suite.equal ctx "Text page property resolves to its exact title"
              (member "title" (get_ref (field "px1"))) (str "test");
            Suite.equal ctx "Number page property resolves to its exact value"
              (member ":logseq.property/value" (get_ref (field "px2"))) (`Int 1);
            Suite.equal ctx "Single page property resolves to its page name"
              (member "name" (get_ref (field "px3"))) (str "page 1");
            Suite.equal ctx "Many page properties preserve both page names"
              (`List (field "px4" |> to_list
                      |> List.map (fun value -> member "name" (get_ref value))))
              (`List [str "page 2"; str "page 3"]);
            let tag = Client.sdk_call app "create_page"
                [str "Tag new"; `Assoc []; `Assoc ["class", `Bool true]] in
            Suite.equal ctx "Class page carries the Tag class tag"
              (tag_ident tag) (str ":logseq.class/Tag");
            validate ctx app));
    Suite.test ~contract:Suite.Api ~covers:[source "get-all-tags-test"]
      "get-all-tags-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let tags = Client.sdk_call app "get_all_tags" [] |> to_list in
            let idents = List.map (member "ident") tags in
            let builtins =
              [ ":logseq.class/Template"; ":logseq.class/Query"
              ; ":logseq.class/Math-block"; ":logseq.class/Task"
              ; ":logseq.class/Code-block"; ":logseq.class/Card"
              ; ":logseq.class/Quote-block"; ":logseq.class/Cards" ] in
            Suite.check ctx "Native SDK returns every source-required built-in class"
              (List.for_all (fun ident -> List.mem (str ident) idents) builtins);
            validate ctx app));
    Suite.test ~contract:Suite.Api ~covers:[source "get-all-properties-test"]
      "get-all-properties-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let properties = Client.sdk_call app "get_all_properties" [] |> to_list in
            Suite.check ctx "Worker exposes at least twenty built-in properties"
              (List.length properties >= 20);
            validate ctx app));
    Suite.test ~contract:Suite.Api ~covers:[source "get-tag-objects-test"]
      "get-tag-objects-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let name = "tag objects test" in
            new_page app name;
            ignore (Client.sdk_call app "insert_block"
                      [str name; str "task 1";
                       `Assoc ["properties", `Assoc ["logseq.property/status", str "Doing"]]]);
            let tasks = Client.sdk_call app "get_tag_objects" [str "logseq.class/Task"]
                        |> to_list in
            Suite.equal ctx "Status Doing classifies exactly one SDK block as Task"
              (List.length tasks) 1;
            Suite.equal ctx "Task query returns the source-required title"
              (member "title" (List.hd tasks)) (str "task 1");
            validate ctx app));
    Suite.test ~contract:Suite.Api ~covers:[source "create-and-get-tag-test"]
      "create-and-get-tag-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let tag = Client.sdk_call app "create_tag" [str "book1"] in
            let named = Client.sdk_call app "get_tag" [str "book1"] in
            let ident = ":plugin.class._test_plugin/book1" in
            let identified = Client.sdk_call app "get_tag" [str ident] in
            let by_uuid = Client.sdk_call app "get_tag" [str (uuid tag)] in
            Suite.equal ctx "Created plugin tag has its scoped identifier"
              (member "ident" tag) (str ident);
            Suite.equal ctx "Tag lookup by title preserves its identifier"
              (member "ident" named) (str ident);
            Suite.equal ctx "Tag lookup by identifier returns the title"
              (member "title" identified) (str "book1");
            Suite.equal ctx "Tag lookup by UUID returns the title"
              (member "title" by_uuid) (str "book1");
            let tag_properties = `List
                [ `Assoc ["name", str "prop1"]
                ; `Assoc ["name", str "prop2"; "schema", `Assoc ["type", str "number"]]
                ; `Assoc ["name", str "prop3"; "schema", `Assoc ["type", str "checkbox"]] ] in
            let with_props = Client.sdk_call app "create_tag"
                [str "tag-with-props"; `Assoc ["tagProperties", tag_properties]] in
            Suite.equal ctx "Tag has all three requested property schemas"
              (member ":logseq.property.class/properties" with_props |> to_list |> List.length) 3;
            let create name = Client.sdk_call app "create_tag" [str name] in
            let first = create "tag1" in
            let second = create "tag2" in
            let third = create "tag3" in
            let id1 = member "id" first and id2 = member "id" second
            and id3 = member "id" third in
            ignore (Client.sdk_call app "add_tag_extends" [id1; id2]);
            let extended = Client.sdk_call app "get_tag" [id1] in
            Suite.equal ctx "Tag extends the first DB ID"
              (member ":logseq.property.class/extends" extended) (`List [id2]);
            ignore (Client.sdk_call app "add_tag_extends" [id1; id3]);
            let extended = Client.sdk_call app "get_tag" [id1] in
            Suite.equal ctx "Tag preserves both extension DB IDs in source order"
              (member ":logseq.property.class/extends" extended) (`List [id2; id3]);
            validate ctx app));
    Suite.test ~contract:Suite.Api ~covers:[source "get-tags-by-name-test"]
      "get-tags-by-name-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let create name = Client.sdk_call app "create_tag" [str name] in
            let find name = Client.sdk_call app "get_tags_by_name" [str name] |> to_list in
            let product = create "product" in
            let result = find "product" in
            Suite.equal ctx "Exact tag name returns exactly one tag" (List.length result) 1;
            let found = List.hd result in
            Suite.equal ctx "Exact tag lookup returns the created UUID"
              (member "uuid" found) (member "uuid" product);
            Suite.equal ctx "Exact tag lookup returns the created title"
              (member "title" found) (member "title" product);
            ignore (create "TestTag123");
            let lower = find "testtag123" and upper = find "TESTTAG123"
            and mixed = find "TeStTaG123" in
            List.iter (fun (name, tags) ->
                Suite.equal ctx (name ^ " search finds one normalized tag")
                  (List.length tags) 1)
              ["Lowercase", lower; "Uppercase", upper; "Mixed case", mixed];
            Suite.equal ctx "Lowercase and uppercase resolve the same UUID"
              (uuid (List.hd lower)) (uuid (List.hd upper));
            Suite.equal ctx "Lowercase and mixed case resolve the same UUID"
              (uuid (List.hd lower)) (uuid (List.hd mixed));
            Suite.equal ctx "Missing tag search returns an empty array"
              (find "NonExistentTag12345") [];
            new_page app "regular-page";
            Suite.equal ctx "Ordinary page is excluded from tag lookup"
              (find "regular-page") [];
            ignore (create "category");
            ignore (create "Category");
            let similar = find "category" in
            Suite.check ctx "Case-normalized similar names return at least one tag"
              (List.length similar >= 1);
            let found = List.hd similar in
            Suite.check ctx "Normalized tag has a string UUID"
              (match member "uuid" found with `String _ -> true | _ -> false);
            Suite.check ctx "Normalized tag has a string title"
              (match member "title" found with `String _ -> true | _ -> false);
            validate ctx app));
    Suite.test ~contract:Suite.Api ~covers:[source "set-property-node-tags"]
      "set-property-node-tags" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let name = "node-tags-property" in
            ignore (Client.sdk_call app "upsert_property"
                      [str name; `Assoc ["type", str "node"]]);
            let first = Client.sdk_call app "create_tag" [str "Tag A"] in
            let second = Client.sdk_call app "create_tag" [str "Tag B"] in
            let ids = [member "id" first; member "id" second] in
            ignore (Client.sdk_call app "set_property_node_tags" [str name; `List ids]);
            let property = Client.sdk_call app "get_property" [str name] in
            Suite.equal ctx "Node property classes equal both supplied tag DB IDs"
              (member ":logseq.property/classes" property |> to_list |> List.sort compare)
              (List.sort compare ids);
            validate ctx app));
    Suite.test ~contract:Suite.Api ~covers:[source "insert-batch-blocks-test"]
      "insert-batch-blocks-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let node ?(properties = []) ?(children = []) title =
              `Assoc (["content", str title]
                      @ (if properties = [] then [] else ["properties", `Assoc properties])
                      @ (if children = [] then [] else ["children", `List children])) in
            let batch with_properties =
              let leaf_properties =
                if with_properties then
                  ["z3", str "Page 1"; "z4", `List [str "Page 2"; str "Page 3"]]
                else [] in
              let root_properties =
                if with_properties then ["z1", str "test"; "z2", `Bool true] else [] in
              [ node ~properties:root_properties
                  ~children:[node "b1.1" ~children:
                               [node "b1.1.1" ~properties:leaf_properties; node "b1.1.2"];
                             node "b1.2"] "b1";
                node "b2" ] in
            let page_contents () =
              Client.query app
                ".ls-page-blocks .block-title-wrap, .ls-page-blocks .pv-scalar"
              |> List.map Client.text_content |> List.filter (fun text -> text <> "") in
            let expect_contents expected =
              ignore (Client.poll "Native batch block/value text order matches source" (fun () ->
                  if page_contents () = expected then Some () else None));
              Suite.equal ctx "Native UI preserves exact source batch block/value text order"
                (page_contents ()) expected in
            let page = "insert batch blocks" in
            new_page app page;
            let page_obj = Client.sdk_call app "get_block" [str page] in
            let result = Client.sdk_call app "insert_batch_block"
                [str (uuid page_obj); `List (batch false)] in
            let titles = ["b1"; "b1.1"; "b1.1.1"; "b1.1.2"; "b1.2"; "b2"] in
            expect_contents titles;
            Suite.equal ctx "SDK batch result is flattened in source hierarchy order"
              (result |> to_list |> List.map (fun block -> member "title" block |> to_string))
              titles;
            let page = "insert batch blocks with properties" in
            new_page app page;
            let page_obj = Client.sdk_call app "get_block" [str page] in
            let result = Client.sdk_call app "insert_batch_block"
                [str (uuid page_obj); `List (batch true);
                 `Assoc ["schema", `Assoc ["z3", str "page"; "z4", str "page"]]] in
            let refs = Client.wait_for ~text:"Page 3" app
                ".ls-page-blocks .pv-scalar" in
            Suite.check ctx "Source-required Page 3 property value is rendered with positive dimensions"
              (List.exists (fun el ->
                   let r = Client.rect el in
                   Client.text_content el = "Page 3" && r.width > 0. && r.height > 0.) refs);
            expect_contents ["b1"; "test"; "b1.1"; "b1.1.1"; "Page 1"; "Page 2";
                             "Page 3"; "b1.1.2"; "b1.2"; "b2"];
            Suite.equal ctx "Batch root retains source boolean property"
              (result |> to_list |> List.hd |> member ":plugin.property._test_plugin/z2")
              (`Bool true);
            validate ctx app;
            ignore (Client.screenshot app ~name:"sdk-batch-properties.png"))) ]
