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

(* -- rtc-log + type projections (cljs rtc-log / rtc-download-log /
   rtc-upload-log / rtc-misc-log): latest entry per class. The cljs
   detail-log accumulators feed the rtc indicator's details popover,
   which isn't ported — these keep the flow state for it. -- *)
let last_log : Wire.t option ref = ref None
let download_log : Wire.t option ref = ref None
let upload_log : Wire.t option ref = ref None
let misc_log : Wire.t option ref = ref None

let kw (w : Wire.t) key = Option.bind (Wire.get w key) Wire.as_keyword

(* cljs rtc-log skips {:sub-type :skip, :type :rtc.log/apply-remote-update} *)
let on_log (log : Wire.t) =
  if not
       (kw log "sub-type" = Some "skip"
       && kw log "type" = Some "rtc.log/apply-remote-update")
  then begin
    last_log := Some log;
    match kw log "type" with
    | Some "rtc.log/download" -> download_log := Some log
    | Some "rtc.log/upload" -> upload_log := Some log
    | _ -> misc_log := Some log
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
  match repo, !Runtime.current_repo with
  | Some r, _ -> Rtc_ops.start r
  | None, Some r -> Rtc_ops.start r
  | None, None -> ()

let emit repo =
  if logged_in () then begin
    (match !emit_timeout with
     | Some id -> Web_dom.clear_timeout id
     | None -> ());
    emit_timeout :=
      Some (Web_dom.set_timeout_id (fun () -> start repo) 50)
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
  if Web_dom.document_visible () then emit None

(* cljs network-online? watch -> :network-online&rtc-not-running *)
let on_online () = if Platform.online () then emit None

(* cljs logout watch -> <rtc-stop!; no sign-out UI exists yet, but this
   is the hook a logout surface should call *)
let notify_logout () = Rtc_ops.stop ()

let () =
  Runtime.rtc_log_handler := on_log;
  Runtime.rtc_graph_ready := notify_repo_switch

let init () =
  Web_dom.add_window_listener "online" (fun _ -> on_online ());
  Web_dom.on_document_event "visibilitychange" (fun _ ->
      on_visible ())
