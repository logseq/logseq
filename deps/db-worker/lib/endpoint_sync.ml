(* :thread-api/db-sync-* endpoints — port of
   frontend.worker.handler.sync plus the db-core sync endpoints in our
   call graph (import state machine, invalidate-search-db,
   rehydrate-large-titles). db-sync-close-db is already registered by
   endpoint_lifecycle; grant-graph-access / ensure-user-rsa-keys belong
   to the crypt package and are intentionally not registered here.

   init () wiring needed in worker_core:
     Endpoint_sync — this module's top-level `let () = ...` blocks
     self-register on module load, so just force the module
     (worker_core does `ignore Endpoint_sync.pure_nil`).

   db-sync-invalidate-search-db is registered by endpoint_search.ml —
   not duplicated here; the download path reaches the same truncation via
   Sync_deps.invalidate_search_db (populated by the search package).
*)

open Db_worker_effect.Infix

let kw s = Wire.Keyword s

let pure_nil = Db_worker_effect.pure Wire.Nil

let arg args i =
  match List.nth_opt args i with
  | Some v -> v
  | None -> Wire.Nil

let arg_str args i =
  match arg args i with
  | Wire.String s | Wire.Uuid s -> s
  | _ -> ""

let arg_bool args i default =
  match arg args i with
  | Wire.Bool b -> b
  | _ -> default

let arg_int_opt args i =
  match arg args i with
  | Wire.Int n -> Some n
  | Wire.Int64 n -> Some (Int64.to_int n)
  | _ -> None

(* ---- config ---- *)

let () =
  Dispatcher.register "thread-api/set-db-sync-config" (fun args ->
       Worker_state.set_db_sync_config
         (Sync_state.non_auth_db_sync_config (arg args 0));
       pure_nil)

let () =
  Dispatcher.register "thread-api/get-db-sync-config" (fun _ ->
       Db_worker_effect.pure
         (Sync_state.non_auth_db_sync_config (Worker_state.db_sync_config ())))

(* ---- status / lifecycle ---- *)

let () =
  Dispatcher.register "thread-api/db-sync-status" (fun args ->
       Db_worker_effect.pure
         (Option.value (Sync_client.status (arg_str args 0))
            ~default:Wire.Nil))

let () =
  Dispatcher.register "thread-api/db-sync-stop" (fun _ ->
       Sync_client.stop () >>= fun () -> pure_nil)

let () =
  Dispatcher.register "thread-api/db-sync-update-presence" (fun args ->
       Sync_client.update_presence (arg_str args 0);
       pure_nil)

(* ---- assets ---- *)

let () =
  Dispatcher.register "thread-api/db-sync-request-asset-download"
    (fun args ->
       Sync_client.request_asset_download (arg_str args 0)
         (arg_str args 1);
       pure_nil)

let () =
  Dispatcher.register "thread-api/db-sync-download-missing-assets"
    (fun args ->
       Sync_client.download_missing_assets (arg_str args 0) (arg_str args 1))

let () =
  Dispatcher.register "thread-api/db-sync-retry-asset-upload" (fun args ->
       Sync_client.retry_asset_upload (arg_str args 0)
       >>= fun () -> pure_nil)

(* ---- remote graph management ---- *)

let () =
  Dispatcher.register "thread-api/db-sync-list-remote-graphs" (fun _ ->
       Sync_client.list_remote_graphs ()
       >>= fun graphs -> Db_worker_effect.pure (Wire.Array graphs))

let () =
  Dispatcher.register "thread-api/db-sync-upload-graph" (fun args ->
       Sync_client.upload_graph (arg_str args 0))

let () =
  Dispatcher.register "thread-api/db-sync-create-remote-graph" (fun args ->
       Sync_client.create_remote_graph (arg_str args 0)
         ~graph_e2ee:(arg_bool args 1 false)
         ~graph_ready_for_use:(arg_bool args 2 true))

let () =
  Dispatcher.register "thread-api/db-sync-stop-upload" (fun args ->
       ignore (Sync_client.stop_upload (arg_str args 0));
       pure_nil)

let () =
  Dispatcher.register "thread-api/db-sync-resume-upload" (fun args ->
       ignore (Sync_client.resume_upload (arg_str args 0));
       pure_nil)

let () =
  Dispatcher.register "thread-api/db-sync-upload-stopped?" (fun args ->
       Db_worker_effect.pure
         (Wire.Bool (Sync_client.upload_stopped (arg_str args 0))))

(* ---- conflicts ---- *)

let conflict_wire_of (c : Sync_client_op.sync_conflict) : Wire.t =
  Wire.Map
    [ kw "id", Wire.Int c.id
    ; kw "block-uuid", Wire.Uuid c.block_uuid
    ; kw "attr", Wire.Keyword c.attr
    ; kw "value", Wire.String c.value
    ; ( kw "remote-t"
      , match c.remote_t with Some t -> Wire.Int t | None -> Wire.Nil )
    ; kw "created-at", Wire.Int c.created_at ]

