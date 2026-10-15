let check name condition = if not condition then failwith name
let () =
  Platform.install_ui_services ~assert_owner:(fun () -> ())
    ~request_flush:(fun () -> ()) ~dom:Ui_dom_native.ops
    ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  let store = Lui_store.create () and sidebar = ref None in
  let backend = { Lui_protocol.backend_profile =
      Lui_protocol.profile Lui_protocol.LinuxOS Lui_protocol.GenericHost
      ; apply_batch = (fun batch -> Lui_store.apply_batch store batch; true) } in
  let registry = Lui_extension.registry () in
  Logseq_editor.register registry;
  let app = Lui_app.create_with_extensions backend registry Model.initial Update.apply
      (fun context model _send ->
         Editor_state.ensure context;
         let state = Sidebar_state.ensure model in
         sidebar := Some state;
         Right_sidebar_view.inner state) in
  ignore (Lui_app.start app);
  Runtime.app_send := (fun action -> Lui_app.send app action);
  Runtime.app_flush := (fun () -> ignore (Lui_app.flush app));
  let owner = "11111111-2222-4333-8444-555555555555"
  and first = "22222222-3333-4444-8555-666666666666"
  and second = "33333333-4444-4555-8666-777777777777" in
  let summary = Wire.Map [ Wire.Keyword "page-title", Wire.String "Contents"
      ; Wire.Keyword "page-uuid", Wire.Uuid owner ] in
  let page = Option.get (Decode.page_of_summary summary) in
  let route = ref (Model.Page "unrelated-main") in
  Runtime.read_model := (fun () -> { (Lui_app.model app) with
      repo = Some "history-scope-fixture"; route = !route
      ; route_page = Some { page with page_uuid = Some "44444444-5555-4666-8777-888888888888" }
      ; phase = Model.Ready });
  let state = Option.get !sidebar in
  let block uuid title = Model.empty_block ~uuid ~title ~is_page:false in
  let item : Sidebar_state.item =
    { key = "history-contents"; kind = "contents"; uuid = Some owner
    ; title = "Contents"; icon = None; breadcrumb = []; blocks = [ block first "FirstSecond" ]
    ; linked_refs = []; page_ref = None; page = Some page
    ; props_collapsed = true; collapsed = false } in
  Runtime.signal_set state.items [ item ];
  Editor_state.set (fun state -> { state with editing = Some
      (Editor_state.mk_editing ~uuid:first ~scope:"sidebar"
         ~buffer:"FirstSecond" ~base:"FirstSecond" ~caret:5 ()) });
  let rows, resolve_rows, _ = Js.Promise.pending () in
  let dead, _, _ = Js.Promise.pending () in
  let cursor = Wire.Map [ Wire.Keyword "block-uuid", Wire.Uuid first
      ; Wire.Keyword "scope", Wire.String "sidebar"; Wire.Keyword "caret", Wire.Int 2 ] in
  let install pending undo =
    Runtime.worker := Some { Worker_client.invoke_fn = (fun method_ args ->
      match method_, args with
      | ("thread-api/undo-redo-undo" | "thread-api/undo-redo-redo"), _ ->
        Js.Promise.resolve (Wire.Map [ Wire.Keyword "undo?", Wire.Bool undo
          ; Wire.Keyword "editor-cursors", Wire.List [ cursor ] ])
      | "thread-api/get-page-route-info", _ -> Js.Promise.resolve summary
      | "thread-api/get-page-blocks-tree", _ :: Wire.Uuid uuid :: _ when uuid = owner -> pending
      | _ -> Js.Promise.resolve Wire.Nil)
      ; on_message = (fun _ _ -> ()); dead } in
  let settle () = for _ = 1 to 40 do Host.drain (); ignore (Lui_app.flush app) done in
  let wire_block uuid title = Wire.Map [ Wire.Keyword "block/uuid", Wire.Uuid uuid
      ; Wire.Keyword "block/title", Wire.String title ] in
  install rows true;
  Editor_actions.undo ();
  settle ();
  check "history waits for its sidebar owner before restoring the cursor"
    !(Editor_state.structure_pending);
  resolve_rows (Wire.Array [ wire_block first "First"; wire_block second "Second" ]);
  settle ();
  check "undo publishes the restored owner rows before completing"
    (List.length (List.hd (Runtime.signal_get state.items)).blocks = 2);
  check "undo restores the canonical sidebar input and insertion offset"
    (match Editor_state.editing () with Some edit ->
       edit.buffer = "First" && edit.base = "First" && edit.model.Edit_model.caret = 2
       && edit.scope = "sidebar" | None -> false);
  check "history releases the structural queue after its owner is ready"
    (not !(Editor_state.structure_pending));
  let rows, resolve_rows, _ = Js.Promise.pending () in
  install rows false;
  Editor_actions.redo ();
  settle ();
  check "redo also awaits the owner instead of restoring from pre-redo rows"
    !(Editor_state.structure_pending);
  resolve_rows (Wire.Array [ wire_block first "FirstSecond" ]);
  settle ();
  check "redo restores merged source and keeps its insertion offset"
    (List.length (List.hd (Runtime.signal_get state.items)).blocks = 1
     && match Editor_state.editing () with Some edit ->
       edit.buffer = "FirstSecond" && edit.model.Edit_model.caret = 2 | None -> false);
  let overlap obsolete_fails =
  let first_read, resolve_first_read, reject_first_read = Js.Promise.pending () in
  let latest_read, resolve_latest_read, _ = Js.Promise.pending () in
  Runtime.signal_set state.items [ { item with kind = "page"; page_ref = Some "First lookup" } ];
  Runtime.worker := Some { Worker_client.invoke_fn = (fun method_ args ->
    match method_, args with
    | "thread-api/undo-redo-undo", _ -> Js.Promise.resolve
        (Wire.Map [ Wire.Keyword "undo?", Wire.Bool true
          ; Wire.Keyword "editor-cursors", Wire.List [ cursor ] ])
    | "thread-api/get-page-route-info", [ _; Wire.String "First lookup" ] -> first_read
    | "thread-api/get-page-route-info", [ _; Wire.String "Latest lookup" ] -> latest_read
    | "thread-api/get-page-blocks-tree", _ :: Wire.Uuid uuid :: _ when uuid = owner ->
        Js.Promise.resolve (Wire.Array [ wire_block first "First"; wire_block second "Second" ])
    | _ -> Js.Promise.resolve Wire.Nil)
    ; on_message = (fun _ _ -> ()); dead };
  Editor_actions.undo ();
  settle ();
  Runtime.signal_set state.items [ { item with kind = "page"; page_ref = Some "Latest lookup" } ];
  Sidebar_state.refresh_items "history-scope-fixture" state;
  if obsolete_fails then reject_first_read (Failure "expected obsolete owner read failure")
  else resolve_first_read summary;
  settle ();
  check "a superseded history read waits for the authoritative newer owner read"
    !(Editor_state.structure_pending);
  resolve_latest_read summary;
  settle ();
  check "history restores only after the authoritative owner read publishes"
    (not !(Editor_state.structure_pending)
     && match Editor_state.editing () with Some edit -> edit.buffer = "First" && edit.model.Edit_model.caret = 2 | None -> false) in
  overlap false;
  overlap true;
  let rows, resolve_rows, _ = Js.Promise.pending () in
  Runtime.signal_set state.items [ { item with blocks = [ block first "FirstSecond" ] } ];
  install rows true;
  Editor_actions.undo ();
  settle ();
  route := Model.Page "destination";
  Editor_state.set (fun state -> { state with editing = Some
      (Editor_state.mk_editing ~uuid:second ~scope:"main"
         ~buffer:"Destination input" ~base:"Destination input" ()) });
  resolve_rows (Wire.Array [ wire_block first "First"; wire_block second "Second" ]);
  settle ();
  check "navigation during an owner read cannot restore the retired history editor"
    (match Editor_state.editing () with Some edit ->
       edit.uuid = second && edit.buffer = "Destination input" && edit.scope = "main"
       | None -> false);
  let quick_owner = "55555555-6666-4777-8888-999999999999" in
  Quick_add_state.set (fun _ -> { page_uuid = Some quick_owner
      ; blocks = [ block first "QuickMerged" ] });
  Editor_state.set (fun state -> { state with editing = Some
      (Editor_state.mk_editing ~uuid:first ~scope:"quick-add"
         ~buffer:"QuickMerged" ~base:"QuickMerged" ()) });
  let rows, resolve_rows, _ = Js.Promise.pending () in
  let quick_cursor = Wire.Map [ Wire.Keyword "block-uuid", Wire.Uuid first
      ; Wire.Keyword "scope", Wire.String "quick-add"; Wire.Keyword "caret", Wire.Int 2 ] in
  Runtime.worker := Some { Worker_client.invoke_fn = (fun method_ args ->
    match method_, args with
    | "thread-api/undo-redo-undo", _ -> Js.Promise.resolve
        (Wire.Map [ Wire.Keyword "undo?", Wire.Bool true
          ; Wire.Keyword "editor-cursors", Wire.List [ quick_cursor ] ])
    | "thread-api/get-page-blocks-tree", _ :: Wire.Uuid uuid :: _ when uuid = quick_owner -> rows
    | _ -> Js.Promise.resolve Wire.Nil)
    ; on_message = (fun _ _ -> ()); dead };
  Editor_actions.undo ();
  settle ();
  check "Quick add history also waits for its independently stored outline"
    !(Editor_state.structure_pending);
  resolve_rows (Wire.Array [ wire_block first "Quick"; wire_block second "Restored" ]);
  settle ();
  check "Quick add history uses refreshed canonical source and cursor"
    (List.length (Quick_add_state.value ()).blocks = 2
     && match Editor_state.editing () with Some edit ->
       edit.buffer = "Quick" && edit.scope = "quick-add" && edit.model.Edit_model.caret = 2
       | None -> false);
  let rows, resolve_rows, _ = Js.Promise.pending () in
  Runtime.worker := Some { Worker_client.invoke_fn = (fun method_ _ ->
      if method_ = "thread-api/get-page-blocks-tree" then rows else Js.Promise.resolve Wire.Nil)
      ; on_message = (fun _ _ -> ()); dead };
  let finished = ref false in
  ignore (Js.Promise.then_ (fun () -> finished := true; Js.Promise.resolve ())
      (Quick_add_state.reload_result ()));
  Quick_add_state.reset ();
  resolve_rows (Wire.Array [ wire_block first "Retired dialog data" ]);
  settle ();
  check "awaited Quick add reads do not resurrect a reset owner"
    (!finished && (Quick_add_state.value ()).page_uuid = None
     && (Quick_add_state.value ()).blocks = []);
  Runtime.signal_set state.items [ { item with blocks = [ block first "FirstSecond" ] } ];
  Editor_state.set (fun state -> { state with editing = Some
      (Editor_state.mk_editing ~uuid:first ~scope:"sidebar"
         ~buffer:"FirstSecond" ~base:"FirstSecond" ~caret:5 ()) });
  let owner_read, _, reject_owner = Js.Promise.pending () in
  Runtime.worker := Some { Worker_client.invoke_fn = (fun method_ _ ->
      match method_ with
      | "thread-api/undo-redo-undo" -> Js.Promise.resolve
          (Wire.Map [ Wire.Keyword "undo?", Wire.Bool true
            ; Wire.Keyword "editor-cursors", Wire.List [ cursor ] ])
      | "thread-api/get-page-route-info" -> owner_read
      | _ -> Js.Promise.resolve Wire.Nil)
      ; on_message = (fun _ _ -> ()); dead };
  let toast_count = List.length (Lui_app.model app).Model.toasts in
  Editor_actions.undo ();
  settle ();
  check "latest owner errors remain part of the in-flight history operation"
    !(Editor_state.structure_pending);
  reject_owner (Failure "expected current owner read failure");
  settle ();
  check "failed canonical history reads release the structural queue without stale cursor restoration"
    (not !(Editor_state.structure_pending)
     && match Editor_state.editing () with Some edit ->
       edit.buffer = "FirstSecond" && edit.model.Edit_model.caret = 5 | None -> false);
  check "history owner read failure surfaces the existing Undo error toast"
    (List.length (Lui_app.model app).Model.toasts = toast_count + 1
     && List.exists (fun toast -> toast.Model.toast_kind = "error"
         && toast.toast_text = I18n.t "editor/undo-error") (Lui_app.model app).Model.toasts);
  install (Js.Promise.resolve (Wire.Array
      [ wire_block first "First"; wire_block second "Second" ])) true;
  Editor_actions.undo ();
  settle ();
  check "a later successful owner read is not poisoned by the rejected task"
    (not !(Editor_state.structure_pending)
     && match Editor_state.editing () with Some edit ->
       edit.buffer = "First" && edit.model.Edit_model.caret = 2 | None -> false);
  Runtime.worker := None;
  ignore (Lui_app.dispose app);
  print_endline "native history container ownership: OK"
