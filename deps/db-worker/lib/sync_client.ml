(* frontend.worker.sync — db-sync client engine: ws lifecycle, reconnect,
   stale-kill loop, and the public API surface used by the thread endpoints. *)

open Datascript
open Db_worker_effect.Infix

let kw s = Wire.Keyword s

let reconnect_base_delay_ms = 1000
let reconnect_max_delay_ms = 30000
let reconnect_jitter_ms = 250
let ws_stale_kill_interval_ms = 60_000
let ws_stale_timeout_ms = 600_000

let fail_fast = Sync_util.fail_fast

let start_inflight_target : (string * string option) option ref = ref None

let current_client repo : Sync_state.client option =
  Sync_presence.current_client repo

let status repo : Wire.t option = Sync_apply.sync_counts repo

(* update-local-sync-checksum! *)
let update_local_sync_checksum repo (tx_report : tx_report) : unit =
  if Sync_state.has_client_ops_conn repo then begin
    let current_checksum = Sync_client_op.get_local_checksum repo in
    let new_checksum =
      Db_sync_checksum.update_checksum
        (Option.value current_checksum ~default:"")
        ~db_before:tx_report.db_before ~db_after:tx_report.db_after
        ~tx_data:tx_report.tx_data
    in
    (match Runtime_env.env "LOGSEQ_CHECKSUM_ASSERT" with
     | Some "1" ->
         let recomputed =
           Db_sync_checksum.recompute_checksum tx_report.db_after
         in
         if new_checksum <> recomputed then begin
           Worker_log.error "db-sync/checksum-incremental-drift"
             [ "repo", repo
             ; "current-checksum", Option.value current_checksum ~default:""
             ; "incremental-checksum", new_checksum
             ; "recomputed-checksum", recomputed
             ; "tx-count", string_of_int (List.length tx_report.tx_data) ];
           raise
             (Sync_util.ex_info "Incremental checksum drift"
                [ kw "repo", Wire.String repo
                ; ( kw "current-checksum"
                  , match current_checksum with
                    | Some c -> Wire.String c
                    | None -> Wire.Nil )
                ; kw "incremental-checksum", Wire.String new_checksum
                ; kw "recomputed-checksum", Wire.String recomputed
                ; kw "tx-count", Wire.Int (List.length tx_report.tx_data) ])
         end
     | _ -> ());
    Sync_client_op.update_local_checksum repo new_checksum
  end

let broadcast_rtc_state (client : Sync_state.client option) : unit =
  Sync_apply.broadcast_rtc_state client

let broadcast_rtc_state_client (client : Sync_state.client) : unit =
  broadcast_rtc_state (Some client)

let set_ws_state (client : Sync_state.client) (ws_state : string) : unit =
  Sync_presence.set_ws_state ~broadcast:broadcast_rtc_state_client client
    ws_state

let update_online_users (client : Sync_state.client) (users : Wire.t list)
    : unit =
  Sync_presence.update_online_users ~broadcast:broadcast_rtc_state_client
    client users

let clear_inflight (client : Sync_state.client) : unit =
  client.inflight := []

let ws_base_url () : string option =
  Sync_auth.ws_base_url (Worker_state.db_sync_config ())

let auth_token = Sync_util.auth_token

let id_token_expired = Sync_auth.id_token_expired

let resolve_ws_token = Sync_auth.resolve_ws_token

let ensure_client_graph_uuid repo (graph_id : string) : unit =
  if graph_id <> "" then
    Sync_client_op.update_graph_uuid repo (Some graph_id)

let client_op_ready repo : bool =
  Sync_state.has_client_ops_conn repo
  && Sync_client_op.get_local_tx repo <> None

let reconnect_delay_ms attempt : int =
  Sync_transport.reconnect_delay_ms attempt ~base_delay_ms:reconnect_base_delay_ms
    ~max_delay_ms:reconnect_max_delay_ms ~jitter_ms:reconnect_jitter_ms

let clear_reconnect_timer (reconnect : Sync_state.reconnect_state ref) : unit =
  match (!reconnect).timer with
  | Some timer ->
      Timers.clear timer;
      reconnect := { (!reconnect) with Sync_state.timer = None }
  | None -> ()

