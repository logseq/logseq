(* frontend.worker.sync.handle-message — WebSocket message handlers. *)

open Db_worker_effect.Infix

let kw s = Wire.Keyword s

let fail_fast = Sync_util.fail_fast

let sync_counts repo : Wire.t option =
  Sync_presence.sync_counts
    ~get_missing_asset_upload_files:Sync_assets.get_missing_asset_upload_files
    ~latest_remote_tx:Sync_apply.repo_latest_remote_tx
    ~latest_remote_checksum:Sync_apply.repo_latest_remote_checksum repo

let broadcast_rtc_state (client : Sync_state.client) : unit =
  Broadcast.to_clients ~kind:"rtc-sync-state"
    ~transit_payload:
      (Transit_codec.to_string
         (Sync_presence.rtc_state_payload ~sync_counts client))

let update_online_users (client : Sync_state.client) (users : Wire.t list) =
  Sync_presence.update_online_users ~broadcast:broadcast_rtc_state client users

let wire_str (v : Wire.t) : string =
  match v with
  | Wire.String s | Wire.Uuid s | Wire.Keyword s -> s
  | _ -> ""

let update_user_presence (client : Sync_state.client) (user_id : string)
    (editing_block_uuid : string) =
  Sync_presence.update_user_presence ~broadcast:broadcast_rtc_state client
    ~user_id ~editing_block_uuid

let get_user_uuid () : string option =
  Sync_auth.get_user_uuid (Sync_state.id_token ())

let send (ws : Web_socket.t) (message : Wire.t) : unit =
  ignore (Sync_transport.send ws message)

let ws_open = Sync_transport.ws_open

let enqueue_asset_task (client : Sync_state.client)
    (task : unit -> unit Db_worker_effect.t) : unit =
  Sync_state.enqueue client.asset_queue task

let enqueue_send_task (client : Sync_state.client)
    (task : unit -> unit Db_worker_effect.t) : unit =
  Sync_state.enqueue_catching client.send_queue task
    ~on_error:(fun e ->
       Worker_log.error "db-sync/send-queue-task-failed"
         [ ("repo", client.repo); ("error", Printexc.to_string e) ];
       Db_worker_effect.pure ())

let current_client repo : Sync_state.client option =
  Sync_presence.current_client repo

let context ~repo ~typ ?field () : Wire.t =
  Wire.Map
    (List.filter_map Fun.id
       [ Some (kw "repo", Wire.String repo)
       ; Some (kw "type", Wire.String typ)
       ; (match field with
          | Some f -> Some (kw "field", kw f)
          | None -> None) ])

let require_number (value : Wire.t) (context : Wire.t) =
  match value with
  | Wire.Int _ | Wire.Float _ | Wire.Int64 _ -> ()
  | _ -> fail_fast "db-sync/invalid-field" context

let require_non_negative (value : Wire.t) (context : Wire.t) =
  require_number value context;
  let neg =
    match value with
    | Wire.Int n -> n < 0
    | Wire.Int64 n -> n < 0L
    | Wire.Float f -> f < 0.
    | _ -> false
  in
  if neg then fail_fast "db-sync/invalid-field" context

let wire_to_int (value : Wire.t) : int option =
  match value with
  | Wire.Int n -> Some n
  | Wire.Int64 n -> Some (Int64.to_int n)
  | Wire.Float f -> Some (int_of_float f)
  | _ -> None

let require_seq (value : Wire.t) (context : Wire.t) =
  match value with
  | Wire.Array _ | Wire.List _ | Wire.Set _ -> ()
  | _ -> fail_fast "db-sync/invalid-field" context

let seq_items (value : Wire.t) : Wire.t list =
  match value with
  | Wire.Array l | Wire.List l | Wire.Set l -> l
  | _ -> []

let require_uuid (value : Wire.t) (context : Wire.t) =
  match value with
  | Wire.Uuid _ -> ()
  | _ -> fail_fast "db-sync/invalid-field" context

let parse_transit (value : Wire.t) (context : Wire.t) : Wire.t =
  let raw =
    match value with
    | Wire.String s -> s
    | _ -> fail_fast "db-sync/invalid-field" context
  in
  Sync_transport.parse_transit "db-sync/response-parse-failed"
    (Wire.as_map context) raw

