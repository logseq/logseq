open Yojson.Safe.Util

let open_navigation_filter app =
  let sidebar = List.hd (Client.query app "#left-sidebar") in
  if (Client.rect sidebar).width < 1. then Client.click app "#left-menu";
  let header = List.hd (Client.wait_for app ".sidebar-header-container .sidebar-content-group .hd") in
  let r = Client.rect header in
  Client.move app (int_of_float (r.x +. r.width /. 2.))
    (int_of_float (r.y +. r.height /. 2.));
  Client.click app ".sidebar-header-container .as-edit";
  ignore (Client.wait_for app "[role='menuitemcheckbox']")

let set_navigation ctx app label checked =
  open_navigation_filter app;
  let selector = "[role='menuitemcheckbox']" in
  let items = Client.wait_for ~text:label app selector in
  let item = List.find (fun el -> Client.text_content el = label) items in
  if Client.attr item "aria-checked" <> Some (string_of_bool checked) then
    Client.click ~text:label app selector;
  let item = List.find (fun el -> Client.text_content el = label)
    (Client.wait_for ~text:label app selector) in
  Suite.equal ctx "Navigation menu retains the requested checkbox state"
    (Client.attr item "aria-checked") (Some (string_of_bool checked));
  Client.press app "Escape";
  ignore (Client.poll "navigation menu dismissed" (fun () ->
      if Client.query app selector = [] then Some () else None))

let assert_class_navigations ctx app =
  List.iter (fun (nav, title) ->
      let selector = ".sidebar-navigations ." ^ nav in
      ignore (Client.wait_for app selector);
      Suite.equal ctx "Selected class navigation occurs once"
        (List.length (Client.query app selector)) 1;
      Client.click app selector;
      ignore (Client.poll "selected class page title" (fun () ->
          if Test_right_sidebar.title app = title then Some () else None));
      Suite.equal ctx "Selected navigation opens its class page"
        (Test_right_sidebar.title app) title;
      let page = Client.sdk_call app "get_current_page" [] in
      let uuid = page |> member "uuid" |> to_string in
      Suite.equal ctx "Class route resolves to the persisted page"
        (Client.q ~inputs:[Wire.Uuid uuid] app
          "[:find ?title :in $ ?uuid :where [?p :block/uuid ?uuid] [?p :block/title ?title]]")
        (Wire.Set [Wire.Array [Wire.String title]]))
    ["tasks", "Task"; "assets", "Asset"]

let command app label =
  Client.press app "Mod+k";
  ignore (Client.wait_for app ".cp__cmdk-search-input");
  Client.fill app ".cp__cmdk-search-input" label;
  Client.click ~text:label app "[data-cmdk-group-kind='commands'] [data-cmdk-item]"

let tests =
  [ Suite.test
      ~covers:["ocaml-e2e/test/test_left_sidebar_basic.ml::selected-class-navigations-survive-graph-lifecycle-test"]
      "selected-class-navigations-survive-graph-lifecycle-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            Test_right_sidebar.create_page app "Left sidebar navigation source";
            List.iter (fun label -> set_navigation ctx app label true) ["Tasks"; "Assets"];
            assert_class_navigations ctx app;
            List.iter (fun (label, nav) ->
                set_navigation ctx app label false;
                Suite.equal ctx "Deselected navigation is removed"
                  (Client.query app (".sidebar-navigations ." ^ nav)) [];
                set_navigation ctx app label true;
                Suite.check ctx "Reselected navigation is visible"
                  (Client.wait_for app (".sidebar-navigations ." ^ nav) <> []))
              ["Tasks", "tasks"; "Assets", "assets"];
            Client.reload app;
            ignore (Client.wait_for app ".sidebar-navigations .tasks");
            assert_class_navigations ctx app;
            command app "Add a DB graph";
            let name = "sidebar-navigation-lifecycle" in
            let repo = "logseq_db_" ^ name in
            Client.fill app ".new-graph input" name;
            Client.click ~text:"Submit" app ".new-graph button";
            ignore (Client.poll "new graph is selected" (fun () ->
                if Client.sdk_call app "get_current_graph" [] |> member "url" = `String repo
                then Some () else None));
            let _, _, actual_repo = Client.daemon ~repo app in
            Suite.equal ctx "New local graph has a real ready worker" actual_repo repo;
            assert_class_navigations ctx app;
            command app "Go to all graphs";
            Client.click app "[aria-label='logseq/graphs/Demo']";
            ignore (Client.poll "Demo graph is selected" (fun () ->
                if Client.sdk_call app "get_current_graph" [] |> member "url" = `String "logseq_db_Demo"
                then Some () else None));
            assert_class_navigations ctx app;
            ignore (Client.screenshot ~name:"left-navigation-lifecycle.png" app);
            List.iter (fun label -> set_navigation ctx app label false) ["Tasks"; "Assets"];
            Test_right_sidebar.validate_graph ctx app))
  ]
