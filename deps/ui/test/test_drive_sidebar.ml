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

let native_sidebar_resize_units () =
  let session = Test_drive.s () in
  let previous_reader = !Runtime.read_model in
  let live_model () = Drive.Session.read_model session in
  (* Test_drive keeps a separate staged model for SDK probes. Native resize
     callbacks must observe the same live reducer state their sends update. *)
  Fun.protect ~finally:(fun () -> Runtime.read_model := previous_reader) (fun () ->
    Runtime.read_model := live_model;
    let st = Option.get (Sidebar_state.current ()) in
    let viewport = Runtime.signal_get st.viewport_w in
    let left = Runtime.signal_get st.left_width in
    let right = Runtime.signal_get st.right_fraction in
    let model = live_model () in
    let keys = [Sidebar_state.left_width_key; "ls-right-sidebar-width"; "ls-left-sidebar-open?"] in
    let storage = List.map (fun key -> key, Ui_services.storage_get key) keys in
    let set_open desired current action = if desired <> current then Runtime.send action in
    Fun.protect ~finally:(fun () ->
      Runtime.signal_set st.viewport_w viewport;
      Runtime.signal_set st.left_width left;
      Runtime.signal_set st.right_fraction right;
      set_open model.Model.left_sidebar_open (live_model ()).Model.left_sidebar_open Action.Toggle_left_sidebar;
      set_open model.Model.right_sidebar_open (live_model ()).Model.right_sidebar_open Action.Toggle_right_sidebar;
      List.iter (fun (key, value) -> match value with
        | Some value -> Ui_services.storage_set key value
        | None -> Ui_services.storage_remove key) storage;
      Runtime.flush ()) (fun () ->
      Runtime.signal_set st.viewport_w 1000.;
      Sidebar_state.on_native_left_split_resize st (Lui_protocol.ValueChanged (0, 330.));
      Runtime.flush ();
      check "native left resize opens and persists absolute points"
        ((live_model ()).Model.left_sidebar_open
         && Runtime.signal_get st.left_width = 330.
         && Ui_services.storage_get Sidebar_state.left_width_key = Some "330");
      Sidebar_state.on_native_left_split_resize st (Lui_protocol.ValueChanged (0, 0.));
      Runtime.flush ();
      check "native left close keeps its saved nonzero width"
        (not (live_model ()).Model.left_sidebar_open && Runtime.signal_get st.left_width = 330.);
      Sidebar_state.on_native_right_split_resize ~available_width:800. st
        (Lui_protocol.ValueChanged (0, 480.));
      Runtime.flush ();
      check "native right resize uses measured content instead of the window"
        ((live_model ()).Model.right_sidebar_open
         && abs_float (Runtime.signal_get st.right_fraction -. 0.4) < 0.000001
         && Ui_services.storage_get "ls-right-sidebar-width" = Some "0.4");
      Sidebar_state.on_native_right_split_resize ~available_width:800. st
        (Lui_protocol.ValueChanged (0, 800.));
      Runtime.flush ();
      check "native right close keeps the persisted fraction"
        (not (live_model ()).Model.right_sidebar_open
         && abs_float (Runtime.signal_get st.right_fraction -. 0.4) < 0.000001);
      let rejected = try
        Sidebar_state.on_native_right_split_resize ~available_width:0. st
          (Lui_protocol.ValueChanged (0, 480.)); false
        with Invalid_argument _ -> true in
      check "native resize rejects absent geometry instead of assuming window width" rejected))

let native_sidebar_geometry ~finish () =
  let scheduler = Signal.scheduler () in
  let scope = Signal.scope "native-sidebar-geometry-test" in
  let cancelled = ref 0 and replies = ref [] in
  let measure identifier =
    check "native measurement targets its retained content host" (identifier = "nsh-right-split-space");
    Ui_task.create ~cancel:(fun () -> incr cancelled) (fun ~resolve ~reject:_ ->
      replies := !replies @ [resolve]) in
  let width, refresh = Sidebar_state.native_right_geometry ~scheduler ~scope ~measure in
  let after_tasks run =
    let barrier = Ui_task.bind (Ui_task.resolve ()) (fun () -> Ui_task.resolve ()) in
    ignore (Ui_task.bind barrier (fun () -> run (); Ui_task.resolve ())) in
  refresh ();
  refresh ();
  check "new native geometry cancels the superseded request" (!cancelled = 1);
  (List.nth !replies 0) (0., 0., 100., 400.);
  (List.nth !replies 1) (0., 0., 800., 400.);
  after_tasks (fun () ->
    Signal.stabilize scheduler;
    check "late geometry cannot overwrite the latest content width"
      (match Signal.get width with Ui_effect.Ready width -> width = 800. | _ -> false);
    let delivered = ref false in
    refresh ~after:(fun _ -> delivered := true) ();
    Signal.dispose_scope scope;
    (List.nth !replies 2) (0., 0., 700., 400.);
    after_tasks (fun () ->
      check "disposed sidebar cancels measurement and ignores a queued reply"
        (!cancelled = 2 && not !delivered);
      finish ()))

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
  native_sidebar_resize_units ();
  native_sidebar_geometry ~finish:(fun () -> pointer_reorder ~finish ()) ()
