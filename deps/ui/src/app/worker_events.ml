(* Worker broadcast dispatch — Broadcast.to_clients on the worker posts
   `[<kind> <payload>]` transit arrays to the main thread; Worker_client
   decodes the frame and calls this with (kind, payload).

   - "notification"    -> toast push (see Decode.toast_of_wire)
   - "sync-db-changes" -> reload current route's data (keeps route_page
     until the fresh one lands — no blank flicker), then run the
     Runtime.on_sync subscribers (areas holding worker data outside the
     model)
   - anything else     -> Worker_event action for future consumers *)

(* "rtc-sync-state" floods during sync bursts (presence updates, pending-tx
   counts); "sync-db-changes" fires once per tx report. Both trigger a full
   flush/reload, so coalesce: dedupe identical rtc states and debounce route
   reloads — otherwise the reconcile churn starves the editor during typing. *)
let last_rtc : Model.rtc option ref = ref None
let reload_pending = ref false
let reload_first_ms = ref 0.0
let reload_last_ms = ref 0.0

(* Boot_graph_ready clears Model.rtc; the dedup ref must clear too or an
   unchanged rebroadcast would be dropped and the indicator stay hidden *)
let reset_rtc () = last_rtc := None

(* A full route reload tears into the editing textarea mid-keystroke, so
   defer while the editor is actively receiving input — but only while
   input is recent: a block left in edit mode (e.g. by the RTC fixture's
   fresh page) must not starve remote updates forever.

   During an RTC merge flood broadcasts arrive faster than the debounce —
   a fixed-interval throttle still pays a full worker-RPC + route render
   per interval and starves the UI thread (keystroke acks cost ~1s).
   Trailing debounce instead: re-arm while requests keep landing, with a
   max wait so a continuous flood can't postpone the refresh forever. *)
let edit_input_idle_ms = 750.0
let reload_debounce_ms = 400.0
let reload_max_wait_ms = 2000.0

(* each full-route reload pays a worker fetch plus ~280ms of whole-tree
   rebuild+flush; while an editor is open during an RTC flood that cost
   starves keystroke dispatch, so reloads are capped to a much slower
   cadence — a block left in edit mode still refreshes eventually *)
let edit_reload_min_ms = 8000.0
let reload_last_fire_ms = ref 0.0

(* wall-clock of the last pointer/key event anywhere — a route reload
   landing mid-interaction (menu pick, row click between typed ops)
   remounts the element under the pointer and the click misses or hits
   the wrong row *)
let last_ui_input_ms = ref 0.0

let rec schedule_reload () =
  reload_last_ms := Platform.date_now_ms ();
  if !reload_first_ms = 0.0 then reload_first_ms := !reload_last_ms;
  if not !reload_pending then (
    reload_pending := true;
    Editor_dom.set_timeout fire_reload 150)

and fire_reload () =
  let now = Platform.date_now_ms () in
  let editing_active =
    Editor_state.ready () && Editor_state.editing () <> None
  in
  let typing_active =
    editing_active
    && now -. !Editor_state.last_edit_input_ms < edit_input_idle_ms
  in
  let flood_active =
    now -. !reload_last_ms < reload_debounce_ms
    && now -. !reload_first_ms < reload_max_wait_ms
  in
  let edit_throttled =
    editing_active && now -. !reload_last_fire_ms < edit_reload_min_ms
  in
  let popup_open =
    (* same overlay surfaces as editor_keys' outside-click routing: a
       route reload remounts the tree under an open popup/dialog and the
       pending click/type aimed at it misses *)
    Editor_dom.query_selector
      "#ui__ac, .cp__cmdk__modal, .ui__popover-content, .ls-context-menu-content, #date-time-picker, .ls-editor-link-form, .ls-property-dialog"
    <> None
  in
  let ui_active =
    editing_active && now -. !last_ui_input_ms < edit_input_idle_ms
  in
  if typing_active || flood_active || edit_throttled || popup_open
     || ui_active
  then Editor_dom.set_timeout fire_reload 150
  else (
    reload_pending := false;
    reload_first_ms := 0.0;
    reload_last_fire_ms := now;
    Router.reload ();
    Views_mount.refresh_query_insts ();
    Runtime.run_sync_subs ())

let dispatch kind payload =
  match kind with
  | "notification" -> (
      match Decode.toast_of_wire payload with
      | Some t ->
          Runtime.send (Action.Toast_push t);
          Runtime.flush ()
      | None -> ())
  | "sync-db-changes" ->
      Render_inline.invalidate_pull_caches ();
      (* query-instances/sync-subs run inside fire_reload so they coalesce
         with the debounced reload instead of paying per-broadcast *)
      schedule_reload ()
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

let init () =
  (* the worker's search-index build reports progress through this
     remoteInvoke; without a handler the worker->main comlink call hangs
     and the build never settles *)
  Worker_client.register_api "thread-api/search-index-build-progress"
    (fun args ->
      ignore args;
      Js.Promise.resolve Wire.Nil);
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
