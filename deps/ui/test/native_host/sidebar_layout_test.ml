let check name condition = if not condition then failwith name

let () =
  Platform.install_ui_services ~assert_owner:(fun () -> ())
    ~request_flush:(fun () -> ()) ~dom:Ui_dom_native.ops
    ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  Host.set_window_size 1280. 900.;
  let store = Lui_store.create () and sidebar = ref None in
  let backend =
    { Lui_protocol.backend_profile =
        Lui_protocol.profile Lui_protocol.LinuxOS Lui_protocol.GenericHost
    ; apply_batch = (fun batch -> Lui_store.apply_batch store batch; true) } in
  let model = { Model.initial with right_sidebar_open = true } in
  let registry = Lui_extension.registry () in
  Logseq_editor.register registry;
  let app = Lui_app.create_with_extensions backend registry model Update.apply
      (fun context model _send ->
         Editor_state.ensure context;
         let state = Sidebar_state.ensure model in
         sidebar := Some state;
         Right_sidebar_view.inner state) in
  ignore (Lui_app.start app);
  Runtime.app_send := (fun action -> Lui_app.send app action);
  Runtime.app_flush := (fun () -> ignore (Lui_app.flush app));
  Runtime.read_model := (fun () -> Lui_app.model app);
  let state = Option.get !sidebar in
  let uuid = "11111111-2222-4333-8444-555555555555" in
  let page = Option.get (Decode.page_of_summary (Wire.Map
      [ Wire.Keyword "page-title", Wire.String "Contents"
      ; Wire.Keyword "page-uuid", Wire.Uuid uuid ])) in
  let item : Sidebar_state.item =
    { key = "contents-fixture"; kind = "contents"; uuid = Some uuid
    ; title = "Contents"; icon = None; breadcrumb = []; blocks = []
    ; linked_refs = []; page_ref = None; page = Some page
    ; props_collapsed = true; collapsed = false } in
  Runtime.signal_set state.items [ item ];
  ignore (Lui_app.flush app);
  let layout = Lui_layout.create () in
  let by_id name = List.find (fun id ->
      Lui_store.string_prop store id "accessibility-identifier" = Some name)
      (Lui_store.preorder store) in
  let rect id = Option.get (Lui_layout.rect layout id) in
  let sync () =
    ignore (Lui_app.flush app);
    Lui_layout.sync ~width:560. ~height:900. layout store in
  sync ();
  let body = by_id "sidebar-panel-content-0" in
  Sidebar_state.toggle_collapsed state item.key;
  sync ();
  check "collapsed sidebar bodies use typed display rather than an ignored hidden class"
    (Lui_store.string_prop store body "display" = Some "none");
  let card = by_id "sbi-contents-fixture" in
  check "collapsed sidebar cards shrink to the reference 32px header"
    ((rect card).h = 32.);
  check "collapsed sidebar bodies do not remain pointer targets"
    (Lui_layout.rect layout body = None);
  Sidebar_state.toggle_collapsed state item.key;
  sync ();
  check "reopening a sidebar card preserves its mounted body identity"
    (by_id "sidebar-panel-content-0" = body);
  check "expanded empty Contents cards retain the reference 220px body spacing"
    ((rect (by_id "sbi-contents-fixture")).h = 220.);
  let body_rect = rect body in
  let props = List.find (fun id ->
      Lui_store.string_prop store id "text" = Some (I18n.t "page/open-properties"))
      (Lui_store.preorder store) in
  let props_rect = rect props in
  check "sidebar properties controls retain the reference medium text weight"
    (Lui_store.int_prop store props "font-weight" = Some 500);
  check "sidebar properties controls override the compact control's horizontal padding"
    (Lui_store.int_prop store props "padding-horizontal" = Some 4);
  check "sidebar properties controls stay leading and compact"
    (props_rect.x = body_rect.x +. 20. && props_rect.y = body_rect.y +. 16.
     && props_rect.h = 28. && props_rect.w < 150.);
  check "expanded native sidebar disclosures use the existing down-caret icon"
    (List.exists (fun id -> Lui_store.string_prop store id "name"
        = Some "app:rotating-arrow-down") (Lui_store.preorder store));
  check "sidebar cards carry the reference rounded shadow surface"
    (Lui_store.int_prop store card "corner-radius" = Some 6
     && Lui_store.string_prop store card "shadow" <> None);
  let help = { item with key = "help-fixture"; kind = "help"; title = "Help"
                      ; page = None; collapsed = true } in
  Runtime.signal_set state.items [ help; item ];
  sync ();
  let first = rect (by_id "sbi-help-fixture")
  and second = rect (by_id "sbi-contents-fixture") in
  check "adjacent cards retain the reference eight-pixel drop-indicator spacing"
    (first.h = 32. && second.y = first.y +. first.h +. 8.);
  Runtime.signal_set state.items [ item ];
  Runtime.signal_set state.viewport_w 600.;
  sync ();
  check "small viewports retain the reference 16px gap instead of the desktop 32px gap"
    ((rect (by_id "sbi-contents-fixture")).h = 204.);
  let child_uuid = "33333333-4444-4555-8666-777777777777" in
  let child = Model.empty_block ~uuid:child_uuid ~title:"Sidebar child" ~is_page:false in
  Runtime.signal_set state.items [ { item with blocks = [ child ] } ];
  check "sidebar body edits invalidate the card that owns the changed descendant"
    (Sidebar_state.item_hits [ Subs_state.watch_key_uuid "entity" child_uuid ] state);
  check "unrelated body edits do not refetch sidebar cards"
    (not (Sidebar_state.item_hits
      [ Subs_state.watch_key_uuid "entity" "44444444-5555-4666-8777-888888888888" ] state));
  let previous_model = !Runtime.read_model in
  Runtime.read_model := (fun () -> { (previous_model ()) with repo = Some "sidebar-refresh-fixture" });
  let info = Wire.Map
      [ Wire.Keyword "page-title", Wire.String "Contents"
      ; Wire.Keyword "page-uuid", Wire.Uuid uuid ] in
  let pending, resolve, _ = Js.Promise.pending () in
  let dead, _, _ = Js.Promise.pending () in
  Runtime.worker := Some
    { Worker_client.invoke_fn = (fun method_ _args ->
        match method_ with
        | "thread-api/get-page-route-info" -> pending
        | "thread-api/get-page-blocks-tree" -> Js.Promise.resolve (Wire.Array
            [ Wire.Map [ Wire.Keyword "block/uuid", Wire.Uuid "22222222-3333-4444-8555-666666666666"
                ; Wire.Keyword "block/title", Wire.String "Refreshed sidebar content" ] ])
        | _ -> Js.Promise.resolve Wire.Nil)
    ; on_message = (fun _ _ -> ()); dead };
  Runtime.signal_set state.items [ item ];
  Editor_state.clear_overrides ();
  Editor_state.set (fun state -> { state with Editor_state.editing = Some
      (Editor_state.mk_editing ~uuid:"22222222-3333-4444-8555-666666666666"
         ~scope:"sidebar" ~buffer:"Old sidebar buffer" ~base:"Old sidebar buffer" ()) });
  Sidebar_state.refresh_items "sidebar-refresh-fixture" state;
  Runtime.signal_set state.items [ { item with collapsed = true; props_collapsed = false } ];
  resolve info;
  for _ = 1 to 20 do Host.drain (); ignore (Lui_app.flush app) done;
  let refreshed = List.hd (Runtime.signal_get state.items) in
  check "sidebar refresh publishes new body data"
    (List.exists (fun block -> block.Model.block_title = "Refreshed sidebar content") refreshed.blocks);
  check "a pending sidebar refresh preserves the latest fold and properties state"
    (refreshed.collapsed && not refreshed.props_collapsed && refreshed.key = item.key);
  check "a completed sidebar refresh resynchronizes its clean active editor"
    (match Editor_state.editing () with
     | Some edit -> edit.Editor_state.buffer = "Refreshed sidebar content"
     | None -> false);
  Editor_state.set (fun state -> { state with Editor_state.editing = Some
      (Editor_state.mk_editing ~uuid:"22222222-3333-4444-8555-666666666666"
         ~scope:"sidebar" ~buffer:"Old sidebar buffer" ~base:"Old sidebar buffer" ()) });
  let lookup, resolve_lookup, _ = Js.Promise.pending () in
  Runtime.worker := Some
    { Worker_client.invoke_fn = (fun method_ _args ->
        if method_ = "thread-api/pull" then lookup else Js.Promise.resolve Wire.Nil)
    ; on_message = (fun _ _ -> ()); dead };
  let referenced = Model.empty_block ~uuid:"22222222-3333-4444-8555-666666666666"
      ~title:"[[55555555-6666-4777-8888-999999999999]]" ~is_page:false in
  Runtime.signal_set state.items [ { item with blocks = [ referenced ]; collapsed = true } ];
  ignore (Outliner_ops.resync_open_editor ());
  Editor_state.set (fun state -> match state.Editor_state.editing with
      | Some edit -> { state with editing = Some
          (Editor_state.with_model edit (Edit_model.set_source edit.model "Input after refresh began")) }
      | None -> state);
  resolve_lookup Wire.Nil;
  for _ = 1 to 20 do Host.drain (); ignore (Lui_app.flush app) done;
  check "late editor resync cannot overwrite input typed while title resolution was pending"
    (match Editor_state.editing () with
     | Some edit -> edit.Editor_state.buffer = "Input after refresh began"
     | None -> false);
  let canonical_a = { referenced with Model.block_title = "Canonical A" } in
  let canonical_b = { referenced with Model.block_title = "[[66666666-7777-4888-8999-aaaaaaaaaaaa]]" } in
  let lookup_b, resolve_b, _ = Js.Promise.pending () in
  Runtime.worker := Some
    { Worker_client.invoke_fn = (fun method_ _args ->
        if method_ = "thread-api/pull" then lookup_b else Js.Promise.resolve Wire.Nil)
    ; on_message = (fun _ _ -> ()); dead };
  Editor_state.set (fun state -> { state with Editor_state.editing = Some
      (Editor_state.mk_editing ~uuid:"22222222-3333-4444-8555-666666666666"
         ~scope:"sidebar" ~buffer:"Canonical A" ~base:"Canonical A" ()) });
  Runtime.signal_set state.items [ { item with blocks = [ canonical_b ]; collapsed = true } ];
  ignore (Outliner_ops.resync_open_editor ());
  Runtime.signal_set state.items [ { item with blocks = [ canonical_a ]; collapsed = true } ];
  ignore (Outliner_ops.resync_open_editor ());
  resolve_b Wire.Nil;
  for _ = 1 to 20 do Host.drain (); ignore (Lui_app.flush app) done;
  check "stale title resolution cannot replace a newer canonical source that required no editor change"
    (match Editor_state.editing () with
     | Some edit -> edit.Editor_state.buffer = "Canonical A"
     | None -> false);
  let first_lookup, resolve_first, _ = Js.Promise.pending () in
  let second_lookup, resolve_second, _ = Js.Promise.pending () in
  let second_ref = "77777777-8888-4999-8aaa-bbbbbbbbbbbb" in
  let latest_title = "[[" ^ second_ref ^ "]]" in
  Runtime.worker := Some
    { Worker_client.invoke_fn = (fun method_ args ->
        match method_, List.rev args with
        | "thread-api/pull", Wire.Array [ _; Wire.Uuid uuid ] :: _ ->
          if uuid = second_ref then second_lookup else first_lookup
        | _ -> Js.Promise.resolve Wire.Nil)
    ; on_message = (fun _ _ -> ()); dead };
  Editor_state.set (fun state -> { state with Editor_state.editing = Some
      (Editor_state.mk_editing ~uuid:"22222222-3333-4444-8555-666666666666"
         ~scope:"sidebar" ~buffer:"Clean initial" ~base:"Clean initial" ()) });
  Runtime.signal_set state.items [ { item with blocks = [ canonical_b ]; collapsed = true } ];
  ignore (Outliner_ops.resync_open_editor ());
  Runtime.signal_set state.items [ { item with blocks =
      [ { canonical_b with Model.block_title = latest_title } ]; collapsed = true } ];
  ignore (Outliner_ops.resync_open_editor ());
  resolve_first Wire.Nil;
  for _ = 1 to 20 do Host.drain (); ignore (Lui_app.flush app) done;
  resolve_second Wire.Nil;
  for _ = 1 to 20 do Host.drain (); ignore (Lui_app.flush app) done;
  check "overlapping clean-editor resyncs keep the latest canonical source authoritative"
    (match Editor_state.editing () with
     | Some edit -> edit.Editor_state.buffer = latest_title
     | None -> false);
  Editor_state.set (fun state -> { state with Editor_state.editing = None });
  let pending, resolve, _ = Js.Promise.pending () in
  Runtime.worker := Some
    { Worker_client.invoke_fn = (fun method_ _args ->
        if method_ = "thread-api/get-page-route-info" then pending
        else Js.Promise.resolve Wire.Nil)
    ; on_message = (fun _ _ -> ()); dead };
  Sidebar_state.refresh_items "sidebar-refresh-fixture" state;
  Runtime.signal_set state.items [];
  resolve info;
  for _ = 1 to 20 do Host.drain (); ignore (Lui_app.flush app) done;
  check "a pending sidebar refresh cannot resurrect a card closed while it was loading"
    (Runtime.signal_get state.items = []);
  let old_info, resolve_old, _ = Js.Promise.pending () in
  let new_info, resolve_new, _ = Js.Promise.pending () in
  let version = ref "fresh" in
  Runtime.worker := Some
    { Worker_client.invoke_fn = (fun method_ args ->
        match method_, args with
        | "thread-api/get-page-route-info", [ _; Wire.String "First lookup" ] -> old_info
        | "thread-api/get-page-route-info", _ -> new_info
        | "thread-api/get-page-blocks-tree", _ -> Js.Promise.resolve (Wire.Array
            [ Wire.Map [ Wire.Keyword "block/uuid", Wire.Uuid "22222222-3333-4444-8555-666666666666"
                ; Wire.Keyword "block/title", Wire.String !version ] ])
        | _ -> Js.Promise.resolve Wire.Nil)
    ; on_message = (fun _ _ -> ()); dead };
  Runtime.signal_set state.items [ { item with kind = "page"; page_ref = Some "First lookup" } ];
  Sidebar_state.refresh_items "sidebar-refresh-fixture" state;
  Runtime.signal_set state.items [ { item with kind = "page"; page_ref = Some "Second lookup" } ];
  Sidebar_state.refresh_items "sidebar-refresh-fixture" state;
  resolve_new info;
  for _ = 1 to 20 do Host.drain (); ignore (Lui_app.flush app) done;
  version := "stale";
  resolve_old info;
  for _ = 1 to 20 do Host.drain (); ignore (Lui_app.flush app) done;
  let latest = List.hd (Runtime.signal_get state.items) in
  check "an older sidebar fetch cannot overwrite a newer completed refresh"
    (List.exists (fun block -> block.Model.block_title = "fresh") latest.blocks);
  Runtime.worker := None;
  Runtime.read_model := previous_model;
  ignore (Lui_app.dispose app);
  print_endline "native sidebar card layout: OK"