let request_pull (client : Sync_state.client) (since : int) : unit =
  match client.ws with
  | Some ws when ws_open ws ->
      enqueue_send_task client (fun () ->
           match client.ws with
           | Some ws when ws_open ws ->
               let pending = !(client.pending_pull_since) in
               if pending = None || Option.get pending > since then begin
                 client.pending_pull_since := Some since;
                 send ws
                   (Wire.Map
                      [ kw "type", Wire.String "pull"
                      ; kw "since", Wire.Int since ])
               end;
               Db_worker_effect.pure ()
           | _ -> Db_worker_effect.pure ())
  | _ -> ()

let clear_pending_pull (client : Sync_state.client) =
  client.pending_pull_since := None

let pending_local_tx repo : bool =
  Sync_client_op.get_pending_local_tx_count repo > 0

let synced_checksum_ready repo (client : Sync_state.client) local_t remote_t =
  local_t = remote_t
  && not (pending_local_tx repo)
  && !(client.inflight) = []

let checksum_compare_ready repo (client : Sync_state.client) local_t remote_t =
  synced_checksum_ready repo client local_t remote_t
  && Sync_client_op.get_local_checksum repo <> None

let verify_sync_checksum repo (client : Sync_state.client) local_tx remote_tx
    remote_checksum (context : Wire.t) =
  if !Sync_state.dev_or_test then
    match remote_checksum with
    | Some (Wire.String _) as rc ->
        if checksum_compare_ready repo client local_tx remote_tx then
          let local_checksum = Sync_client_op.get_local_checksum repo in
          let local_w =
            match local_checksum with
            | Some s -> Wire.String s
            | None -> Wire.Nil
          in
          if local_checksum
             <> (match remote_checksum with
                  | Some (Wire.String s) -> Some s
                  | _ -> None) then begin
            let mismatch =
              Wire.Map
                (Wire.as_map context
                 @ [ kw "type", kw "db-sync/checksum-mismatch"
                   ; kw "repo", Wire.String repo
                   ; kw "local-tx", Wire.Int local_tx
                   ; kw "remote-tx", Wire.Int remote_tx
                   ; kw "local-checksum", local_w
                   ; kw "remote-checksum"
                   , (match rc with Some w -> w | None -> Wire.Nil) ])
            in
            Sync_log_and_state.add_rtc_log "rtc.log/checksum-mismatch"
              mismatch;
            Worker_log.warn "db-sync/checksum-mismatch"
              [ ("repo", repo) ]
          end
    | _ -> ()

let handle_tx_reject repo (client : Sync_state.client) (message : Wire.t)
    (local_tx : int option) =
  ignore (Sync_apply.clear_upload_response_timeout client);
  let reason = Wire.get "reason" message in
  let remote_t = Wire.get "t" message in
  let success_tx_ids = Wire.get "success-tx-ids" message in
  let failed_tx_id = Wire.get "failed-tx-id" message in
  let missing_block_uuids = Wire.get "missing-block-uuids" message in
  (match reason with
   | None -> fail_fast "db-sync/missing-field"
               (context ~repo ~typ:"tx/reject" ~field:"reason" ())
   | _ -> ());
  (match remote_t with
   | Some t ->
       require_non_negative t (context ~repo ~typ:"tx/reject" ())
   | None -> ());
  (match success_tx_ids with
   | Some ids ->
       require_seq ids (context ~repo ~typ:"tx/reject" ~field:"success-tx-ids" ());
       List.iter
         (fun tx_id ->
            require_uuid tx_id
              (context ~repo ~typ:"tx/reject" ~field:"success-tx-ids" ()))
         (seq_items ids)
   | None -> ());
  (match failed_tx_id with
   | Some id ->
       require_uuid id (context ~repo ~typ:"tx/reject" ~field:"failed-tx-id" ())
   | None -> ());
  (match missing_block_uuids with
   | Some uuids ->
       require_seq uuids
         (context ~repo ~typ:"tx/reject" ~field:"missing-block-uuids" ());
       List.iter
         (fun u ->
            require_uuid u
              (context ~repo ~typ:"tx/reject" ~field:"missing-block-uuids" ()))
         (seq_items uuids)
   | None -> ());
  (match reason with
   | Some (Wire.String "stale") ->
       request_pull client (Option.value local_tx ~default:0)
   | _ ->
       let inflight = !(client.inflight) in
       let in_flight id = List.mem (wire_str id) inflight in
       let successful_tx_ids =
         seq_items (Option.value success_tx_ids ~default:(Wire.Array []))
         |> List.filter in_flight
         |> List.map wire_str
       in
       let failed_tx_id' =
         match failed_tx_id with
         | Some id when in_flight id -> Some (wire_str id)
         | _ -> None
       in
       let data =
         match Wire.get "data" message with
         | Some raw -> Some (parse_transit raw
                               (context ~repo ~typ:"tx/reject" ~field:"data" ()))
         | None -> None
       in
       let rejected_data =
         Wire.Map
           (List.filter_map Fun.id
              [ Some (kw "type", kw "db-sync/tx-rejected")
              ; Some (kw "repo", Wire.String repo)
              ; Some (kw "message-type", Wire.String "tx/reject")
              ; Some (kw "reason", Option.get reason)
              ; (match remote_t with
                 | Some t -> Some (kw "t", t)
                 | None -> None)
              ; (match successful_tx_ids with
                 | [] -> None
                 | ids ->
                     Some
                       ( kw "success-tx-ids"
                       , Wire.Array (List.map (fun s -> Wire.Uuid s) ids) ))
              ; (match failed_tx_id' with
                 | Some id -> Some (kw "failed-tx-id", Wire.Uuid id)
                 | None -> None)
              ; (match missing_block_uuids with
                 | Some us -> Some (kw "missing-block-uuids", us)
                 | None -> None)
              ; (match data with
                 | Some d -> Some (kw "data", d)
                 | None -> None) ])
       in
       if success_tx_ids <> None || failed_tx_id <> None then begin
         ignore (Sync_apply.mark_pending_txs_false repo successful_tx_ids);
         match failed_tx_id' with
         | Some id -> Sync_apply.rollback_and_mark_failed_txs repo [ id ]
         | None -> ()
       end
       else
         Sync_apply.rollback_and_mark_failed_txs repo inflight;
       client.inflight := [];
       broadcast_rtc_state client;
       Sync_log_and_state.add_rtc_log "rtc.log/tx-rejected" rejected_data;
       fail_fast "db-sync/tx-rejected" rejected_data)

