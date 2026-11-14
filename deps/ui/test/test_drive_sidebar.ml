(* Melange host for the settings/sidebar merge scenarios in
   Shared_scenarios_sidebar — reuses the session Test_drive mounts, so
   run () must be invoked while that session is live. *)

open Test_check

let push_item key title : Sidebar_state.item =
  { Sidebar_state.key
  ; kind = "page"
  ; uuid = None
  ; title
  ; icon = None
  ; breadcrumb = []
  ; blocks = []
  ; linked_refs = []
  ; page_ref = Some title
  ; page = None
  ; props_collapsed = true
  ; collapsed = false
  }

let host () : (Model.t, Action.t) Shared_scenarios_sidebar.host =
  { base = Test_drive.shared_host ()
  ; storage_set = Ui_services.storage_set
  ; toggle_right_sidebar =
      (fun () ->
        Runtime.send Action.Toggle_right_sidebar;
        Runtime.flush ())
  ; push_right_item =
      (fun key title ->
        match Sidebar_state.current () with
        | Some st -> Sidebar_state.push_item st (push_item key title)
        | None -> check "sidebar state mounted" false)
  ; toggle_nav =
      (fun nav checked ->
        match Sidebar_state.current () with
        | Some st -> Sidebar_state.toggle_nav st nav checked
        | None -> check "sidebar state mounted" false)
  ; set_theme = (fun m -> Settings_view.use_mode m)
  ; set_language = (fun m -> Settings_view.set_language m)
  }

let block_instance_ownership () =
  let module E = Editor_state in
  let module A = Editor_actions in
  let module M = Drive.Model in
  let session = Test_drive.s () in
  let state = Option.get (Sidebar_state.current ()) in
  let previous_items = Runtime.signal_get state.items and previous_editor = E.read () in
  let previous_reader = !Runtime.read_model in
  let was_open = (Drive.Session.read_model session).Model.right_sidebar_open in
  let target = block ~children:[block "instance-child" "child"] "instance-target" "target" in
  let page_panel = { (push_item "instance-page" "page") with
    blocks = [block ~children:[block "instance-before" "before"; target] "instance-parent" "parent"] } in
  let block_panel = { (push_item "instance-root" "root") with
    kind = "block"; uuid = Some "instance-target"; blocks = [target] } in
  let rec scope_of node =
    let attrs = match M.string_prop node "data-attrs" with
      | Some encoded -> Lui_protocol.data_attrs_decode encoded | None -> [] in
    match List.assoc_opt "data-cid" attrs with
    | Some _ as scope -> scope
    | None -> List.find_map scope_of (M.children session.Drive.Session.tree node.M.id)
  in
  let panel_scope index =
    let body = Test_drive.first ("prop:accessibility-identifier=\"sidebar-panel-content-"
      ^ string_of_int index ^ "\"") in
    Option.get (Option.bind body scope_of)
  in
  Fun.protect ~finally:(fun () ->
    Runtime.read_model := previous_reader;
    Sidebar_state.set_items state previous_items;
    E.set (fun _ -> previous_editor);
    if (Drive.Session.read_model session).Model.right_sidebar_open <> was_open then
      Runtime.send Action.Toggle_right_sidebar)
    (fun () ->
      if not was_open then Runtime.send Action.Toggle_right_sidebar;
      Runtime.read_model := (fun () -> {(previous_reader ()) with Model.repo = Some "sidebar-occurrence-fixture"});
      E.set (fun editor -> {editor with E.editing = None});
      Sidebar_state.set_items state [page_panel; block_panel];
      let page_scope = panel_scope 0 and root_scope = panel_scope 1 in
      check "sidebar repeated instances have distinct rendered owners" (page_scope <> root_scope);
      let check_order () =
        List.iter (fun (scope, parent, index, previous) ->
          let found = Option.map (fun (parent, index) ->
            Option.bind parent (fun block -> block.Model.block_uuid), index)
              (E.find_parent_in_scope ~scope "instance-target") in
          check "sidebar occurrence resolves its own parent and index" (found = Some (parent, index));
          A.select_single_in ~scope "instance-target";
          check "sidebar occurrence keeps its own previous sibling"
            (Option.bind (E.prev_sibling "instance-target") (fun block -> block.Model.block_uuid) = previous))
          [page_scope, Some "instance-parent", 1, Some "instance-before";
           root_scope, None, 0, None]
      in
      check_order ();
      Sidebar_state.move_item state block_panel.key 0;
      check "sidebar panel reorder preserves occurrence identity"
        (panel_scope 0 = root_scope && panel_scope 1 = page_scope);
      check_order ();
      Sidebar_state.remove_item state block_panel.key;
      check "closing a sidebar occurrence retires its source and selection"
        (E.outliner_blocks_in_scope root_scope = None
         && E.selection_scope () <> root_scope);
      Sidebar_state.push_item state block_panel;
      E.set (fun editor -> {editor with E.editing = Some
        (E.mk_editing ~uuid:"instance-target" ~buffer:"target" ~caret:0 ~scope:root_scope ~base:"target" ())});
      Sidebar_state.remove_item state block_panel.key;
      Runtime.flush ();
      check "closing an editing occurrence exits its editor and retires its ownership"
        (E.editing () = None && E.outliner_blocks_in_scope root_scope = None
         && E.selection_scope () <> root_scope))

