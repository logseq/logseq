(* Reactive RTC glue — port of
   frontend/handler/db_based/rtc_flows.cljs +
   rtc_background_tasks.cljs: the latest rtc-log (with its
   download/upload/misc projections), the logout stop, and the
   50ms-debounced trigger-start-rtc sources (login, graph switch,
   document-visible, network-online, manual trigger) feeding the
   auto-start-rtc background task.

   Not ported: the cljs rtc-try-restart watchdog gated on
   last-stop-exception-ex-data.type = :rtc.exception/ws-timeout. The
   OCaml worker never broadcasts that field — it self-reconnects on ws
   close/stale (deps/db-worker sync_client.ml schedule_reconnect), and
   the only closed-state broadcast a UI watchdog could see is also what
   an explicit db-sync-stop emits, so gating on it would fight the
   (Dev) RTC Stop command. The trigger sources below cover the cases
   the watchdog existed for. The mobile-app-active source is likewise
   dropped — no mobile surface in the web UI.

   Wiring follows the codebase's hook-ref idiom (module cycles are
   forbidden): Worker_events.dispatch calls Runtime.rtc_log_handler,
   Boot_graph_ready calls Runtime.rtc_graph_ready, Login_view calls
   notify_login. init() installs the DOM listeners; called from
   js_app/main.ml. *)

let logged_in () = Platform.local_storage_get "id-token" <> None

external atob_ : string -> string = "atob" [@@mel.scope "window"]

