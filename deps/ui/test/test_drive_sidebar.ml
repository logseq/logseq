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
  Runtime.signal_set state.items items;
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
        Runtime.signal_set state.items previous_items;
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
  pointer_reorder ~finish ()