let pointer_reorder ~finish () =
  let session = Test_drive.s () in
  let state = Option.get (Sidebar_state.current ()) in
  let previous_items = Runtime.signal_get state.items in
  let previous_reader = !Runtime.read_model in
  let previous_generation = !Runtime.load_gen in
  let was_open = (Drive.Session.read_model session).Model.right_sidebar_open in
  if not was_open then Runtime.send Action.Toggle_right_sidebar;
  Runtime.read_model := (fun () ->
    { (previous_reader ()) with Model.repo = Some "sidebar-pointer-test"
    ; right_sidebar_open = (Drive.Session.read_model session).Model.right_sidebar_open });
  let document = Stub_dom.document () in
  let previous_get : string -> Js.Json.t = Stub_dom.get_field document "getElementById" in
  let order () = List.map (fun (item : Sidebar_state.item) -> item.key)
    (Runtime.signal_get state.items) in
  Stub_dom.set_field document "getElementById" (fun id ->
    match List.find_index (fun key -> id = "sbi-" ^ key) (order ()) with
    | None -> previous_get id
    | Some index ->
        let element = Stub_dom.make_element "div" in
        Stub_dom.set_field element "getBoundingClientRect" (fun () ->
          Js.Json.object_ (Js.Dict.fromList
            [ "x", Js.Json.number 100.; "y", Js.Json.number (100. +. float_of_int index *. 100.)
            ; "width", Js.Json.number 200.; "height", Js.Json.number 100. ]));
        element);
  let items = List.map (fun key -> { (push_item key key) with collapsed = true })
    ["pointer-a"; "pointer-b"; "pointer-c"] in
  Sidebar_state.set_items state items;
  let dispatch id event =
    match Test_drive.first ("prop:accessibility-identifier=\"" ^ id ^ "\"") with
    | Some node -> Drive.Session.dispatch session (event node.Drive.Model.id)
    | None -> check ("sidebar pointer target exists: " ^ id) false in
  let detail ?(button = 0) y : Lui_protocol.pointer_detail =
    { x = 120.; y; button; modifiers = 0; target_class = "" } in
  let drag key y =
    let id = "sidebar-panel-drag-" ^ key in
    dispatch id (fun node -> Lui_protocol.PointerDown (node, detail 110.));
    dispatch id (fun node -> Lui_protocol.PointerMove (node, detail y));
    id in
  let after_tasks callback = ignore (Ui_services.timers_timeout callback 0) in
  let id = drag "pointer-a" 380. in
  dispatch id (fun node -> Lui_protocol.PointerUp (node, detail 380.));
  after_tasks (fun () ->
    check "sidebar pointer drop reorders the source item"
      (order () = ["pointer-b"; "pointer-c"; "pointer-a"]);
    check "sidebar pointer reorder does not collapse or expand panels"
      (List.for_all (fun (item : Sidebar_state.item) -> item.collapsed)
        (Runtime.signal_get state.items));
    dispatch "sidebar-panel-header-2" (fun node -> Lui_protocol.NavigationKey (node, "ArrowUp", true));
    check "sidebar keyboard reorder remains available"
      (order () = ["pointer-b"; "pointer-a"; "pointer-c"]);
    dispatch "sidebar-panel-header-1" (fun node -> Lui_protocol.PointerUp (node, detail ~button:1 210.));
    check "sidebar middle-click closes the selected panel"
      (order () = ["pointer-b"; "pointer-c"]);
    let id = drag "pointer-b" 280. in
    dispatch id (fun node -> Lui_protocol.PointerCancel (node, detail 280.));
    dispatch id (fun node -> Lui_protocol.PointerUp (node, detail 280.));
    after_tasks (fun () ->
      check "cancelled sidebar drops cannot reorder panels"
        (order () = ["pointer-b"; "pointer-c"]);
      let id = drag "pointer-b" 280. in
      dispatch id (fun node -> Lui_protocol.PointerUp (node, detail 280.));
      incr Runtime.load_gen;
      after_tasks (fun () ->
        check "stale sidebar drops cannot reorder panels"
          (order () = ["pointer-b"; "pointer-c"]);
        dispatch "sidebar-panel-header-0" (fun node -> Lui_protocol.PointerUp (node, detail ~button:1 110.));
        dispatch "sidebar-panel-header-0" (fun node -> Lui_protocol.PointerUp (node, detail ~button:1 110.));
        check "middle-closing the last panel closes the right sidebar"
          (Runtime.signal_get state.items = [] && not (Drive.Session.read_model session).Model.right_sidebar_open);
        Stub_dom.set_field document "getElementById" previous_get;
        Runtime.read_model := previous_reader;
        Runtime.load_gen := previous_generation;
        Sidebar_state.set_items state previous_items;
        if (Drive.Session.read_model session).Model.right_sidebar_open <> was_open then
          Runtime.send Action.Toggle_right_sidebar;
        finish ())))

