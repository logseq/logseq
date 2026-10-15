let check name condition = if not condition then failwith name
let uuid suffix = "11111111-2222-4333-8444-" ^ suffix
let page title id = Option.get (Decode.page_of_summary (Wire.Map
    [ Wire.Keyword "page-title", Wire.String title
    ; Wire.Keyword "page-uuid", Wire.Uuid id ]))

let () =
  Platform.install_ui_services ~assert_owner:(fun () -> ())
    ~request_flush:(fun () -> ()) ~dom:Ui_dom_native.ops
    ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  let main_uuid = uuid "555555555555" and sidebar_uuid = uuid "666666666666" in
  let main = page "Main route" main_uuid in
  let initial = { Model.initial with repo = Some "append-owner-fixture"
      ; route = Model.Page "main"; route_page = Some main; phase = Model.Ready } in
  let store = Lui_store.create () in
  let backend = { Lui_protocol.backend_profile =
      Lui_protocol.profile Lui_protocol.LinuxOS Lui_protocol.GenericHost
      ; apply_batch = (fun batch -> Lui_store.apply_batch store batch; true) } in
  let app = Lui_app.create backend initial Update.apply
      (fun context model _send ->
         Editor_state.ensure context;
         let flags context = Signal.constant context.Lui_ui.ui_scheduler (false, false) in
         Lui_elements.row
           [ Add_button.el ~puuid:main_uuid ~flags
           ; Add_button.el ~puuid:sidebar_uuid ~as_page:true ~flags
           ; Add_button.el ~flags
           ; Quick_add_view.body model ]) in
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  let quick_add = List.find (fun id ->
      Lui_store.string_prop store id "accessibility-identifier" = Some "quick-add")
      (Lui_store.preorder store) in
  check "the production Quick Add container exposes its editable scope"
    (List.mem "data-cid\031quick-add" (String.split_on_char '\030'
      (Option.get (Lui_store.string_prop store quick_add "data-attrs"))));
  let rows = List.filter (fun id ->
      match Lui_store.string_prop store id "style-class" with
      | Some classes -> List.mem "block-add-button" (String.split_on_char ' ' classes)
      | None -> false) (Lui_store.preorder store) in
  check "add rows are not interactive before their owner exists" (List.length rows = 2);
  let insertion_kinds = List.map (fun id ->
      let attrs = String.split_on_char '\030'
          (Option.get (Lui_store.string_prop store id "data-attrs")) in
      List.find_map (fun entry -> match String.split_on_char '\031' entry with
        | [ "data-insert-as-page"; value ] -> Some value
        | _ -> None) attrs) rows in
  check "add-row snapshots carry their own ordinary or Library insertion kind"
    (insertion_kinds = [ Some "false"; Some "true" ]);
  Runtime.app_send := (fun action -> Lui_app.send app action);
  Runtime.app_flush := (fun () -> ignore (Lui_app.flush app));
  let model = ref initial in
  Runtime.read_model := (fun () -> !model);
  let mutations = ref [] in
  let syncs = ref [] in
  ignore (Runtime.on_sync (fun affected -> syncs := affected :: !syncs));
  let affected = [ Subs_state.watch_key_uuid "children" sidebar_uuid
                 ; Subs_state.watch_key_uuid "display-properties" sidebar_uuid ] in
  let manual_property_refreshes = ref 0 in
  Runtime.hooks.refresh_property_areas <- (fun () ->
    incr manual_property_refreshes; Ui_task.resolve ());
  let revision = ref 0 in
  let dead, _, _ = Js.Promise.pending () in
  Runtime.worker := Some
    { Worker_client.invoke_fn = (fun method_ args ->
        match method_ with
        | "thread-api/apply-outliner-ops" ->
          mutations := args :: !mutations;
          incr revision;
          Js.Promise.resolve (Wire.Map [ Wire.Keyword "delta", Wire.Map
              [ Wire.Keyword "rev", Wire.Int !revision
              ; Wire.Keyword "blocks", Wire.Array []
              ; Wire.Keyword "deleted", Wire.Array []
              ; Wire.Keyword "children", Wire.Array []
              ; Wire.Keyword "affected-keys", Wire.Array affected ] ])
        | _ -> Js.Promise.resolve Wire.Nil)
    ; on_message = (fun _ _ -> ()); dead };
  let settle () =
    for _ = 1 to 20 do Host.drain (); ignore (Lui_app.flush app) done in
  let insertion () =
    match !mutations with
    | [ [ Wire.String "append-owner-fixture"; Wire.Array
          [ Wire.Array [ Wire.Keyword "insert-blocks"; Wire.Array
              [ Wire.List [ block ]; Wire.Uuid owner; options ] ] ]; _ ] ] ->
        owner, block, options
    | _ -> failwith "expected one typed insert operation" in
  let reset () =
    mutations := [];
    Editor_state.pending_focus := None;
    Editor_state.set (fun state -> { state with Editor_state.editing = None }) in
  Editor_actions.append_block ~for_page:sidebar_uuid ~scope:"sidebar" ();
  settle ();
  let owner, _, options = insertion () in
  check "an explicit sidebar owner never falls back to the unrelated main route"
    (owner = sidebar_uuid);
  check "appending uses the actual owner's bottom child position"
    (Wire.get options "bottom?" = Some (Wire.Bool true)
     && Wire.get options "sibling?" = Some (Wire.Bool false));
  check "own structural responses notify affected sidebar stores before their broadcast is deduplicated"
    (!syncs = [ affected ]);
  check "own affected-key notifications replace the duplicate manual property refresh"
    (!manual_property_refreshes = 0);
  check "sidebar insertion retains its editing scope"
    (match Editor_state.editing () with
     | Some edit -> edit.Editor_state.scope = "sidebar"
     | None -> false);
  reset ();
  Editor_actions.append_block ();
  settle ();
  let owner, _, _ = insertion () in
  check "the ordinary add command still targets its main route owner" (owner = main_uuid);
  reset ();
  let journal_uuid = uuid "777777777777" in
  model := { initial with journals = [ page "Journal fixture" journal_uuid ] };
  Editor_actions.append_block ~for_page:journal_uuid ();
  settle ();
  let owner, _, _ = insertion () in
  check "journal add rows retain their explicit day owner" (owner = journal_uuid);
  reset ();
  let block_uuid = uuid "888888888888" in
  Editor_actions.append_block ~for_page:block_uuid ~scope:"sidebar" ();
  settle ();
  let owner, _, options = insertion () in
  check "block-root add rows append children rather than route siblings"
    (owner = block_uuid && Wire.get options "sibling?" = Some (Wire.Bool false));
  reset ();
  let library_uuid = uuid "999999999999" in
  Editor_actions.append_block ~for_page:library_uuid ~as_page:true ~scope:"sidebar" ();
  settle ();
  let _, block, _ = insertion () in
  check "unloaded built-in Library owners still insert page-typed children"
    (Wire.get block "block/tags" = Some (Wire.Set [ Wire.Keyword "logseq.class/Page" ]));
  reset ();
  model := { initial with route_page = Some { main with page_is_library = true } };
  Editor_actions.append_block ~for_page:sidebar_uuid ~as_page:false ~scope:"sidebar" ();
  settle ();
  let owner, block, _ = insertion () in
  check "an unrelated Library route does not page-type an ordinary sidebar insertion"
    (owner = sidebar_uuid && Wire.get block "block/tags" = None);
  reset ();
  Editor_actions.append_block ();
  settle ();
  let owner, block, _ = insertion () in
  check "the route-owned Library command still inserts page-typed children"
    (owner = main_uuid
     && Wire.get block "block/tags" = Some (Wire.Set [ Wire.Keyword "logseq.class/Page" ]));
  reset ();
  let target = Js.Json.JObject
      [ "node-id", Js.Json.JNumber 9001.; "tag", Js.Json.JString "div"
      ; "class", Js.Json.JString "block-add-button"
      ; "attrs", Js.Json.JObject
          [ "data-parentblockid", Js.Json.JString sidebar_uuid
          ; "data-insert-as-page", Js.Json.JString "false" ]
      ; "ancestors", Js.Json.JArray [| Js.Json.JObject
          [ "node-id", Js.Json.JNumber 9000.
          ; "attrs", Js.Json.JObject [ "data-cid", Js.Json.JString "sidebar" ] ] |] ] in
  let event = Ui_dom_native.ev_of (Js.Json.JObject
      [ "key", Js.Json.JString "Enter"; "target", target ]) in
  Editor_keys.on_keydown event;
  settle ();
  let owner, _, _ = insertion () in
  check "Enter on an add row uses the same explicit owner and sidebar scope as clicking"
    (owner = sidebar_uuid && match Editor_state.editing () with
     | Some edit -> edit.Editor_state.scope = "sidebar"
     | None -> false);
  reset ();
  let host = Js.Json.JObject
      [ "node-id", Js.Json.JNumber 9000.
      ; "attrs", Js.Json.JObject [ "data-cid", Js.Json.JString "sidebar" ] ] in
  let button = Js.Json.JObject
      [ "node-id", Js.Json.JNumber 9001.; "tag", Js.Json.JString "div"
      ; "class", Js.Json.JString "block-add-button"
      ; "attrs", Js.Json.JObject
          [ "data-parentblockid", Js.Json.JString sidebar_uuid
          ; "data-insert-as-page", Js.Json.JString "false" ] ] in
  let child = Js.Json.JObject
      [ "node-id", Js.Json.JNumber 9002.; "tag", Js.Json.JString "div"
      ; "class", Js.Json.JString "bab-inner"
      ; "ancestors", Js.Json.JArray [| button; host |] ] in
  let clicked = Ui_dom_native.ev_of (Js.Json.JObject [ "target", child ]) in
  Editor_keys.on_click clicked;
  settle ();
  let owner, _, _ = insertion () in
  check "delegated add-row clicks preserve the owning container"
    (owner = sidebar_uuid && match Editor_state.editing () with
     | Some edit -> edit.Editor_state.scope = "sidebar"
     | None -> false);
  syncs := [];
  let make_delta revision affected = Wire.Map
      [ Wire.Keyword "rev", Wire.Int revision
      ; Wire.Keyword "blocks", Wire.Array []
      ; Wire.Keyword "deleted", Wire.Array []
      ; Wire.Keyword "children", Wire.Array []
      ; Wire.Keyword "affected-keys", Wire.Array affected ] in
  let saved = make_delta 1000 affected in
  let noop = make_delta 1001 [] in
  Page_delta.stash_deferred saved;
  ignore (Outliner_ops.refresh_via_delta ~repo:"append-owner-fixture" (Some (Wire.Map [ Wire.Keyword "delta", noop ])));
  settle ();
  check "a no-op final acknowledgement still notifies the deferred save's affected stores once"
    (!syncs = [ affected ]);
  Runtime.read_model := (fun () -> Lui_app.model app);
  Runtime.current_route := Some initial.route;
  Page_delta.reset ();
  let row_uuid = uuid "aaaaaaaaaaaa" and added_uuid = uuid "bbbbbbbbbbbb" in
  let old_row = { (Model.empty_block ~uuid:row_uuid ~title:"Old canonical" ~is_page:false)
                  with block_order = Some "a0" } in
  ignore (Lui_app.send app (Action.Page_loaded { main with page_blocks = [ old_row ] }));
  ignore (Lui_app.flush app);
  let canonical id title order = Wire.Map
      [ Wire.Keyword "block/uuid", Wire.Uuid id
      ; Wire.Keyword "block/title", Wire.String title
      ; Wire.Keyword "block/order", Wire.String order ] in
  let saved_keys = [ Subs_state.watch_key_uuid "entity" row_uuid ]
  and inserted_keys = [ Subs_state.watch_key_uuid "children" main_uuid ] in
  let saved_canonical = Wire.Map
      [ Wire.Keyword "rev", Wire.Int 2000
      ; Wire.Keyword "blocks", Wire.Map [ Wire.Uuid row_uuid, canonical row_uuid "Saved canonical" "a0" ]
      ; Wire.Keyword "deleted", Wire.Map []
      ; Wire.Keyword "children", Wire.Map []
      ; Wire.Keyword "affected-keys", Wire.Array saved_keys ] in
  let inserted_canonical = Wire.Map
      [ Wire.Keyword "rev", Wire.Int 2001
      ; Wire.Keyword "blocks", Wire.Map [ Wire.Uuid added_uuid, canonical added_uuid "Inserted canonical" "a1" ]
      ; Wire.Keyword "deleted", Wire.Map []
      ; Wire.Keyword "children", Wire.Map [ Wire.Uuid main_uuid, Wire.Map
          [ Wire.Keyword "base-rev", Wire.Int 2000
          ; Wire.Keyword "remove", Wire.Array []
          ; Wire.Keyword "upsert", Wire.Array [ Wire.Array [ Wire.Uuid added_uuid; Wire.String "a1" ] ] ] ]
      ; Wire.Keyword "affected-keys", Wire.Array inserted_keys ] in
  syncs := [];
  Page_delta.stash_deferred saved_canonical;
  ignore (Outliner_ops.refresh_via_delta ~repo:"append-owner-fixture"
      (Some (Wire.Map [ Wire.Keyword "delta", inserted_canonical ])));
  settle ();
  let current = Option.get (Runtime.model ()).Model.route_page in
  check "batch acknowledgement applies deferred text and structural data before suppressing echoes"
    (List.map (fun block -> block.Model.block_uuid, block.block_title) current.page_blocks
     = [ Some row_uuid, "Saved canonical"; Some added_uuid, "Inserted canonical" ]);
  check "distinct saved and structural affected keys are unioned in one notification"
    (!syncs = [ List.sort_uniq compare (saved_keys @ inserted_keys) ]);
  check "both successfully applied batch revisions are marked for broadcast deduplication"
    (Page_delta.delta_already_applied saved_canonical
     && Page_delta.delta_already_applied inserted_canonical);
  let replay = ref None in
  ignore (Js.Promise.then_ (fun result -> replay := Some result; Js.Promise.resolve ())
      (Subs_state.promise_of_task (Page_delta.apply_to_page
         (Outliner_ops.delta_helpers current) current saved_canonical)));
  settle ();
  check "the later saved-delta echo cannot reapply or roll back canonical content"
    (!replay = Some Page_delta.Unchanged);
  syncs := [];
  ignore (Outliner_ops.refresh_via_delta ~repo:"retired-graph"
      (Some (Wire.Map [ Wire.Keyword "delta", saved ])));
  settle ();
  check "retired graph responses cannot invalidate the replacement graph's stores"
    (!syncs = []);
  Runtime.worker := None;
  Editor_state.pending_focus := None;
  ignore (Lui_app.dispose app);
  print_endline "native add-row owner routing: OK"