let reset_reconnect (client : Sync_state.client) : unit =
  clear_reconnect_timer client.reconnect;
  client.reconnect := { attempt = 0; timer = None }

let clear_stale_ws_loop_timer (client : Sync_state.client) : unit =
  match !(client.stale_kill_timer) with
  | Some timer ->
      Timers.clear timer;
      client.stale_kill_timer := None
  | None -> ()

let touch_last_ws_message (client : Sync_state.client) : unit =
  client.last_ws_message_ts := Clock.now_ms ()

let ready_state (ws : Web_socket.t) : int = Web_socket.ready_state ws

let ws_open (ws : Web_socket.t) : bool = Sync_transport.ws_open ws

let send (ws : Web_socket.t) (message : Wire.t) : unit Db_worker_effect.t =
  Sync_transport.send ws message

let enqueue_receive_message (client : Sync_state.client)
    (task : unit -> unit Db_worker_effect.t) : unit =
  let prev = !(client.receive_queue) in
  client.receive_queue :=
    Db_worker_effect.catch prev (fun _ -> Db_worker_effect.pure ())
    >>= fun () ->
    Db_worker_effect.catch (task ()) (fun error ->
         Sync_util.set_last_sync_error client error;
         Worker_log.error "db-sync/ws-handle-message-failed"
           [ "repo", client.repo; "error", Printexc.to_string error ];
         Db_worker_effect.pure ())

(* update-presence! *)
let update_presence (editing_block_uuid : string) : unit =
  match !Sync_state.db_sync_client with
  | Some client -> (
      match client.ws with
      | Some ws ->
          Db_worker_effect.async (fun () ->
               send ws
                 (Wire.Map
                    [ kw "type", Wire.String "presence"
                    ; kw "editing-block-uuid"
                    , Wire.String editing_block_uuid ]))
      | None -> ())
  | None -> ()

let enqueue_asset_task (client : Sync_state.client)
    (task : unit -> unit Db_worker_effect.t) : unit =
  Sync_state.enqueue client.asset_queue task

let ensure_client_state repo : Sync_state.client = Sync_state.new_client repo

let rec schedule_reconnect repo (client : Sync_state.client) (url : string)
    (reason : string) : unit =
  let reconnect = !(client.reconnect) in
  match reconnect.timer with
  | Some _ -> ()
  | None ->
      let delay = reconnect_delay_ms reconnect.attempt in
      let timeout_id =
        Timers.set_timeout delay (fun () ->
             Worker_log.info "db-sync/ws-reconnect"
               [ "repo", repo
               ; "db-sync-client-exists?"
               , string_of_bool (!Sync_state.db_sync_client <> None) ];
             client.reconnect := { (!(client.reconnect)) with timer = None };
             match !Sync_state.db_sync_client with
             | Some current
               when current.repo = repo && current.graph_id = client.graph_id ->
                 Db_worker_effect.async (fun () ->
                      Db_worker_effect.catch
                        (resolve_ws_token ()
                         >>= fun token ->
                         connect repo current url token
                         >>= fun updated ->
                         Db_worker_effect.pure
                           (Sync_state.db_sync_client := Some updated))
                        (fun error ->
                           Worker_log.error "db-sync/ws-reconnect-failed"
                             [ "repo", repo
                             ; "error", Printexc.to_string error ];
                           schedule_reconnect repo current url
                             "connect-failed";
                           Db_worker_effect.pure ()))
             | _ -> ())
      in
      client.reconnect :=
        { Sync_state.attempt = reconnect.attempt + 1
        ; timer = Some timeout_id };
      Worker_log.info "db-sync/ws-reconnect-scheduled"
        [ "repo", repo; "delay", string_of_int delay
        ; "attempt", string_of_int reconnect.attempt; "reason", reason ]

and attach_ws_handlers repo (client : Sync_state.client)
    (ws : Web_socket.t) (url : string) : unit =
  (* events delivered via Web_socket.connect on_event — see connect *)
  ignore (repo, client, ws, url)

(* cljs attach-ws-handlers! behavior lives inline in [connect] because the
   OCaml Web_socket spec delivers all events through a single on_event
   callback. *)

