(* Worker broadcast dispatch — Broadcast.to_clients on the worker posts
   `[<kind> <payload>]` transit arrays to the main thread; Worker_client
   decodes the frame and calls this with (kind, payload).

   - "notification"    -> toast push (see Decode.toast_of_wire)
   - "sync-db-changes" -> Subs.on_db_changes (the subs package stashes
     deltas, debounces against UI activity, splices or reloads)
   - anything else     -> Worker_event action for future consumers

   "rtc-sync-state" floods during sync bursts (presence updates,
   pending-tx counts) — dedupe identical states so a no-change
   rebroadcast doesn't pay a flush. *)
open Promise_ext

let last_rtc : Model.rtc option ref = ref None

(* Boot_graph_ready clears Model.rtc; the dedup ref must clear too or an
   unchanged rebroadcast would be dropped and the indicator stay hidden *)
let reset_rtc () = last_rtc := None

(* The worker's search-index build reports progress through this
   remoteInvoke; without a handler the worker->main comlink call hangs
   and the build never settles. Feeds the header's
   .search-index-progress widget — cljs
   persist_db/browser.cljs thread-api/search-index-build-progress *)
let on_index_progress repo (payload : Wire.t) =
  let str k =
    match Wire.get payload k with
    | Some (Wire.String s | Wire.Keyword s) -> s
    | _ -> ""
  in
  let status = str "status" in
  let build_id =
    match Wire.get payload "build-id" with
    | Some (Wire.String s) -> Some s
    | _ -> None
  in
  Runtime.send
    (Action.Search_index_progress
       { Model.ip_repo = repo
       ; ip_status = status
       ; ip_stage = str "stage"
       ; ip_progress =
           Option.value (Wire.map_get_int payload "progress") ~default:0
       ; ip_build_id = build_id
       });
  Runtime.flush ();
  match status, build_id with
  | "completed", Some bid ->
      Web_dom.set_timeout
        (fun () ->
          Runtime.send (Action.Search_index_hide (repo, bid));
          Runtime.flush ())
        1500
  | _ -> ()

let dispatch kind payload =
  match kind with
  | "thread-api/search-index-build-progress" -> (
      (* daemon path — the native worker Broadcast.to_clients the same
         [repo, payload] args the browser worker sends via remoteInvoke *)
      match Wire.args_list payload with
      | [ Wire.String repo; progress ] -> on_index_progress repo progress
      | _ -> ())
  | "notification" -> (
      match Decode.toast_of_wire payload with
      | Some t ->
          Runtime.send (Action.Toast_push t);
          Runtime.flush ()
      | None -> ())
  | "sync-db-changes" -> Subs.on_db_changes payload
  | "rtc-sync-state" -> (
      let rtc = Decode.rtc_of_wire payload in
      match !last_rtc with
      | Some prev when prev = rtc -> ()
      | _ ->
          last_rtc := Some rtc;
          (* a fresh client means earlier asset-download requests may have
             been dropped — give pending imgs another chance *)
          Asset_dom.retry_pending ();
          Runtime.send (Action.Rtc_state rtc);
          Runtime.flush ())
  | "rtc-log" -> !Runtime.rtc_log_handler payload
  | "rtc-asset-upload-download-progress" -> (
      (* cljs :rtc/asset-upload-download-progress — per-asset
         {direction,loaded,total}; accumulated for the indicator
         popup's asset rows *)
      match
        ( Wire.map_get_string payload "repo"
        , Wire.map_get_string payload "asset-id"
        , Wire.get payload "progress" )
      with
      | Some repo, Some asset_id, Some progress -> (
          match
            ( Wire.map_get_string progress "direction"
            , Wire.map_get_int progress "loaded"
            , Wire.map_get_int progress "total" )
          with
          | Some direction, Some loaded, Some total ->
              Asset_progress.note ~repo ~asset_id ~direction
                ~loaded ~total
          | _ -> ())
      | _ -> ())
  | "db-worker/ui-request" -> Ui_requests.handle payload
  | "asset-file-write-finish" -> (
      (* worker finished writing a downloaded asset to pfs — set src on
         any mounted img that requested the download *)
      match
        ( Wire.map_get_string payload "repo"
        , Wire.map_get_string payload "asset-id" )
      with
      | Some repo, Some asset_id ->
          Asset_dom.on_asset_write_finish ~repo':repo ~asset_id
      | _ -> ())
  | "remote-graph-gone" ->
      (* cljs :rtc/remote-graph-gone: refresh remote graph list *)
      !Runtime.remote_graph_gone ()
  | "add-repo" -> (
      (* cljs :add-repo -> state/add-repo! — worker broadcasts this after
         a remote-graph download completes *)
      match Wire.map_get_string payload "repo" with
      | Some repo -> !Runtime.add_repo repo
      | None -> ())
  | _ -> Runtime.send (Action.Worker_event (kind, payload))

(* sdk show_msg/close_msg dispatch `ls:toast`/`ls:toast-close`
   CustomEvents on document — same toast path as worker notifications. *)
let detail_json ev = Web_dom.js_get ev "detail"

(* UI-side deferral for the debounced reload — see Subs.fire_reload:
   typing, menus/popups, recent pointer input, and the editing-session
   cadence cap (a route reload landing mid-interaction remounts the
   element under the pointer and the click misses or hits the wrong
   row) *)
let last_ui_input_ms = ref 0.0

(* each full-route reload pays a worker fetch plus ~280ms of whole-tree
   rebuild+flush; while an editor is open during an RTC flood that cost
   starves keystroke dispatch, so reloads are capped to a much slower
   cadence — a block left in edit mode still refreshes eventually *)
let edit_reload_min_ms = 8000.0
let edit_input_idle_ms = 750.0

let ui_busy ~now ~last_fire =
  let editing_active =
    Editor_state.ready () && Editor_state.editing () <> None
  in
  let typing_active =
    editing_active
    && now -. !Editor_state.last_edit_input_ms < edit_input_idle_ms
  in
  let edit_throttled =
    editing_active && now -. last_fire < edit_reload_min_ms
  in
  let popup_open =
    (* same overlay surfaces as editor_keys' outside-click routing *)
    Web_dom.query_selector
      "#ui__ac, .cp__cmdk__modal, .ui__popover-content, .ls-context-menu-content, #date-time-picker, .ls-editor-link-form, .ls-property-dialog"
    <> None
  in
  let ui_active =
    editing_active && now -. !last_ui_input_ms < edit_input_idle_ms
  in
  typing_active || edit_throttled || popup_open || ui_active

let init () =
  (* the subscription pipeline's touch points into the app — one place
     to read every edge between worker events and the UI *)
  Subs_state.i18n := I18n.t;
  Subs.install_hooks
    { Subs.reload = Router.reload
    ; refresh_page_side = (fun p -> !Runtime.refresh_page_side p)
    ; prune_overrides = Editor_state.prune_overrides
    ; invalidate_pull_uuids =
        (fun uuids ->
          Render_inline.invalidate_pull_uuids uuids;
          Editor_state.bump_invalidation ())
    ; invalidate_pull_caches =
        (fun () ->
          Render_inline.invalidate_pull_caches ();
          Editor_state.bump_invalidation ())
    ; fire_db_hooks = Plugin_host.fire_db_hooks
    ; helpers_of = Outliner_ops.delta_helpers
    ; ui_busy
    ; schedule = (fun f -> Web_dom.set_timeout f 150)
    ; publish_page =
        (fun p -> Runtime.send (Action.Page_loaded p))
    ; publish_journals =
        (fun js -> Runtime.send (Action.Journals_loaded js))
    ; resync_editing =
        (fun () -> ignore (Outliner_ops.resync_open_editor ()))
    ; refetch_page =
        (fun p ->
          match !Runtime.current_repo with
          | None -> Js.Promise.resolve None
          | Some repo -> (
              let* blocks =
                match !Runtime.current_route with
                | Some (Model.Block_zoom uuid) ->
                    let* v =
                      Outliner_ops.fetch_zoom_blocks repo uuid
                    in
                    Outliner_ops.blocks_of_tree_wire repo p v
                | _ -> Outliner_ops.fetch_page_blocks repo p
              in
              let* p' =
                Outliner_ops.resolve_page_tags repo
                  { p with Model.page_blocks = blocks }
              in
              Js.Promise.resolve (Some p')))
    };
  (* the worker's search-index build reports progress through this
     remoteInvoke; without a handler the worker->main comlink call hangs
     and the build never settles. Feeds the header's
     .search-index-progress widget — cljs
     persist_db/browser.cljs thread-api/search-index-build-progress *)
  Worker_client.register_api "thread-api/search-index-build-progress"
    (fun args ->
      (match args with
       | [ Wire.String repo; payload ] -> on_index_progress repo payload
       | _ -> ());
      Js.Promise.resolve Wire.Nil);
  Runtime.on_navigate := (fun () ->
      Subs.clear_pending_deltas ();
      (* a route change abandons the old page's selection/editor state —
         leaving `selected` behind keeps the selection action bar visible
         on the freshly loaded page *)
      Editor_actions.cancel_pending_focus ();
      if Editor_state.ready () then Editor_actions.clear_selection ());
  Web_dom.add_document_listener "pointerdown"
    (fun _ -> last_ui_input_ms := Platform.date_now_ms ())
    true;
  Web_dom.add_document_listener "keydown"
    (fun _ -> last_ui_input_ms := Platform.date_now_ms ())
    true;
  Web_dom.on_document_event "ls:toast" (fun ev ->
      let d = detail_json ev in
      let text =
        match Js.Json.decodeObject d with
        | Some o -> (
            match Js.Dict.get o "msg" with
            | Some v -> Option.value (Js.Json.decodeString v) ~default:""
            | None -> "")
        | None -> ""
      in
      let kind =
        match Js.Json.decodeObject d with
        | Some o -> (
            match Js.Dict.get o "cls" with
            | Some v -> Option.value (Js.Json.decodeString v) ~default:"info"
            | None -> "info")
        | None -> "info"
      in
      let key =
        match Js.Json.decodeObject d with
        | Some o -> (
            match Js.Dict.get o "key" with
            | Some v -> Js.Json.decodeString v
            | None -> None)
        | None -> None
      in
      Runtime.send
        (Action.Toast_push
           { Model.toast_id = 0
           ; toast_text = text
           ; toast_kind = kind
           ; toast_key = key
           });
      Runtime.flush ());
  Web_dom.on_document_event "ls:toast-close" (fun ev ->
      (* sdk close_msg targets one notification by its show_msg key;
         a missing key clears nothing — Toasts_clear stays internal *)
      match Js.Json.decodeObject (detail_json ev) with
      | Some o -> (
          match Js.Dict.get o "key" with
          | Some v -> (
              match Js.Json.decodeString v with
              | Some key ->
                  Runtime.send (Action.Toast_dismiss_key key);
                  Runtime.flush ()
              | None -> ())
          | None -> ())
      | None -> ())