let handle_hello repo (client : Sync_state.client) local_tx remote_tx
    remote_checksum =
  let remote_tx_n =
    match wire_to_int remote_tx with
    | Some n -> n
    | None ->
        require_non_negative remote_tx (context ~repo ~typ:"hello" ());
        0
  in
  (match remote_tx with
   | Wire.Nil -> ()
   | t -> require_non_negative t (context ~repo ~typ:"hello" ()));
  verify_sync_checksum repo client (Option.value local_tx ~default:0)
    remote_tx_n remote_checksum (context ~repo ~typ:"hello" ());
  broadcast_rtc_state client;
  (match local_tx with
   | Some l when remote_tx_n > l -> request_pull client l
   | _ -> ());
  Sync_assets.enqueue_asset_sync repo client
    ~enqueue_asset_task ~current_client ~broadcast_rtc_state;
  Worker_log.info "db-sync/handle-hello"
    [ ("empty-inflight?", string_of_bool (!(client.inflight) = []))
    ; ("online?", string_of_bool (Sync_state.online ()))
    ; ("ws-open?"
      , (match client.ws with
         | Some ws -> string_of_bool (ws_open ws)
         | None -> "false"))
    ; ("pending-txs-count"
      , string_of_int
          (List.length (Sync_apply.pending_txs repo ~limit:50 ()))) ];
  Sync_apply.enqueue_flush_pending repo client

let handle_online_users repo (client : Sync_state.client) (message : Wire.t) =
  match Wire.get "online-users" message with
  | Some ((Wire.Array users | Wire.List users | Wire.Set users)) ->
      update_online_users client users
  | Some _ ->
      fail_fast "db-sync/invalid-field"
        (context ~repo ~typ:"online-users" ~field:"online-users" ())
  | None -> update_online_users client []

let handle_presence (client : Sync_state.client) (message : Wire.t) =
  let user_id = Wire.get "user-id" message in
  let editing_block_uuid = Wire.get "editing-block-uuid" message in
  match user_id with
  | Some (Wire.Uuid uid) ->
      let own = get_user_uuid () = Some uid in
      if not own then
        update_user_presence client uid
            (match editing_block_uuid with
             | Some (Wire.Uuid u) | Some (Wire.String u) -> u
             | _ -> "")
  | _ -> ()

let handle_tx_batch_ok repo (client : Sync_state.client) remote_tx
    remote_checksum =
  (* cljs (require-non-negative remote-tx) — unconditional, :t missing/nil
     fail-fasts *)
  require_non_negative remote_tx (context ~repo ~typ:"tx/batch/ok" ());
  Sync_apply.ack_upload_response repo client;
  let remote_tx_n = Option.value (wire_to_int remote_tx) ~default:0 in
  let current_local_tx = Option.value (Sync_client_op.get_local_tx repo) ~default:0 in
  let next_local_tx = max current_local_tx remote_tx_n in
  Sync_client_op.update_local_tx repo next_local_tx;
  Sync_util.clear_last_sync_error client;
  ignore (Sync_apply.mark_pending_txs_false repo !(client.inflight));
  client.inflight := [];
  broadcast_rtc_state client;
  verify_sync_checksum repo client next_local_tx remote_tx_n remote_checksum
    (context ~repo ~typ:"tx/batch/ok" ());
  Sync_apply.enqueue_flush_pending repo client