and close_stale_ws_loop (client : Sync_state.client) (ws : Web_socket.t)
    (url : string) : unit =
  clear_stale_ws_loop_timer client;
  let timer =
    Timers.set_interval ws_stale_kill_interval_ms (fun () ->
         match !Sync_state.db_sync_client with
         | Some current
           when current.repo = client.repo
                && current.graph_id = client.graph_id
                && current.ws = Some ws ->
             if ws_open ws then begin
               let now = Clock.now_ms () in
               let last_ts = !(current.last_ws_message_ts) in
               let stale_ms = now -. last_ts in
               if stale_ms >= float_of_int ws_stale_timeout_ms then begin
                 Worker_log.warn "db-sync/ws-stale-timeout"
                   [ "repo", client.repo
                   ; "stale-ms", string_of_float stale_ms ];
                 Db_worker_effect.async (fun () -> Web_socket.close ws)
               end
             end
             else if List.mem (ready_state ws) [ 2; 3 ] then begin
               Worker_log.warn "db-sync/ws-stale-closed"
                 [ "repo", client.repo
                 ; "ready-state", string_of_int (ready_state ws) ];
               clear_stale_ws_loop_timer current;
               clear_inflight current;
               update_online_users current [];
               set_ws_state current "closed";
               schedule_reconnect client.repo current url "stale-closed"
             end
         | _ -> ())
  in
  client.stale_kill_timer := Some timer

and stop_client (client : Sync_state.client) : unit =
  clear_stale_ws_loop_timer client;
  ignore (Sync_apply.clear_upload_response_timeout client);
  clear_reconnect_timer client.reconnect;
  match client.ws with
  | Some ws ->
      update_online_users client [];
      set_ws_state client "closed";
      Db_worker_effect.async (fun () -> Web_socket.close ws)
  | None -> ()

and active_client_for (client : Sync_state.client option) (repo : string)
    (graph_id : string option) : bool =
  match client with
  | Some c
    when c.repo = repo && c.graph_id = graph_id -> (
      match c.ws with
      | Some ws -> List.mem (ready_state ws) [ 0; 1 ]
      | None -> false)
  | _ -> false

