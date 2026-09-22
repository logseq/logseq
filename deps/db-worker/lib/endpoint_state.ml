(* Repo-less state endpoints (playbook group a, worker-state side):
   sync-app-state, set-context, update-thread-atom, ui-request
   resolution, mobile-logs, db-sync config. *)

open Db_worker_effect

let pure' v = pure v
let kw s = Wire.Keyword s

let ok_map ok = Wire.Map [ (kw "ok", Wire.Bool ok) ]

(* :thread-api/sync-app-state [new-state] — merge into *state; log
   an error when the map explicitly carries :git/current-repo nil. *)
let () =
  Dispatcher.register "thread-api/sync-app-state" (fun args ->
      (match args with
       | (Wire.Map _ as m) :: _ ->
           Worker_state.merge_state m;
           (match Wire.get "git/current-repo" m with
            | Some Wire.Nil ->
                Worker_log.error
                  "sync-app-state: :git/current-repo is nil" []
            | _ -> ())
       | _ -> ());
      pure' Wire.nil)

(* :thread-api/set-context [context] — merge into :worker/context. *)
let () =
  Dispatcher.register "thread-api/set-context" (fun args ->
      (match args with t :: _ -> Worker_state.merge_context t | [] -> ());
      pure' Wire.nil)

(* :thread-api/set-ui-state [path value] — persist_db/browser.cljs
   def-thread-api is a main-thread endpoint (state/set-state!), but the
   name is also remoteInvoke'd at the worker from
   db-core/set-import-ui-state!; registering it here applies the same
   set-state! semantics to the worker's app-state mirror. *)
let () =
  Dispatcher.register "thread-api/set-ui-state" (fun args ->
      (match args with
       | path :: value :: _ -> Worker_state.set_state_at_path path value
       | _ -> ());
      pure' Wire.nil)

(* :thread-api/update-thread-atom [atom-key new-value] *)
let () =
  Dispatcher.register "thread-api/update-thread-atom" (fun args ->
      match args with
      | key_t :: v :: _ ->
          let key = Ds_wire.wire_key key_t in
          Worker_state.update_thread_atom key v;
          pure' Wire.nil
      | _ -> invalid_arg "update-thread-atom expects (atom-key value)")

(* :thread-api/resolve-ui-request [request-id result] *)
let () =
  Dispatcher.register "thread-api/resolve-ui-request" (fun args ->
      match args with
      | id_t :: result :: _ ->
          let id = Ds_wire.wire_key id_t in
          (match Worker_state.ui_request_take id with
           | Some resolver ->
               Db_worker_effect.wakeup resolver (Ok result);
               pure' (ok_map true)
           | None ->
               pure'
                 (Wire.Map
                    [
                      (kw "ok", Wire.Bool false);
                      (kw "reason", kw "request-not-found");
                      (kw "request-id", id_t);
                    ]))
      | _ -> invalid_arg "resolve-ui-request expects (request-id result)")

(* :thread-api/reject-ui-request [request-id error] — reject with
   normalized {:code :ui-request-rejected :request-id :action :data}. *)
let () =
  Dispatcher.register "thread-api/reject-ui-request" (fun args ->
      match args with
      | id_t :: error :: _ ->
          let id = Ds_wire.wire_key id_t in
          (match Worker_state.ui_request_take id with
           | Some resolver ->
               let err =
                 Wire.Map
                   [
                     (kw "code", kw "ui-request-rejected");
                     (kw "request-id", id_t);
                     ( kw "action",
                       match Wire.get "action" error with
                       | Some a -> a
                       | None -> Wire.Nil );
                     (kw "data", error);
                   ]
               in
               Db_worker_effect.wakeup resolver (Error err);
               pure' (ok_map true)
           | None ->
               pure'
                 (Wire.Map
                    [
                      (kw "ok", Wire.Bool false);
                      (kw "reason", kw "request-not-found");
                      (kw "request-id", id_t);
                    ]))
      | _ -> invalid_arg "reject-ui-request expects (request-id error)")

(* :thread-api/cancel-ui-requests [context] — reject all in-flight. *)
let cancel_ui_requests context =
  let ids = Worker_state.ui_request_ids () in
  List.iter
    (fun id ->
      match Worker_state.ui_request_take id with
      | Some resolver ->
          Db_worker_effect.wakeup resolver
            (Error
               (Wire.Map
                  [
                    (kw "code", kw "ui-request-cancelled");
                    (kw "request-id", Wire.String id);
                    (kw "action", Wire.Nil);
                    (kw "context", context);
                  ]))
      | None -> ())
    ids;
  List.length ids

let () =
  Dispatcher.register "thread-api/cancel-ui-requests" (fun args ->
      let context = match args with t :: _ -> t | [] -> Wire.Nil in
      let n = cancel_ui_requests context in
      pure'
        (Wire.Map [ (kw "ok", Wire.Bool true); (kw "cancelled", Wire.Int n) ]))

(* :thread-api/mobile-logs [] — last 800 entries of the log ring. *)
let () =
  Dispatcher.register "thread-api/mobile-logs" (fun _ ->
      let level_str = function
        | Worker_log.Trace -> "trace"
        | Worker_log.Debug -> "debug"
        | Worker_log.Info -> "info"
        | Worker_log.Warn -> "warn"
        | Worker_log.Error -> "error"
      in
      let entries = Worker_log.entries () in
      let rec drop n l = if n <= 0 then l else match l with [] -> [] | _ :: t -> drop (n - 1) t in
      let trimmed =
        let len = List.length entries in
        if len > 800 then drop (len - 800) entries else entries
      in
      pure'
        (Wire.Array
           (List.map
              (fun (e : Worker_log.entry) ->
                 Wire.Map
                   [
                     (kw "level", kw (level_str e.level));
                     (kw "message", Wire.String e.message);
                     ( kw "data",
                       Wire.Map
                         (List.map (fun (k, v) -> (Wire.String k, Wire.String v)) e.fields) );
                     (kw "time-ms", Wire.Float e.time_ms);
                   ])
              trimmed)))

(* :thread-api/get|set-db-sync-config — registered once in
   endpoint_sync.ml (sanitized via Sync_state.non_auth_db_sync_config). *)

(* :thread-api/undo-redo-* — undo_redo.ml state machine *)
let repo_arg_u args =
  match List.nth_opt args 0 with
  | Some (Wire.String s) -> s
  | _ -> invalid_arg "first arg must be repo name"

let () =
  Dispatcher.register "thread-api/undo-redo-set-pending-editor-info"
    (fun args ->
       let repo = repo_arg_u args in
       Undo_redo.set_pending_editor_info repo (List.nth_opt args 1);
       Db_worker_effect.pure Wire.nil);
  Dispatcher.register "thread-api/undo-redo-record-editor-info"
    (fun args ->
       let repo = repo_arg_u args in
       (match List.nth_opt args 1 with
        | Some info -> Undo_redo.record_editor_info repo info
        | None -> ());
       Db_worker_effect.pure Wire.nil);
  Dispatcher.register "thread-api/undo-redo-record-ui-state"
    (fun args ->
       let repo = repo_arg_u args in
       (match List.nth_opt args 1 with
        | Some s -> Undo_redo.record_ui_state repo s
        | None -> ());
       Db_worker_effect.pure Wire.nil);
  Dispatcher.register "thread-api/undo-redo-undo" (fun args ->
      Db_worker_effect.pure (Undo_redo.undo (repo_arg_u args)));
  Dispatcher.register "thread-api/undo-redo-redo" (fun args ->
      Db_worker_effect.pure (Undo_redo.redo (repo_arg_u args)));
  Dispatcher.register "thread-api/undo-redo-clear-history" (fun args ->
      Undo_redo.clear_history (repo_arg_u args);
      Db_worker_effect.pure Wire.nil);
  Dispatcher.register "thread-api/undo-redo-get-debug-state" (fun args ->
      Db_worker_effect.pure
        (Undo_redo.get_debug_state (repo_arg_u args)))