(* update-latest-remote-state! *)
let update_latest_remote_state repo (message : Wire.t)
    : bool * int option =
  let message_type =
    match Wire.get "type" message with
    | Some (Wire.String s) -> s
    | _ -> ""
  in
  let remote_tx = Wire.get "t" message in
  let remote_checksum = Wire.get "checksum" message in
  let has_checksum = remote_checksum <> None in
  let latest_remote_tx = Hashtbl.find_opt Sync_apply.repo_latest_remote_tx repo in
  let authoritative =
    message_type = "hello" || message_type = "changed"
  in
  let remote_tx_n = wire_to_int (Option.value remote_tx ~default:Wire.Nil) in
  let stale_remote_tx =
    match (remote_tx_n, latest_remote_tx) with
    | Some r, Some l -> r < l && not authoritative
    | _ -> false
  in
  (match remote_tx_n with
   | Some r ->
       if authoritative then
         Hashtbl.replace Sync_apply.repo_latest_remote_tx repo r
       else
         Hashtbl.replace Sync_apply.repo_latest_remote_tx repo
           (match latest_remote_tx with
            | Some prev -> max prev r
            | None -> r)
   | None -> ());
  (if has_checksum && not stale_remote_tx then
     match remote_checksum with
     | Some (Wire.String c) ->
         Hashtbl.replace Sync_apply.repo_latest_remote_checksum repo c
     | _ -> ());
  (stale_remote_tx, latest_remote_tx)

let validate_local_tx repo (message : Wire.t) (local_tx : int option) =
  let message_type =
    match Wire.get "type" message with
    | Some (Wire.String s) -> s
    | _ -> ""
  in
  if List.mem message_type
       [ "hello"; "tx/batch/ok"; "pull/ok"; "changed"; "tx/reject" ] then
    let valid =
      match local_tx with
      | Some n -> n >= 0
      | None -> false
    in
    if not valid then
      raise
        (Sync_util.ex_info "Invalid local tx"
           [ kw "repo", Wire.String repo
           ; kw "message-type", Wire.String message_type
           ; kw "local-tx"
           , (match local_tx with
              | Some n -> Wire.Int n
              | None -> Wire.Nil) ])

