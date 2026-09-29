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
let reload_scheduled = ref false

(* Boot_graph_ready clears Model.rtc; the dedup ref must clear too or an
   unchanged rebroadcast would be dropped and the indicator stay hidden *)
let reset_rtc () = last_rtc := None

(* A full route reload tears down the editing textarea mid-keystroke;
   while a block is being edited, keep coalescing instead — the next
   broadcast wave (or the end of editing) lands the reload anyway. *)
let rec schedule_reload () =
  if !reload_scheduled then ()
  else (
    reload_scheduled := true;
    Editor_dom.set_timeout
      (fun () ->
         reload_scheduled := false;
         if Editor_state.ready () && Editor_state.editing () <> None then
           schedule_reload ()
         else Router.reload ())
      150)

let dispatch kind payload =
  match kind with
  | "notification" -> (
      match Decode.toast_of_wire payload with
      | Some t ->
          Runtime.send (Action.Toast_push t);
          Runtime.flush ()
      | None -> ())
  | "sync-db-changes" ->
      schedule_reload ();
      Views_mount.refresh_query_insts ();
      Runtime.run_sync_subs ()
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