let run ~finish =
  (* The recording host tests preferences and remounts without a bundler.
     Supply a loaded dictionary instead of relying on a swallowed loader error. *)
  let previous_dictionary=Hashtbl.find_opt I18n.locale_tbls "fr" in
  Hashtbl.replace I18n.locale_tbls "fr"
    (Some (I18n.tbl_of_text "sidebar-locale-fixture" "{:nav/journals \"Fixture journals\"}"));
  Fun.protect ~finally:(fun () ->
    match previous_dictionary with
    | Some value -> Hashtbl.replace I18n.locale_tbls "fr" value
    | None -> Hashtbl.remove I18n.locale_tbls "fr")
    (fun () -> Shared_scenarios_sidebar.all (host ()));
  let was_open = (Runtime.model ()).Model.left_sidebar_open in
  let toggle () = Runtime.send Action.Toggle_left_sidebar; Runtime.flush () in
  if not was_open then toggle ();
  let st = Option.get (Sidebar_state.current ()) in
  Sidebar_state.toggle_menu st "nav-edit";
  Runtime.flush ();
  toggle ();
  check "closing a dock dismisses its owned menu"
    (Runtime.signal_get st.open_menu = "");
  toggle ();
  check "reopening a dock does not resurrect its old menu"
    (Runtime.signal_get st.open_menu = "");
  if not was_open then toggle ();
  block_instance_ownership ();
  pointer_reorder ~finish ()