let handle_pull_ok repo (client : Sync_state.client) (local_tx : int option)
    (remote_tx : Wire.t) (remote_checksum : Wire.t option)
    (message : Wire.t) : unit =
  clear_pending_pull client;
  (* cljs (> remote-tx local-tx) throws on a missing/nil :t before the
     branch is entered *)
  require_non_negative remote_tx (context ~repo ~typ:"pull/ok" ());
  let remote_tx_n = Option.value (wire_to_int remote_tx) ~default:0 in
  let local_tx_n = Option.value local_tx ~default:0 in
  if remote_tx_n > local_tx_n then begin
    let txs = Wire.get "txs" message in
    (match txs with
     | Some t -> require_seq t (context ~repo ~typ:"pull/ok" ~field:"txs" ())
     | None -> require_seq Wire.Nil
                 (context ~repo ~typ:"pull/ok" ~field:"txs" ()));
    let remote_txs =
      seq_items (Option.get txs)
      |> List.map (fun data ->
             let tx_data =
               parse_transit
                 (Option.value (Wire.get "tx" data) ~default:Wire.Nil)
                 (context ~repo ~typ:"pull/ok" ())
             in
             Wire.Map
               (List.filter_map Fun.id
                  [ (match Wire.get "t" data with
                     | Some t -> Some (kw "t", t)
                     | None -> None)
                  ; (match Wire.get "outliner-op" data with
                     | Some o -> Some (kw "outliner-op", o)
                     | None -> None)
                  ; Some (kw "tx-data", tx_data) ]))
    in
    match remote_txs with
    | [] -> ()
    | _ ->
        let eff : unit Db_worker_effect.t =
          (match Worker_state.datascript_conn repo with
           | Some conn -> (
               try
                 Db_worker_effect.pure
                   (Sync_deps.require "graph_e2ee" Sync_deps.graph_e2ee
                      (Datascript.Conn.db conn))
               with e -> Db_worker_effect.error e)
           | None -> Db_worker_effect.pure false)
          >>= fun graph_e2ee ->
          Sync_deps.require "ensure_graph_aes_key"
            Sync_deps.ensure_graph_aes_key repo
          >>= fun aes_key ->
          (if graph_e2ee && aes_key = Wire.Nil then
             fail_fast "db-sync/missing-field"
               (context ~repo ~typ:"pull/ok" ~field:"aes-key" ());
           match aes_key with
           | Wire.Nil -> Db_worker_effect.pure remote_txs
           | _ ->
               Db_worker_effect.all
                 (List.map
                    (fun remote_tx ->
                       let tx_data = Wire.get "tx-data" remote_tx in
                       (match tx_data with
                        | Some td ->
                            Sync_deps.require "decrypt_tx_data"
                              Sync_deps.decrypt_tx_data
                              (match aes_key with
                               | Wire.String s -> s
                               | _ -> "")
                              (seq_items td)
                            >>= fun tx_data' ->
                            Db_worker_effect.pure
                              (Wire.Map
                                 (List.map
                                    (fun (k, v) ->
                                       if k = kw "tx-data" then
                                         (k, Wire.Array tx_data')
                                       else (k, v))
                                    (Wire.as_map remote_tx)))
                        | None -> Db_worker_effect.pure remote_tx))
                    remote_txs))
          >>= fun remote_txs' ->
          Db_worker_effect.catch
            (Sync_apply.apply_remote_txs repo client remote_txs')
            (fun e ->
               Worker_log.error "apply-remote-tx"
                 [ ("repo", repo); ("error", Printexc.to_string e) ];
               Db_worker_effect.error e)
          >>= fun () ->
          Sync_client_op.update_local_tx repo remote_tx_n;
          broadcast_rtc_state client;
          verify_sync_checksum repo client remote_tx_n remote_tx_n
            remote_checksum (context ~repo ~typ:"pull/ok" ());
          Sync_apply.enqueue_flush_pending repo client;
          Db_worker_effect.pure ()
        in
        Db_worker_effect.async (fun () ->
             Db_worker_effect.catch
               (Db_worker_effect.bind eff (fun () ->
                     Db_worker_effect.pure
                       (Sync_util.clear_last_sync_error client)))
               (fun error ->
                  Db_worker_effect.pure
                    (Sync_util.set_last_sync_error client error)))
end

let handle_changed repo (client : Sync_state.client) (local_tx : int option)
    (remote_tx : Wire.t) =
  require_non_negative remote_tx (context ~repo ~typ:"changed" ());
  broadcast_rtc_state client;
  let remote_tx_n = Option.value (wire_to_int remote_tx) ~default:0 in
  match local_tx with
  | Some l when l < remote_tx_n -> request_pull client l
  | _ -> ()

let handle_message repo (client : Sync_state.client) (raw : string) : unit =
  let message =
    match Sync_transport.parse_message raw with
    | Some m -> Sync_transport.coerce_ws_server_message m
    | None -> None
  in
  match message with
  | Some (Wire.Map _ as message) -> (
      let local_tx = Sync_client_op.get_local_tx repo in
      let remote_tx = Option.value (Wire.get "t" message) ~default:Wire.Nil in
      let remote_checksum = Wire.get "checksum" message in
      validate_local_tx repo message local_tx;
      ignore (update_latest_remote_state repo message);
      match Wire.get "type" message with
      | Some (Wire.String "hello") ->
          handle_hello repo client local_tx remote_tx remote_checksum
      | Some (Wire.String "online-users") ->
          handle_online_users repo client message
      | Some (Wire.String "presence") -> handle_presence client message
      | Some (Wire.String "tx/batch/ok") ->
          handle_tx_batch_ok repo client remote_tx remote_checksum
      | Some (Wire.String "pull/ok") ->
          handle_pull_ok repo client local_tx remote_tx remote_checksum message
      | Some (Wire.String "changed") ->
          handle_changed repo client local_tx remote_tx
      | Some (Wire.String "tx/reject") ->
          handle_tx_reject repo client message local_tx
      | Some (Wire.String "pong") -> ()
      | Some (Wire.String typ) ->
          fail_fast "db-sync/invalid-field"
            (context ~repo ~typ ())
      | _ -> fail_fast "db-sync/invalid-field" (context ~repo ~typ:"" ()))
  | _ -> fail_fast "db-sync/response-parse-failed"
           (context ~repo ~typ:"" ~field:"raw" ())
