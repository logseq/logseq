let source = "ocaml-e2e/test/test_property_basic.ml::"

let with_app ctx run =
  Suite.with_app ctx
    ~initialize:(fun app ->
      let file = Filename.concat (Client.settings app) "ui-state.json" in
      Yojson.Safe.to_file file
        (`Assoc ["preferred-language", `String "\"en\"";
                 "developer-mode", `String "\"true\""])) run

let contains text part =
  let rec loop i =
    i + String.length part <= String.length text &&
    (String.sub text i (String.length part) = part || loop (i + 1))
  in loop 0

let wait_absent app selector =
  Client.poll ("absent " ^ selector) (fun () ->
      if Client.query app selector = [] then Some () else None)

let create_page app name =
  Client.press app "Mod+k";
  ignore (Client.wait_for app ".cp__cmdk-search-input");
  Client.fill app ".cp__cmdk-search-input" name;
  ignore (Client.wait_for ~text:name app ".cp__cmdk-search-input");
  ignore (Client.wait_for ~text:name app ".cp__cmdk-item-main-text");
  Client.click ~text:name app "[data-cmdk-item]";
  ignore (Client.wait_for ~text:name app ".ls-page-title .block-title-wrap")

let new_block app title =
  Client.click app ".block-add-button";
  ignore (Client.wait_for app ".block-editor");
  Client.text app title;
  ignore (Client.poll ("editor " ^ title) (fun () ->
      if Client.query app ".ls-page-blocks .ls-block"
         |> List.exists (fun el -> Client.attr el "data-block-title" = Some title)
      then Some () else None))

let click_exact app selector label =
  let el = Client.poll ("control " ^ label) (fun () ->
      Client.query app selector |> List.find_opt (fun el ->
          String.trim (Client.text_content el) = label)) in
  let r = Client.rect el in
  Client.click_at app (int_of_float (r.x +. r.width /. 2.))
    (int_of_float (r.y +. r.height /. 2.))

let block_uuid app page title =
  Client.poll ("saved block " ^ title) (fun () ->
      let result = Client.q app ~inputs:[Wire.String page]
          "[:find ?uuid ?title :in $ ?page :where [?p :block/title ?page] [?b :block/page ?p] [?b :block/title ?title] [?b :block/uuid ?uuid]]" in
      let ids = Wire.elems result |> List.filter_map (function
          | Wire.Array [Wire.Uuid uuid; Wire.String stored]
            when String.trim stored = title -> Some uuid
          | _ -> None) in
      match ids with [uuid] -> Some uuid | _ -> None)

let validate_graph ctx app =
  let result = Client.validate app in
  Suite.equal ctx "Graph validation returns no errors" (Wire.get result "errors") (Some Wire.Nil);
  Suite.equal ctx "Graph validation finds no invalid entities"
    (Wire.get result "invalid-entity-ids") (Some (Wire.Array []));
  Client.press app "Escape";
  Client.press app "Escape";
  Client.press app "Mod+k";
  ignore (Client.wait_for app ".cp__cmdk-search-input");
  Client.fill app ".cp__cmdk-search-input" "(Dev) Validate current graph";
  let command = "[data-cmdk-group-kind='commands'] [data-cmdk-item]" in
  ignore (Client.wait_for ~text:"Validate current graph" app command);
  Client.click ~text:"Validate current graph" app command;
  ignore (Client.wait_for ~text:"Your graph is valid" app "toast.success");
  Suite.check ctx "The production graph validation action succeeds"
    (Client.query app "toast.success" |> List.exists (fun el ->
         String.starts_with ~prefix:"Your graph is valid" (Client.text_content el)))

let add_property app name kind =
  Client.text app " /";
  ignore (Client.wait_for app ".ui__popover-content .menu-link");
  Client.text app "Add property";
  ignore (Client.wait_for ~text:"Add property" app ".ui__popover-content .menu-link.chosen");
  Client.click ~text:"Add property" app ".ui__popover-content .menu-link.chosen";
  ignore (Client.wait_for app ".ls-property-dialog input");
  Client.fill app ".ls-property-dialog input" name;
  ignore (Client.wait_for ~text:"New option:" app ".ls-property-dialog li");
  Client.click ~text:"New option:" app ".ls-property-dialog li";
  ignore (Client.wait_for ~text:kind app ".ls-property-dialog menuitem");
  click_exact app ".ls-property-dialog menuitem" kind

let property_type app name =
  Client.q app ~inputs:[Wire.String name]
    "[:find ?type :in $ ?name :where [?p :block/title ?name] [?p :logseq.property/type ?type]]"

let property_value app uuid name =
  Client.q app ~inputs:[Wire.Uuid uuid; Wire.String name]
    "[:find ?value :in $ ?uuid ?name :where [?b :block/uuid ?uuid] [?p :block/title ?name] [?p :db/ident ?a] [?b ?a ?v] [?v :block/title ?value]]"

let text_value ctx app uuid name text =
  Client.press app "Escape";
  let expected = Wire.Set [Wire.Array [Wire.String text]] in
  ignore (Client.poll ("persist property " ^ name) (fun () ->
      if property_value app uuid name = expected then Some () else None));
  Suite.equal ctx "Exact property text is persisted" (property_value app uuid name) expected;
  ignore (Client.wait_for ~text:text app ("#ls-block-" ^ uuid ^ " .property-pair"));
  Suite.check ctx "Property value renders in its owner"
    (Client.query app ("#ls-block-" ^ uuid ^ " .property-pair")
     |> List.exists (fun el -> contains (Client.text_content el) text))

let new_properties ctx =
  with_app ctx (fun app ->
      let page = "Seven Property Types" in
      let prefix = "new-property-test" in
      let kinds = ["Text", "default"; "Number", "number"; "Date", "date";
                   "DateTime", "datetime"; "Checkbox", "checkbox";
                   "URL", "url"; "Node", "node"] in
      create_page app page;
      List.iter (fun (kind, _) ->
          new_block app (prefix ^ "-" ^ kind);
          Client.press app "Escape";
          ignore (block_uuid app page (prefix ^ "-" ^ kind))) kinds;
      List.iter (fun (kind, ty) ->
          let title = prefix ^ "-" ^ kind in
          let name = "p-" ^ title in
          let uuid = block_uuid app page title in
          Client.click ~text:title app ".ls-page-blocks .block-title-wrap";
          Client.press app "Ctrl+e";
          ignore (Client.wait_for app ("#ls-block-" ^ uuid ^ " .block-editor"));
          Suite.check ctx "Property creation edits the intended block"
            (Client.query app ("#ls-block-" ^ uuid ^ " .block-editor") <> []);
          add_property app name kind;
          let expected_type = Wire.Set [Wire.Array [Wire.Keyword ty]] in
          ignore (Client.poll ("property type " ^ name) (fun () ->
              if property_type app name = expected_type then Some () else None));
          Suite.equal ctx (kind ^ " property has its selected type")
            (property_type app name) expected_type;
          (match kind with
           | "Text" ->
               Client.click app ("#ls-block-" ^ uuid ^ " .property-value-container");
               ignore (Client.wait_for app ("#ls-block-" ^ uuid ^ " .property-value-container input"));
               Client.click app ("#ls-block-" ^ uuid ^ " .property-value-container input");
               Client.text app "Text";
               text_value ctx app uuid name "Text"
           | "Number" ->
               let selector = Printf.sprintf ".ls-property-dialog input[placeholder='Set %s']" name in
               ignore (Client.wait_for app selector);
               Client.fill app selector "111";
               Client.click ~text:"New option:" app ".ls-property-dialog li";
               let query () = Client.q app ~inputs:[Wire.Uuid uuid; Wire.String name]
                   "[:find ?v :in $ ?uuid ?name :where [?b :block/uuid ?uuid] [?p :block/title ?name] [?p :db/ident ?a] [?b ?a ?v]]" in
               let number () = match query () with
                 | Wire.Set [Wire.Array [Wire.Int n]] -> Some (float_of_int n)
                 | Wire.Set [Wire.Array [Wire.Float n]] -> Some n
                 | _ -> None in
               ignore (Client.poll "numeric property commit" (fun () ->
                   if number () = Some 111. then Some () else None));
               Suite.equal ctx "Numeric property stores the entered number" (number ()) (Some 111.)
           | "Date" | "DateTime" ->
               ignore (Client.wait_for app ".ls-property-dialog input");
               Client.press app "Enter";
               Client.press app "Escape";
               wait_absent app ".ls-property-dialog"
           | "Node" ->
               Client.click ~text:"Skip choosing tag" app ".ls-property-dialog li";
               ignore (Client.wait_for app ".ls-property-dialog input");
               Client.fill app ".ls-property-dialog input" (prefix ^ "-Node-value");
               Client.click ~text:"New option:" app ".ls-property-dialog li";
               ignore (Client.wait_for ~text:(prefix ^ "-Node-value") app ("#ls-block-" ^ uuid));
               Suite.check ctx "The node property renders the newly created value"
                 (Client.query app ("#ls-block-" ^ uuid ^ " .property-value-container") <> [])
           | "Checkbox" | "URL" -> Client.press app "Escape"
           | _ -> failwith "Unexpected property type");
          Client.press app "Escape") kinds;
      validate_graph ctx app;
      ignore (Client.screenshot app ~name:"seven-types.png"))

let lifecycle ctx =
  with_app ctx (fun app ->
      let page = "Property Lifecycle" in
      let name = "property-value-lifecycle" in
      let title = "property value target" in
      create_page app page;
      new_block app title;
      add_property app name "Text";
      let uuid = block_uuid app page title in
      let input = "#ls-block-" ^ uuid ^ " .property-value-container input" in
      Client.click app ("#ls-block-" ^ uuid ^ " .property-value-container");
      ignore (Client.wait_for app input);
      Client.click app input;
      Client.text app "Initial value";
      text_value ctx app uuid name "Initial value";
      create_page app name;
      ignore (Client.wait_for ~text:title app ".ls-view-body");
      Suite.check ctx "The property object view contains its owner"
        (Client.query app ".ls-view-body" |> List.exists (fun el -> contains (Client.text_content el) title));
      Client.reload app;
      create_page app name;
      ignore (Client.wait_for ~text:title app ".ls-view-body");
      Suite.check ctx "The object relation survives host reload"
        (Client.query app ".ls-view-body" |> List.exists (fun el -> contains (Client.text_content el) title));
      create_page app page;
      Client.click app ("#ls-block-" ^ uuid ^ " .property-value-container .pv-scalar");
      ignore (Client.wait_for app input);
      Client.fill app input "Updated value";
      text_value ctx app uuid name "Updated value";
      Client.click ~text:name app ("#ls-block-" ^ uuid ^ " .property-k");
      ignore (Client.wait_for ~text:"Delete property from node" app "menuitem");
      Client.click ~text:"Delete property from node" app "menuitem";
      ignore (Client.wait_for ~text:"Confirm" app "dialog button");
      Client.click ~text:"Confirm" app "dialog button";
      wait_absent app ("#ls-block-" ^ uuid ^ " .property-pair");
      Suite.equal ctx "Removing a property removes its owner row"
        (Client.query app ("#ls-block-" ^ uuid ^ " .property-pair")) [];
      create_page app name;
      ignore (Client.poll "owner removed from property view" (fun () ->
          if Client.query app ".ls-view-body" |> List.exists (fun el ->
                 contains (Client.text_content el) title)
          then None else Some ()));
      let own_value = Client.q app ~inputs:[Wire.Uuid uuid; Wire.String name]
          "[:find ?v :in $ ?uuid ?name :where [?b :block/uuid ?uuid] [?p :block/title ?name] [?p :db/ident ?a] [?b ?a ?v]]" in
      Suite.equal ctx "Removing the property retracts its persisted relation" own_value (Wire.Set []);
      validate_graph ctx app;
      ignore (Client.screenshot app ~name:"lifecycle-deleted.png"))

let keyboard_highlight ctx =
  with_app ctx (fun app ->
      create_page app "Property Keyboard";
      new_block app "picker target";
      Client.press app "Mod+p";
      let candidates =
        Client.poll "property candidates" (fun () ->
            match Client.query app ".ls-property-dialog li" with
            | first :: second :: _ -> Some (first, second)
            | _ -> None)
      in
      let first, second = candidates in
      let first_label = String.trim (Client.text_content first) in
      let highlighted = String.trim (Client.text_content second) in
      Suite.check ctx "The initial property candidate has a label" (first_label <> "");
      Suite.check ctx "Down has a distinct second candidate" (first_label <> highlighted);
      Client.press app "Down";
      let selected = Client.wait_for ~text:highlighted app ".ls-property-dialog li.chosen" in
      Suite.equal ctx "Down moves the visible highlight"
        (List.map (fun el -> String.trim (Client.text_content el)) selected) [highlighted];
      ignore (Client.screenshot app ~name:"picker-after-down.png");
      Client.press app "Enter";
      ignore (Client.poll "leave property candidates after Enter" (fun () ->
          if Client.query app ".ls-property-dialog li"
             |> List.exists (fun el -> String.trim (Client.text_content el) = first_label)
          then None else Some ()));
      let expected =
        Printf.sprintf ".ls-property-dialog input[placeholder='Set %s']" highlighted
      in
      ignore (Client.wait_for app expected);
      Suite.check ctx "Enter opens the highlighted property value editor"
        (Client.query app expected <> []);
      let wrong =
        Printf.sprintf ".ls-property-dialog input[placeholder='Set %s']" first_label
      in
      wait_absent app wrong;
      Suite.equal ctx "The first candidate was not submitted" (Client.query app wrong) [];
      Client.press app "Escape";
      validate_graph ctx app)

let tests =
  [ Suite.test ~covers:[source ^ "keyboard-highlight-selects-property-test"]
      "keyboard-highlight-selects-property-test" keyboard_highlight ]
