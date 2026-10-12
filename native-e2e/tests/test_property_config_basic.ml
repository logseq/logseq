module Basic = Test_property_basic

let source = "ocaml-e2e/test/test_property_config_basic.ml::"
let root = ".ls-property-dropdown"

let exact_label el label =
  Yojson.Safe.Util.member "text" el = `String label

let item app selector label =
  Client.poll ("native control " ^ label) (fun () ->
      Client.query app selector |> List.find_opt (fun el ->
          let r = Client.rect el in
          r.width > 0. && r.height > 0. && exact_label el label))

let click app selector label =
  let r = Client.rect (item app selector label) in
  Client.click_at app (int_of_float (r.x +. r.width /. 2.))
    (int_of_float (r.y +. r.height /. 2.))

let setup app name =
  let page = "Property config " ^ name in
  Basic.create_page app page;
  Basic.new_block app "property target";
  Basic.add_property app name "Text";
  Client.press app "Escape";
  ignore (Client.wait_for ~text:name app ".property-k");
  Basic.block_uuid app page "property target"

let open_menu app name =
  Client.click ~text:name app ".property-k";
  ignore (Client.wait_for app root)

let open_choices app name =
  open_menu app name;
  click app (root ^ " menuitem") "Available choices";
  ignore (item app (root ^ " menuitem") "Add choice")

let choice app title = item app (root ^ " menu-trigger") title

let add_choice app title =
  click app (root ^ " menuitem") "Add choice";
  ignore (Client.wait_for app (root ^ " input"));
  Client.fill app (root ^ " input") title;
  click app (root ^ " button") "Save";
  ignore (choice app title)

let open_choice_settings app title =
  let trigger = choice app title in
  let r = Client.rect trigger in
  Client.click_at app (int_of_float (r.x +. r.width /. 2.))
    (int_of_float (r.y +. r.height /. 2.));
  ignore (item app "menuitem" "Edit");
  trigger

let dismiss app = Client.press app "Escape"; Client.press app "Escape"

let absent_choice ctx app title =
  ignore (Client.poll ("choice removed " ^ title) (fun () ->
      if Client.query app (root ^ " menu-trigger")
         |> List.exists (fun el -> exact_label el title)
      then None else Some ()));
  Suite.check ctx ("No obsolete choice " ^ title)
    (not (Client.query app (root ^ " menu-trigger")
          |> List.exists (fun el -> exact_label el title)))

let reactive_choices ctx =
  Basic.with_app ctx (fun app ->
      let name = "reactive-priority" in
      ignore (setup app name);
      open_choices app name;
      add_choice app "Choice before";
      ignore (open_choice_settings app "Choice before");
      click app "menuitem" "Edit";
      Client.fill app (root ^ " input") "Choice after";
      click app (root ^ " button") "Save";
      ignore (choice app "Choice after");
      absent_choice ctx app "Choice before";
      ignore (open_choice_settings app "Choice after");
      click app "menuitem" "Set as default choice";
      dismiss app;
      open_choices app name;
      add_choice app "Choice to delete";
      ignore (open_choice_settings app "Choice to delete");
      click app "menuitem" "Delete";
      absent_choice ctx app "Choice to delete";
      dismiss app;
      Basic.new_block app "closed choice target";
      Client.press app "Mod+p";
      Client.fill app ".ls-property-dialog input" name;
      Client.click ~text:name app ".ls-property-dialog li";
      ignore (Client.wait_for app
                (Printf.sprintf ".ls-property-dialog input[placeholder='Set %s']" name));
      Suite.check ctx "Closed choices do not offer Empty"
        (not (Client.query app ".ls-property-dialog li"
              |> List.exists (fun el -> exact_label el "Empty")));
      Client.click ~text:"Choice after" app ".ls-property-dialog li";
      ignore (Client.wait_for ~text:"Choice after" app ".ls-page-blocks .ls-block");
      let uuid = Basic.block_uuid app ("Property config " ^ name) "closed choice target" in
      Suite.equal ctx "The configured choice is persisted on the new target"
        (Basic.property_value app uuid name)
        (Wire.Set [Wire.Array [Wire.String "Choice after"]]);
      Basic.validate_graph ctx app)

let mod_p_text ctx =
  Basic.with_app ctx (fun app ->
      let name = "mod-p-text" and value = "created from mod p" in
      Basic.create_page app "Mod p text property";
      Basic.new_block app "mod p target";
      Client.press app "Mod+p";
      Client.fill app ".ls-property-dialog input" name;
      Client.click ~text:"New option:" app ".ls-property-dialog li";
      Basic.click_exact app ".ls-property-dialog menuitem" "Text";
      ignore (Client.wait_for app ".property-value-container input");
      Client.text app value;
      let uuid = Basic.block_uuid app "Mod p text property" "mod p target" in
      Basic.text_value ctx app uuid name value;
      ignore (Client.wait_for ~text:name app ".property-k");
      Basic.validate_graph ctx app)

let table_headers ctx =
  Basic.with_app ctx (fun app ->
      let name = "table-without-internal-id" in
      ignore (setup app name);
      dismiss app;
      Basic.create_page app name;
      let headers = Client.wait_for app ".ls-view-body .ls-table-header-cell" in
      Suite.check ctx "Property object view has visible table headers" (headers <> []);
      Suite.equal ctx "The internal id column is absent"
        (List.filter (fun el -> String.trim (Client.text_content el) = "#") headers) [];
      Basic.validate_graph ctx app)

let first_anchor ctx =
  Basic.with_app ctx (fun app ->
      ignore (setup app "choice-more-settings-pos");
      open_choices app "choice-more-settings-pos";
      add_choice app "option1";
      let trigger = open_choice_settings app "option1" in
      let menus = Client.wait_for ~text:"Set as default choice" app "dropdown-menu" in
      let t = Client.rect trigger and m = Client.rect (List.hd menus) in
      let dx = min (abs_float (m.x -. (t.x +. t.width)))
          (min (abs_float (m.x +. m.width -. t.x)) (abs_float (m.x -. t.x))) in
      let dy = min (abs_float (m.y -. (t.y +. t.height)))
          (abs_float (m.y +. m.height -. t.y)) in
      Suite.check ctx "First-open choice menu is anchored beside its actual trigger"
        (m.x > 8. && m.y > 8. && dx < 240. && dy < 120.);
      ignore (Client.screenshot app ~name:"choice-first-open.png");
      Basic.validate_graph ctx app)

let scroll_choices ctx =
  Basic.with_app ctx (fun app ->
      ignore (setup app "many-choices-scroll");
      open_choices app "many-choices-scroll";
      for i = 1 to 15 do add_choice app (Printf.sprintf "Choice %d" i) done;
      let scroller = Client.wait_for app (root ^ " scroll") |> List.hd |> Client.rect in
      let before = choice app "Choice 15" |> Client.rect in
      Suite.check ctx "Fifteen choices overflow their viewport"
        (before.y +. before.height > scroller.y +. scroller.height);
      Client.move app (int_of_float (scroller.x +. scroller.width /. 2.))
        (int_of_float (scroller.y +. scroller.height /. 2.));
      Client.wheel app (-20);
      let after = Client.poll "Native choice list scrolls to the last choice" (fun () ->
          let r = Client.rect (choice app "Choice 15") in
          if r.y < before.y && r.y >= scroller.y
             && r.y +. r.height <= scroller.y +. scroller.height +. 1.
          then Some r else None) in
      Suite.check ctx "Choice 15 is visible after native wheel scrolling" (after.y < before.y);
      ignore (Client.screenshot app ~name:"choices-scrolled.png");
      Basic.validate_graph ctx app)

let text_default ctx =
  Basic.with_app ctx (fun app ->
      let name = "ui-default-value" and value = "shipped default" in
      ignore (setup app name);
      open_menu app name;
      click app (root ^ " menuitem") "Default value";
      click app (root ^ " menuitem") "Set default value";
      ignore (Client.wait_for app (root ^ " input"));
      Client.text app value;
      Client.press app "Enter";
      ignore (Client.wait_for ~text:value app root);
      let saved () = Client.q app ~inputs:[Wire.String name]
          "[:find ?title :in $ ?name :where [?p :block/title ?name] [?p :logseq.property/default-value ?v] [?v :block/title ?title]]" in
      let expected = Wire.Set [Wire.Array [Wire.String value]] in
      ignore (Client.poll "Configured default value is persisted" (fun () ->
          if saved () = expected then Some () else None));
      Suite.equal ctx "Text default is saved exactly once" (saved ()) expected;
      dismiss app;
      open_menu app name;
      ignore (item app (root ^ " menuitem") "Default value");
      Basic.validate_graph ctx app)

let tests =
  List.map (fun (name, run) -> Suite.test ~covers:[source ^ name] name run)
    [ "property-table-hides-internal-id-column-test", table_headers
    ; "property-choice-more-settings-menu-anchors-on-first-open-test", first_anchor
    ]