and connect repo (client : Sync_state.client) (url : string)
    (token : string option) : Sync_state.client Db_worker_effect.t =
  (match client.ws with
   | Some _ -> stop_client client
   | None -> ());
  Worker_log.info "db-sync/connect!"
    [ "repo", repo
    ; "token-exists?"
    , string_of_bool (Option.is_some (match token with
                      | Some _ -> token
                      | None -> auth_token ())) ];
  match (match token with Some _ -> token | None -> auth_token ()) with
  | None -> Db_worker_effect.pure client
  | Some token' ->

      let updated = { client with Sync_state.ws = None } in
      Web_socket.connect
        ~url:(Sync_transport.append_token url (Some token'))
        ~on_event:(fun event ->
           match event with
           | Web_socket.Open ->
               reset_reconnect updated;
               touch_last_ws_message updated;
               set_ws_state updated "open";
               Sync_util.clear_last_sync_error updated;
               Db_worker_effect.async (fun () ->
                    (match updated.ws with
                     | Some ws ->
                         send ws
                           (Wire.Map
                              [ kw "type", Wire.String "hello"
                              ; kw "client", Wire.String repo ])
                     | None -> Db_worker_effect.pure ())
                    >>= fun () ->
                    Db_worker_effect.pure
                      (Sync_assets.enqueue_asset_sync repo updated
                         ~enqueue_asset_task ~current_client
                         ~broadcast_rtc_state:broadcast_rtc_state_client))
           | Web_socket.Message data ->
               touch_last_ws_message updated;
               enqueue_receive_message updated (fun () ->
                    Db_worker_effect.pure
                      (Sync_handle_message.handle_message repo updated data))
           | Web_socket.Binary _ -> ()
           | Web_socket.Error e ->
               Worker_log.error "db-sync/ws-error" [ "error", e ]
           | Web_socket.Close (_, _) ->
               Worker_log.info "db-sync/ws-closed" [ "repo", repo ];
               clear_stale_ws_loop_timer updated;
               clear_inflight updated;
               update_online_users updated [];
               set_ws_state updated "closed";
               schedule_reconnect repo updated url "close")
      >>= fun ws ->
      updated.ws <- Some ws;
      close_stale_ws_loop updated ws url;
      Db_worker_effect.pure updated

let stop () : unit Db_worker_effect.t =
  (match !Sync_state.db_sync_client with
   | Some client ->
       stop_client client;
       Sync_state.db_sync_client := None
   | None -> ());
  Db_worker_effect.pure ()

(* list-remote-graphs! — needed by resolve-start-graph-id *)
let list_remote_graphs () : Wire.t list Db_worker_effect.t =
  Sync_upload.list_remote_graphs ()

let rec resolve_start_graph_id repo : string option Db_worker_effect.t =
  match Sync_util.get_graph_id repo with
  | Some graph_id -> Db_worker_effect.pure (Some graph_id)
  | None -> (
      let target_graph_name = strip_db_version_prefix repo in
      if target_graph_name = "" then Db_worker_effect.pure None
      else
        list_remote_graphs ()
        >>= fun remote_graphs ->
        let remote_graph_id =
          List.find_map
            (fun g ->
               match (Wire.get "graph-name" g, Wire.get "graph-id" g) with
               | Some (Wire.String name), Some (Wire.String id)
                 when name = target_graph_name ->
                   Some id
               | _ -> None)
            remote_graphs
        in
        match remote_graph_id with
        | Some id when id <> "" ->
            ensure_client_graph_uuid repo id;
            Db_worker_effect.pure (Some id)
        | _ -> Db_worker_effect.pure None)

and strip_db_version_prefix (s : string) : string =
  let s = String.trim s in
  let prefix = "logseq_db_" in
  if String.length s > String.length prefix
     && String.sub s 0 (String.length prefix) = prefix
  then String.sub s (String.length prefix)
         (String.length s - String.length prefix)
  else s

let start repo : unit Db_worker_effect.t =
  let base = ws_base_url () in
  let graph_id = Sync_util.get_graph_id repo in
  let start_target = (repo, graph_id) in
  let inflight_target = !start_inflight_target in
  let current = !Sync_state.db_sync_client in
  match base with
  | Some base when base <> "" ->
      resolve_start_graph_id repo
      >>= fun graph_id' -> (
      if graph_id' = None || graph_id' = Some "" then begin
        Worker_log.info "db-sync/start-skipped"
          [ "repo", repo; "graph-id", Option.value graph_id' ~default:""
          ; "base", base ];
        Db_worker_effect.pure ()
      end
      else if not (client_op_ready repo) then begin
        Worker_log.info "db-sync/start-skipped"
          [ "repo", repo; "graph-id", Option.value graph_id' ~default:""
          ; "base", base; "reason", "client-op-not-ready" ];
        Db_worker_effect.pure ()
      end
      else if Some start_target =
                (match inflight_target with
                 | Some (r, g) -> Some (r, g)
                 | None -> None) then
        Db_worker_effect.pure ()
      else if active_client_for current repo graph_id' then (
        broadcast_rtc_state current;
        (match current with
         | Some c -> Sync_apply.enqueue_flush_pending repo c
         | None -> ());
        Db_worker_effect.pure ())
      else begin
        start_inflight_target := Some start_target;
        Db_worker_effect.finally
          (stop ()
           >>= fun () ->
           let client = ensure_client_state repo in
           let url =
             Sync_transport.format_ws_url base
               (Option.value graph_id' ~default:"")
           in
           ensure_client_graph_uuid repo
             (Option.value graph_id' ~default:"");
           let connected =
             { client with Sync_state.graph_id = graph_id' }
           in
           resolve_ws_token ()
           >>= fun token ->
           connect repo connected url token
           >>= fun connected' ->
           Db_worker_effect.pure
             (Sync_state.db_sync_client := Some connected'))
          (fun () ->
             if !start_inflight_target = Some start_target then
               Db_worker_effect.pure (start_inflight_target := None)
             else Db_worker_effect.pure ())
      end)
  | _ ->
      Worker_log.info "db-sync/start-skipped"
        [ "repo", repo
        ; "graph-id", Option.value graph_id ~default:""
        ; "base", Option.value base ~default:"" ];
      Db_worker_effect.pure ()

(* enqueue-local-tx! / handle-local-tx! *)
let enqueue_local_tx repo tx_report = Sync_apply.enqueue_local_tx repo tx_report
let handle_local_tx repo tx_report = Sync_apply.handle_local_tx repo tx_report

let request_asset_download repo asset_uuid =
  Sync_apply.request_asset_download repo asset_uuid

let download_missing_assets repo graph_id =
  Sync_assets.download_missing_remote_assets repo graph_id

let retry_asset_upload repo : unit Db_worker_effect.t =
  (match current_client repo with
   | Some client ->
       Sync_assets.enqueue_asset_sync repo client ~enqueue_asset_task
         ~current_client ~broadcast_rtc_state:broadcast_rtc_state_client
   | None -> ());
  Db_worker_effect.pure ()

let rehydrate_large_titles_from_db repo graph_id =
  Sync_apply.rehydrate_large_titles_from_db repo graph_id

let upload_graph repo = Sync_upload.upload_graph repo
let create_remote_graph repo ~graph_e2ee ~graph_ready_for_use =
  Sync_upload.create_remote_graph repo ~graph_e2ee ~graph_ready_for_use

let stop_upload repo = Sync_apply.set_upload_stopped repo true
let resume_upload repo = Sync_apply.set_upload_stopped repo false
let upload_stopped repo = Sync_apply.upload_stopped repo

(* Cross-package thread-fn hooks — the implementations are registered as
   thread-api endpoints by endpoint_lifecycle / endpoint_search /
   endpoint_sync (this package's rehydrate); dispatch by name so the sync
   layer stays decoupled from their modules. *)
let () =
  Sync_deps.close_db :=
    Some
      (fun repo ->
         Dispatcher.invoke "thread-api/db-sync-close-db" [ Wire.String repo ]
         >>= fun _ -> Db_worker_effect.pure ());
  Sync_deps.unlink_db :=
    Some
      (fun repo ->
         Dispatcher.invoke "thread-api/unsafe-unlink-db" [ Wire.String repo ]
         >>= fun _ -> Db_worker_effect.pure ());
  Sync_deps.invalidate_search_db :=
    Some
      (fun repo ->
         Dispatcher.invoke "thread-api/db-sync-invalidate-search-db"
           [ Wire.String repo ]
         >>= fun _ -> Db_worker_effect.pure ());
  Sync_deps.create_or_open_db :=
    Some
      (fun repo opts ->
         Dispatcher.invoke "thread-api/create-or-open-db"
           [ Wire.String repo; opts ]);
  Sync_deps.rehydrate_large_titles :=
    Some
      (fun repo graph_id -> rehydrate_large_titles_from_db repo graph_id);
  (* cljs binds these via direct namespace references (worker-undo-redo
     and op/construct load alongside the sync namespaces); the OCaml
     port routes them through Sync_deps. *)
  Sync_deps.clear_history := Some Undo_redo.clear_history;
  Sync_deps.gen_undo_ops :=
    Some
      (fun repo (r : Datascript.tx_report) tx_id ->
        Undo_redo.gen_undo_ops repo ~tx_data:r.tx_data
          ~tx_meta:
            (List.map
               (fun (a, v) -> (a, Ds_wire.transit_of_value v))
               r.tx_meta)
          ~db_before:r.db_before ~db_after:r.db_after ~tx_id
          ~apply_history:(fun repo tx_id_opt undo pairs ->
            let tx_meta =
              List.filter_map
                (fun (k, v) ->
                  match k with
                  | Wire.Keyword s -> Some (s, Ds_wire.value_of_transit v)
                  | _ -> None)
                pairs
            in
            let result =
              Sync_apply.apply_history_action repo
                (Option.value ~default:"" tx_id_opt) undo tx_meta
            in
            (match result with
             | Wire.Map kvs ->
                 List.filter_map
                   (fun (k, v) ->
                     match k with
                     | Wire.Keyword s -> Some (s, v)
                     | _ -> None)
                   kvs
             | _ -> [])));
  Sync_deps.semantic_outliner_ops :=
    Some (fun op -> List.mem op Outliner_op.semantic_outliner_op_names);
  (* cljs db-listener hoists :db-sync and :update-checksum out of the
     deferred handlers: update-checksum first, then
     db-sync/handle-local-tx!, then the main-thread sync pipeline. *)
  Db_listener.update_checksum := update_local_sync_checksum;
  Db_listener.persist_local_tx := (fun repo r -> Sync_apply.handle_local_tx repo r)
