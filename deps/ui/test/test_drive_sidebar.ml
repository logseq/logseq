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

let run () =
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
  if not was_open then toggle ()
