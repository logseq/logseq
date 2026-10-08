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
  ; set_language =
      (fun m ->
        (* the locale chunk loader resolves lui-shims/lazy-assets, which
           only exists in the app bundle — storage_set/doc_set_lang run
           before it raises, so the persisted contract is still real *)
        try Settings_view.set_language m with _ -> ())
  }

let run () = Shared_scenarios_sidebar.all (host ())
