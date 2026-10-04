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
let last_rtc : Model.rtc option ref = ref None

(* Boot_graph_ready clears Model.rtc; the dedup ref must clear too or an
   unchanged rebroadcast would be dropped and the indicator stay hidden *)
let reset_rtc () = last_rtc := None

let dispatch kind payload =
  match kind with
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
let detail_json ev = Platform.json_prop ev "detail"

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
    Editor_dom.query_selector
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
  Subs.install_hooks
    { Subs.reload = Router.reload
    ; after_apply = Views_mount.refresh_query_insts
    ; refresh_page_side = (fun p -> !Runtime.refresh_page_side p)
    ; prune_overrides = Editor_state.prune_overrides
    ; invalidate_pull_uuids = Render_inline.invalidate_pull_uuids
    ; invalidate_pull_caches = Render_inline.invalidate_pull_caches
    ; fire_db_hooks = Plugin_host.fire_db_hooks
    ; helpers_of = Outliner_ops.delta_helpers
    ; ui_busy
    ; schedule = (fun f -> Editor_dom.set_timeout f 150)
    ; publish_page =
        (fun p -> Runtime.send (Action.Page_loaded p))
    ; publish_journals =
        (fun js -> Runtime.send (Action.Journals_loaded js))
    };
  (* the worker's search-index build reports progress through this
     remoteInvoke; without a handler the worker->main comlink call hangs
     and the build never settles *)
  Worker_client.register_api "thread-api/search-index-build-progress"
    (fun args ->
      ignore args;
      Js.Promise.resolve Wire.Nil);
  Runtime.on_navigate := (fun () ->
      Subs.clear_pending_deltas ();
      (* a route change abandons the old page's selection/editor state —
         leaving `selected` behind keeps the selection action bar visible
         on the freshly loaded page *)
      Editor_actions.cancel_pending_focus ();
      if Editor_state.ready () then Editor_actions.clear_selection ());
  Editor_dom.document_add_listener "pointerdown"
    (fun _ -> last_ui_input_ms := Platform.date_now_ms ())
    true;
  Editor_dom.document_add_listener "keydown"
    (fun _ -> last_ui_input_ms := Platform.date_now_ms ())
    true;
  Platform.on_document_event "ls:toast" (fun ev ->
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
  Platform.on_document_event "ls:toast-close" (fun ev ->
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
