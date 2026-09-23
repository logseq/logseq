(* Port of the validate endpoints in frontend.worker.handler.export
   (src/main/frontend/worker/handler/export.cljs).

   Endpoints registered at module load:
     thread-api/validate-db
     thread-api/recompute-checksum-diagnostics
   init () wiring: Worker_core.init touches
     Endpoint_validate.validate_db_endpoint
     Endpoint_validate.recompute_checksum_diagnostics *)

let kw s = Wire.Keyword s

let arg args i = List.nth_opt args i

let repo_of args =
  match arg args 0 with
  | Some (Wire.String s) -> s
  | Some Wire.Nil | None -> ""
  | _ -> invalid_arg "first arg must be repo name"

(* :thread-api/validate-db [repo & [opts]] *)
let validate_db_endpoint args =
  let repo = repo_of args in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.Nil
  | Some conn ->
      let fix =
        match arg args 1 with
        | Some (Wire.Map kvs) ->
            (match List.assoc_opt (kw "fix") kvs with
             | Some (Wire.Bool b) -> b
             | _ -> true)
        | _ -> true
      in
      Db_worker_effect.pure (Worker_db_validate.validate_db ~fix conn)

let () = Dispatcher.register "thread-api/validate-db" validate_db_endpoint

(* cljs checksum-diagnostics helper *)
let checksum_diagnostics repo =
  let local =
    match Sync_client_op.get_local_checksum repo with
    | Some s -> Wire.String s
    | None -> Wire.Nil
  in
  let remote =
    match Hashtbl.find_opt Sync_state.latest_remote_checksums repo with
    | Some s -> Wire.String s
    | None -> Wire.Nil
  in
  (local, remote)

(* :thread-api/recompute-checksum-diagnostics [repo] *)
let recompute_checksum_diagnostics args =
  let repo = repo_of args in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.Nil
  | Some conn ->
      let local, remote = checksum_diagnostics repo in
      let result =
        Worker_db_validate.recompute_checksum_diagnostics repo conn
          (Ds_wire.value_of_transit local)
          (Ds_wire.value_of_transit remote)
      in
      let recomputed =
        match result with
        | Wire.Map kvs -> List.assoc_opt (kw "recomputed-checksum") kvs
        | _ -> None
      in
      (match recomputed with
       | Some (Wire.String checksum) ->
           (match Sync_state.client_ops_conn_opt repo with
            | Some _client_ops_conn ->
                Sync_client_op.update_local_checksum repo checksum
            | None -> ())
       | _ -> ());
      let result =
        match recomputed with
        | Some (Wire.String _) ->
            (match result with
             | Wire.Map kvs ->
                 Wire.Map
                   (List.map
                      (fun (k, v) ->
                        if k = kw "local-checksum" then
                          (k, Option.get recomputed)
                        else (k, v))
                      kvs)
             | _ -> result)
        | _ -> result
      in
      Db_worker_effect.pure result

let () =
  Dispatcher.register "thread-api/recompute-checksum-diagnostics"
    recompute_checksum_diagnostics