(* cljs user.cljs parse-jwt — the id-token's middle base64url segment *)
let jwt_claim claim =
  match Platform.local_storage_get "id-token" with
  | None -> None
  | Some tok -> (
      match String.split_on_char '.' tok with
      | [ _; payload; _ ] -> (
          let b64 =
            String.map
              (fun c -> match c with '-' -> '+' | '_' -> '/' | c -> c)
              payload
          in
          let pad =
            match String.length b64 mod 4 with
            | 2 -> "==" | 3 -> "=" | _ -> ""
          in
          try
            match
              Js.Json.decodeObject (Js.Json.parseExn (atob_ (b64 ^ pad)))
            with
            | Some o -> (
                match Js.Dict.get o claim with
                | Some v -> Js.Json.decodeString v
                | None -> None)
            | None -> None
          with _ -> None)
      | _ -> None)

let jwt_claim_list claim =
  match Platform.local_storage_get "id-token" with
  | None -> []
  | Some tok -> (
      match String.split_on_char '.' tok with
      | [ _; payload; _ ] -> (
          let b64 =
            String.map
              (fun c -> match c with '-' -> '+' | '_' -> '/' | c -> c)
              payload
          in
          let pad =
            match String.length b64 mod 4 with
            | 2 -> "==" | 3 -> "=" | _ -> ""
          in
          try
            match
              Js.Json.decodeObject (Js.Json.parseExn (atob_ (b64 ^ pad)))
            with
            | Some o -> (
                match Js.Dict.get o claim with
                | Some v -> (
                    match Js.Json.decodeArray v with
                    | Some xs ->
                        List.filter_map Js.Json.decodeString
                          (Array.to_list xs)
                    | None -> [])
                | None -> [])
            | None -> []
          with _ -> [])
      | _ -> [])

(* cljs user/username + user/email + user/user-uuid *)
let username () =
  match jwt_claim "cognito:username" with
  | Some u -> Some u
  | None -> jwt_claim "username"

let email () = jwt_claim "email"
let user_uuid () = jwt_claim "sub"

(* resolved worker db-rtc-uuid for the open repo (cljs
   use-db-rtc-uuid): the indicator/collaborators widgets gate on it.
   Refetches when the repo changed OR the uuid is still unresolved —
   after an upload the first fetch comes back nil, so every later
   model emission retries until the worker lands the kv row *)
let db_rtc_uuid : string option ref = ref None
let db_rtc_repo : string option ref = ref None

let refresh_db_rtc_uuid (repo : string option) =
  match repo with
  | Some r when !db_rtc_repo <> Some r || !db_rtc_uuid = None -> begin
      db_rtc_repo := Some r;
      db_rtc_uuid := None;
      ignore
        (let open Promise_ext in
        let* w =
          Runtime.invoke1 "thread-api/get-rtc-graph-uuid" (Wire.String r)
        in
        db_rtc_uuid := Wire.as_uuid w;
        Runtime.flush ();
        Js.Promise.resolve ())
    end
  | _ -> ()

(* cljs user.cljs rtc-group? — dev build, a custom sync server, or a
   cognito group from {team, rtc_2025_07_10} *)
let rtc_group () =
  Platform.dev_build
  || Platform.local_storage_get "sync-server-url" <> None
  || List.exists
       (fun g -> g = "team" || g = "rtc_2025_07_10")
       (jwt_claim_list "cognito:groups")

(* -- rtc-log + type projections (cljs rtc-log / rtc-download-log /
   rtc-upload-log / rtc-misc-log): latest entry per class. The cljs
   detail-log accumulators feed the rtc indicator's details popover,
   which isn't ported — these keep the flow state for it. -- *)
let last_log : Wire.t option ref = ref None
let download_log : Wire.t option ref = ref None
let upload_log : Wire.t option ref = ref None
let misc_log : Wire.t option ref = ref None

(* created-at of the latest rtc.log/push-local-update — feeds the
   indicator details popover's last-synced row (cljs misc-logs scan) *)
let last_sync_ms : int64 option ref = ref None

let kw (w : Wire.t) key = Option.bind (Wire.get w key) Wire.as_keyword

let wire_ms = function
  | Wire.Date_ms ms | Wire.Int64 ms -> Some ms
  | Wire.Int n -> Some (Int64.of_int n)
  | _ -> None

(* latest log sub-type per class — cljs *downloading?/*uploading?
   atoms (downloading-detail / uploading-detail stay visible until a
   *-completed log lands) *)
let downloading_now = ref false
let uploading_now = ref false

let flow_flags_changed () =
  let downloading =
    match !download_log with
    | Some l -> kw l "sub-type" <> Some "download-completed"
    | None -> false
  and uploading =
    match !upload_log with
    | Some l -> kw l "sub-type" <> Some "upload-completed"
    | None -> false
  in
  if downloading <> !downloading_now || uploading <> !uploading_now
  then begin
    downloading_now := downloading;
    uploading_now := uploading;
    Runtime.send (Action.Rtc_flow_flags { downloading; uploading })
  end

(* cljs rtc-log skips {:sub-type :skip, :type :rtc.log/apply-remote-update} *)
let on_log (log : Wire.t) =
  if not
       (kw log "sub-type" = Some "skip"
       && kw log "type" = Some "rtc.log/apply-remote-update")
  then begin
    last_log := Some log;
    if kw log "type" = Some "rtc.log/push-local-update" then
      last_sync_ms := Option.bind (Wire.get log "created-at") wire_ms;
    (match kw log "type" with
     | Some "rtc.log/download" -> download_log := Some log
     | Some "rtc.log/upload" -> upload_log := Some log
     | _ -> misc_log := Some log);
    flow_flags_changed ()
  end



(* -- trigger-start-rtc: every source emits through [emit], which
   debounces 50ms (cljs clearTimeout + re-arm) so a burst — e.g. login
   landing next to a graph switch — starts sync once. emit! is gated
   on a logged-in user, like cljs. -- *)
let emit_timeout : int option ref = ref None

(* the auto-start-rtc-if-possible background task: start sync for the
   emitted repo, else the current one — db-sync-start is idempotent and
   no-ops for graphs without a remote id *)
let start repo =
  match repo, (Runtime.model ()).Model.repo with
  | Some r, _ -> Rtc_ops.start r
  | None, Some r -> Rtc_ops.start r
  | None, None -> ()

let emit repo =
  if logged_in () then begin
    (match !emit_timeout with
     | Some id -> Browser_ui.clear_timeout id
     | None -> ());
    emit_timeout :=
      Some (Browser_ui.set_timeout (fun () -> start repo) 50)
  end

(* cljs current-login-user watch -> [:login] *)
let notify_login () = emit None

(* cljs current-repo watch -> [:graph-switch repo], also fired by
   trigger-rtc-start callers like :graph/restored — both land on
   Boot_graph_ready here. The cljs repo watcher also pushed
   sync-app-state on every switch (the worker tracks
   git/current-repo), so push it even though start() does too for
   remote graphs *)
let notify_repo_switch repo =
  Rtc_ops.sync_app_state (Some repo);
  emit (Some repo)

(* cljs trigger-rtc-start — manual start callers *)
let trigger_start repo = emit (Some repo)

(* cljs document-visibility-state watch ->
   :document-visible&rtc-not-running *)
let on_visible () =
  if Platform.document_visible () then emit None

(* cljs network-online? watch -> :network-online&rtc-not-running *)
let on_online () = if Platform.online () then emit None

(* cljs logout watch -> <rtc-stop! *)
let notify_logout () = Rtc_ops.stop ()

(* cljs user.cljs logout — clear tokens, push the empty auth state to
   the worker and stop sync (<rtc-stop!) *)
let sign_out () =
  List.iter Platform.local_storage_remove
    [ "id-token"; "access-token"; "refresh-token" ];
  ignore
    (Runtime.invoke1 "thread-api/sync-app-state"
       (Wire.Map
          [ (Wire.kw "auth/id-token", Wire.String "")
          ; (Wire.kw "auth/access-token", Wire.String "")
          ; (Wire.kw "auth/refresh-token", Wire.String "")
          ]));
  notify_logout ()

let () =
  Runtime.rtc_log_handler := on_log;
  Runtime.hooks.rtc_graph_ready <- notify_repo_switch

let init () =
  Platform.add_event_listener "online" (fun _ -> on_online ());
  Platform.add_document_listener "visibilitychange" (fun _ ->
      on_visible ())