let () =
  Dispatcher.register "thread-api/db-sync-get-all-block-conflicts"
    (fun args ->
       let repo = arg_str args 0 in
       let grouped =
         List.fold_left
           (fun acc (c : Sync_client_op.sync_conflict) ->
              match List.assoc_opt c.block_uuid acc with
              | Some _ ->
                  List.map
                    (fun (k, v) ->
                       if k = c.block_uuid then (k, v @ [ c ]) else (k, v))
                    acc
              | None -> acc @ [ (c.block_uuid, [ c ]) ])
           []
           (Sync_client_op.get_all_sync_conflicts repo)
       in
       List.iter
         (fun (block_uuid, _) ->
            if not (Sync_state.uuid_string block_uuid) then
              raise
                (Sync_util.ex_info "Expected sync conflict block UUID"
                   [ kw "repo", Wire.String repo
                   ; kw "block-uuid", Wire.String block_uuid ]))
         grouped;
       Db_worker_effect.pure
         (Wire.Map
            (List.map
               (fun (block_uuid, conflicts) ->
                  ( Wire.String block_uuid
                  , Wire.Array (List.map conflict_wire_of conflicts) ))
               grouped)))

let () =
  Dispatcher.register "thread-api/db-sync-clear-block-conflicts"
    (fun args ->
       let repo = arg_str args 0 in
       let block_uuid = arg_str args 1 in
       ignore (Sync_client_op.clear_sync_conflicts repo block_uuid);
       Broadcast.to_clients ~kind:"sync-conflicts-updated"
         ~transit_payload:
           (Transit_codec.to_string
              (Wire.Array
                 [ kw "sync-conflicts-updated"
                 ; Wire.Map
                     [ kw "repo", Wire.String repo
                     ; kw "block-uuid", Wire.Uuid block_uuid
                     ; kw "conflicts", Wire.Array [] ] ]));
       pure_nil)

(* ---- download ---- *)

let () =
  Dispatcher.register "thread-api/db-sync-download-graph-by-id"
    (fun args ->
       Sync_download.download_graph_by_id (arg_str args 0)
         (arg_str args 1) (arg_bool args 2 false))

(* ---- import state machine (from worker.db-core) ---- *)

let () =
  Dispatcher.register "thread-api/db-sync-import-prepare" (fun args ->
       Sync_download.prepare_import (arg_str args 0)
         (arg_bool args 1 false) (arg_str args 2)
         (Some (arg_bool args 3 true))
         ?total_datoms:(arg_int_opt args 4) ())

let row_of_wire (w : Wire.t) : (int * string * string option) =
  match w with
  | Wire.Array [ Wire.Int addr; Wire.String content ]
  | Wire.List [ Wire.Int addr; Wire.String content ] ->
      (addr, content, None)
  | Wire.Array [ Wire.Int addr; Wire.String content; Wire.String addresses ]
  | Wire.List [ Wire.Int addr; Wire.String content; Wire.String addresses ]
    ->
      (addr, content, Some addresses)
  | _ -> Sync_util.fail_fast "db-sync/invalid-import-row" w

let () =
  Dispatcher.register "thread-api/db-sync-import-rows-chunk" (fun args ->
       let rows =
         match arg args 0 with
         | Wire.Array xs | Wire.List xs -> List.map row_of_wire xs
         | _ -> []
       in
       Sync_download.import_rows_chunk rows (arg_str args 1)
         (arg_str args 2)
       >>= fun ok -> Db_worker_effect.pure (Wire.Bool ok))

let () =
  Dispatcher.register "thread-api/db-sync-import-finalize" (fun args ->
       Sync_download.finalize_import (arg_str args 0) (arg_str args 1)
         (match arg args 2 with
          | Wire.Int n -> n
          | Wire.Int64 n -> Int64.to_int n
          | _ -> 0)
         (arg_str args 3)
       >>= fun () -> pure_nil)

(* ---- misc db-core sync endpoints ---- *)

(* :thread-api/db-sync-start [repo] — db_core.cljs
   (def-thread-api :thread-api/db-sync-start [repo]
     (p/let [_ (start-db! repo {:close-other-db? false})] nil)).
   start-db! delegates to <create-or-open-db!; the cljs *master-client?
   guard has no worker-side counterpart here (no master-client concept),
   so this opens the db when not already open, same as create-or-open-db
   with :close-other-db? false. *)
let () =
  Dispatcher.register "thread-api/db-sync-start" (fun args ->
      (match arg args 0 with
       | Wire.String repo ->
           Endpoint_lifecycle.create_or_open_db
             [ Wire.String repo
             ; Wire.Map [ (kw "close-other-db?", Wire.Bool false) ] ]
           >>= fun _ -> pure_nil
       | _ ->
           raise
             (Dispatcher.Exn_info
                ( "db-sync-start: missing repo arg", [] ))))

let () =
  Dispatcher.register "thread-api/db-sync-rehydrate-large-titles"
    (fun args ->
       Sync_client.rehydrate_large_titles_from_db (arg_str args 0)
         (arg_str args 1)
       >>= fun () -> pure_nil)
