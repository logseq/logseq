(* Tests for the ported sync layer, mirroring:

   - src/test/frontend/worker/sync/util_test.cljs (all 3 tests)
   - src/test/frontend/worker/sync/client_op_test.cljs (sqlite meta
     roundtrip, asset-op coalescing, cleanup-finished-history-ops both
     cases; the gc-kvs-table test is cljs-specific — sqlite-gc is a
     different package and has no OCaml port under this group)
   - src/test/frontend/worker/sync/upload_test.cljs (split-snapshot-rows
     both cases, upload-snapshot-rows-batches flags, drop-oversized,
     create-remote-graph cases; cljs rebinds fetch-json /
     list-remote-graphs / preflight hooks — the port drives the same code
     through Sync_deps.fetch_json + the Sync_deps crypt hooks, and runs
     the real create-remote-graph-aux http body)
   - src/test/frontend/worker/sync/download_test.cljs (stale gzip header
     via stream_snapshot_row_batches, e2ee preflight ordering, failure log
     emission; the cljs stream test mocks Response streaming — the port
     drives stream_snapshot_row_batches directly, and js/fetch through
     Sync_deps.http_send_stream)
   - src/test/frontend/worker/sync/assets_test.cljs (request-asset-download
     local-file checks, download-missing-remote-assets candidate
     filtering, upload-remote-asset payload serialization and missing-
     local-file recording; the download/upload-mock tests exercise real
     Asset_store + the real download path — failures propagate like
     cljs. download-remote-assets-if-missing-bounds-download-concurrency-
     test is dropped: p/delay yields to the JS event loop while the
     native Db_worker_effect sleep blocks, so the 10-worker interleave
     is not observable natively)

   src/test/frontend/worker/sync/restart_test.cljs is NOT ported: it
   monkey-patches js/setInterval, js/setTimeout and the platform
   websocket constructor, none of which exist behind the spec/platform
   boundary. The OCaml Web_socket/Timers spec modules have no injectable
   driver, so the reconnect/stale-ws branches they exercise are
   unverifiable natively without changing production code for tests. *)

open Datascript
open Db_worker_effect.Infix

let failures = ref 0

let check name cond =
  if cond then Printf.printf "ok - %s\n" name
  else begin
    incr failures;
    Printf.printf "FAIL - %s\n%!" name
  end

let await task =
  let result = ref None in
  Db_worker_effect.on_any task (fun v -> result := Some (Ok v)) (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok v) -> v
  | Some (Error e) -> raise e
  | None -> failwith "task still pending"

let await_error task =
  let result = ref None in
  Db_worker_effect.on_any task (fun v -> result := Some (Ok v)) (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok _) -> failwith "expected error, got success"
  | Some (Error e) -> e
  | None -> failwith "task still pending"

let kw s = Wire.Keyword s

let wire_get name w = Wire.get name w

let uuid_s = ref 0

let fresh_uuid () =
  incr uuid_s;
  Printf.sprintf "11111111-2222-3333-4444-%012d" !uuid_s

let tmp_dir =
  let d = Filename.temp_dir "logseq-sync-test" "" in
  Unix.putenv "LOGSEQ_WORKER_DB_DIR" d;
  d

let with_client_ops_db repo f =
  let path =
    Filename.concat tmp_dir (Printf.sprintf "test-client-ops-%s.sqlite" repo)
  in
  let db = Sqlite.open_db ~path in
  let prev = Hashtbl.find_opt Sync_state.client_ops_conns repo in
  Hashtbl.replace Sync_state.client_ops_conns repo db;
  Fun.protect
    (fun () -> f db)
    ~finally:(fun () ->
      Sqlite.close db;
      match prev with
      | Some d -> Hashtbl.replace Sync_state.client_ops_conns repo d
      | None -> Hashtbl.remove Sync_state.client_ops_conns repo)

let sqlite_count db sql params =
  match Sqlite.query db ~sql ~bind:(Array.of_list params) with
  | r :: _ ->
      (match r.(0) with
       | Sqlite.Integer n -> Int64.to_int n
       | _ -> 0)
  | [] -> 0

let set_sync_config http_base =
  Worker_state.set_db_sync_config
    (Wire.Map [ kw "http-base", Wire.String http_base ])

let set_auth_token () =
  Worker_state.merge_state
    (Wire.Map [ kw "auth/id-token", Wire.String "test-token" ])

let clear_sync_hooks () =
  Sync_deps.fetch_json := None;
  Sync_deps.http_send_stream := None;
  Sync_deps.preflight_upload_e2ee := None;
  Sync_deps.ensure_user_rsa_keys := None;
  Sync_deps.fetch_graph_aes_key_for_download := None

let frame_bytes data =
  let len = String.length data in
  let out = Bytes.create (4 + len) in
  Bytes.set out 0 (Char.chr ((len lsr 24) land 0xff));
  Bytes.set out 1 (Char.chr ((len lsr 16) land 0xff));
  Bytes.set out 2 (Char.chr ((len lsr 8) land 0xff));
  Bytes.set out 3 (Char.chr (len land 0xff));
  Bytes.blit_string data 0 out 4 len;
  Bytes.unsafe_to_string out

let asset_schema_edn =
  "{:db/ident {:db/unique :db.unique/identity}
    :block/uuid {:db/unique :db.unique/identity}
    :block/title {}
    :block/tx-id {}
    :logseq.property.asset/type {}
    :logseq.property.asset/checksum {}
    :logseq.property.asset/size {}
    :logseq.property.asset/remote-metadata {:db/valueType :db.type/ref :db/isComponent true}}"

let asset_conn asset_uuid =
  let schema = Datascript.schema_of_edn_string asset_schema_edn in
  let conn = Datascript.create_conn ~schema () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\"
             :logseq.property.asset/type \"png\"
             :logseq.property.asset/checksum \"sha-256-value\"
             :logseq.property.asset/remote-metadata {:checksum \"sha-256-value\" :type \"png\"}}]"
          asset_uuid));
  conn

(* ---- util_test.cljs ---- *)

let () =
  let body =
    Wire.Map [ kw "t-before", Wire.Int 0; kw "txs", Wire.Array [] ]
  in
  match Sync_util.coerce_http_request "sync/tx-batch" body with
  | Some w ->
      check "coerce-http-request adds client-revision to tx-batch"
        (wire_get "client-revision" w
         = Some (Wire.String (Sync_util.build_revision ())))
  | None -> check "coerce-http-request adds client-revision to tx-batch" false

let () =
  let body = Wire.Map [ kw "graph-name", Wire.String "Demo" ] in
  match Sync_util.coerce_http_request "graphs/create" body with
  | Some w ->
      check "coerce-http-request does not add client-revision elsewhere"
        (wire_get "graph-name" w = Some (Wire.String "Demo")
         && wire_get "client-revision" w = None)
  | None -> check "coerce-http-request does not add client-revision elsewhere" false

let () =
  let body =
    Wire.Map
      [ kw "t-before", Wire.Int 0; kw "txs", Wire.Array []
      ; kw "client-revision", Wire.String "explicit-revision" ]
  in
  match Sync_util.coerce_http_request "sync/tx-batch" body with
  | Some w ->
      check "coerce-http-request preserves explicit client-revision"
        (wire_get "client-revision" w = Some (Wire.String "explicit-revision"))
  | None -> check "coerce-http-request preserves explicit client-revision" false

(* ---- client_op_test.cljs ---- *)

let () =
  let repo = "repo-1" in
  with_client_ops_db repo (fun _db ->
      Sync_client_op.update_graph_uuid repo (Some "graph-1");
      Sync_client_op.update_local_tx repo 9;
      Sync_client_op.update_local_checksum repo "checksum-1" 9;
      Sync_client_op.update_graph_uuid repo (Some "graph-2");
      Sync_client_op.update_local_tx repo 12;
      Sync_client_op.update_local_checksum repo "checksum-2" 12;
      check "sqlite sync-meta roundtrip"
        (Sync_client_op.get_graph_uuid repo = Some "graph-2"
         && Sync_client_op.get_local_tx repo = Some 12
         && Sync_client_op.get_local_checksum repo = Some "checksum-2"
         && Sync_client_op.get_local_checksum_covered_tx repo = Some 12))

(* cljs checksum-covered-tx-roundtrip-test *)
let () =
  let repo = "repo-checksum-covered-tx" in
  with_client_ops_db repo (fun _db ->
      check "no covered tx"
        (Sync_client_op.get_local_checksum_covered_tx repo = None);
      Sync_client_op.update_local_checksum repo "checksum-1" 41;
      check "covered tx roundtrip"
        (Sync_client_op.get_local_checksum repo = Some "checksum-1"
         && Sync_client_op.get_local_checksum_covered_tx repo = Some 41))

let () =
  let repo = "repo-asset" in
  let asset_uuid = fresh_uuid () in
  let op op_type t =
    Wire.Array
      [ kw op_type; Wire.Int t
      ; Wire.Map [ kw "block-uuid", Wire.Uuid asset_uuid ] ]
  in
  with_client_ops_db repo (fun _db ->
      Sync_client_op.add_asset_ops repo [ op "update-asset" 10 ];
      check "asset ops: one unpushed"
        (Sync_client_op.get_unpushed_asset_ops_count repo = 1);
      let ops = Sync_client_op.get_all_asset_ops repo in
      (match ops with
       | [ m ] ->
           check "asset ops: update-asset stored"
             (wire_get "update-asset" m = Some (op "update-asset" 10))
       | _ -> check "asset ops: update-asset stored" false);
      Sync_client_op.add_asset_ops repo [ op "remove-asset" 9 ];
      let ops = Sync_client_op.get_all_asset_ops repo in
      check "asset ops: older remove ignored"
        (match ops with
         | [ m ] ->
             wire_get "update-asset" m = Some (op "update-asset" 10)
             && wire_get "remove-asset" m = None
         | _ -> false);
      Sync_client_op.add_asset_ops repo [ op "remove-asset" 11 ];
      let ops = Sync_client_op.get_all_asset_ops repo in
      check "asset ops: newer remove replaces update"
        (match ops with
         | [ m ] ->
             wire_get "remove-asset" m = Some (op "remove-asset" 11)
             && wire_get "update-asset" m = None
         | _ -> false);
      Sync_client_op.remove_asset_op repo asset_uuid;
      check "asset ops: remove clears"
        (Sync_client_op.get_unpushed_asset_ops_count repo = 0))

let () =
  let repo = "repo-cleanup" in
  let keep_tx_id = fresh_uuid () in
  let remove_tx_id = fresh_uuid () in
  let pending_tx_id = fresh_uuid () in
  let upsert ~tx_id ~created_at ~pending =
    ignore
      (Sync_client_op.upsert_local_tx_entry repo ~tx_id ~created_at ~pending
         ~outliner_op:None ~undo_redo:None ~forward_outliner_ops:[]
         ~inverse_outliner_ops:[] ~inferred_outliner_ops:false
         ~normalized_tx_data:(Wire.Array [])
         ~reversed_tx_data:(Wire.Array []) ())
  in
  with_client_ops_db repo (fun db ->
      Sync_client_op.update_local_tx repo 99;
      upsert ~tx_id:keep_tx_id ~created_at:1L ~pending:false;
      upsert ~tx_id:remove_tx_id ~created_at:2L ~pending:false;
      upsert ~tx_id:pending_tx_id ~created_at:3L ~pending:true;
      check "cleanup removes one finished tx"
        (Sync_client_op.cleanup_finished_history_ops repo [ keep_tx_id ] = 1);
      let count_tx tx_id =
        sqlite_count db "select count(*) as c from client_ops where tx_id = ?"
          [ Sqlite.Text tx_id ]
      in
      check "cleanup keeps protected tx" (count_tx keep_tx_id = 1);
      check "cleanup removes unprotected finished tx" (count_tx remove_tx_id = 0);
      check "cleanup keeps pending tx" (count_tx pending_tx_id = 1);
      check "cleanup keeps local-tx" (Sync_client_op.get_local_tx repo = Some 99))

let () =
  let repo = "repo-no-conn" in
  Hashtbl.remove Sync_state.client_ops_conns repo;
  check "cleanup without client-ops conn is a noop"
    (Sync_client_op.cleanup_finished_history_ops repo [] = 0)

(* ---- upload_test.cljs ---- *)

let () =
  let row i = Wire.Array [ Wire.String (Printf.sprintf "%04d" i) ] in
  let rows = List.init 4 row in
  let size = Sync_upload.snapshot_rows_byte_length [ List.hd rows ] in
  let batches =
    Sync_upload.split_snapshot_rows_by_max_bytes rows (size * 2)
  in
  check "split-snapshot-rows splits into byte-capped batches"
    (match batches with
     | [ b1; b2 ] -> List.length b1 = 2 && List.length b2 = 2
     | _ -> false)

let () =
  let ok_row = Wire.Array [ Wire.Int 0 ] in
  let big_row = Wire.Array [ Wire.String (String.make 4096 'x') ] in
  let rows = [ ok_row; big_row ] in
  let max_bytes = Sync_upload.snapshot_rows_byte_length [ ok_row ] in
  (match
     try
       ignore (Sync_upload.split_snapshot_rows_by_max_bytes rows max_bytes);
       `No_error
     with
     | Dispatcher.Exn_info (msg, kvs) -> `Exn_info (msg, kvs)
     | _ -> `Other
   with
   | `Exn_info (msg, kvs) ->
       check "split-snapshot-rows fails fast on oversized row"
         (msg = "snapshot-row-too-large"
          && Wire.get "max-bytes" (Wire.Map kvs) = Some (Wire.Int max_bytes)
          && (match Wire.get "row-size" (Wire.Map kvs) with
              | Some (Wire.Int s) -> s > max_bytes
              | _ -> false)
          && Wire.get "addr" (Wire.Map kvs)
             = Some (Wire.String (String.make 4096 'x')))
   | _ -> check "split-snapshot-rows fails fast on oversized row" false)

let () =
  let calls = ref [] in
  let auth_fetch url headers _body =
    calls := (url, headers) :: !calls;
    Db_worker_effect.pure ()
  in
  let rows n = [ Wire.Array [ Wire.Int n; Wire.String "a"; Wire.Nil ] ] in
  await
    (Sync_upload.upload_snapshot_rows_batches [ rows 1; rows 2; rows 3 ]
       ~base:"https://sync.example.test" ~graph_id:"graph-1"
       ~first_batch:true ~finished:true ~checksum:"abc+123=" ~auth_fetch);
  let urls = List.rev_map fst !calls in
  let contains s needle =
    let hl = String.length s and nl = String.length needle in
    let rec go i =
      if i + nl > hl then false
      else if String.sub s i nl = needle then true
      else go (i + 1)
    in
    go 0
  in
  check "upload-snapshot-rows-batches sends 3 requests"
    (List.length urls = 3);
  (match urls with
   | [ u1; u2; u3 ] ->
       check "upload flags: first resets, last finishes, checksum encoded"
         (contains u1 "reset=true" && contains u1 "finished=false"
          && contains u2 "reset=false" && contains u2 "finished=false"
          && contains u3 "reset=false" && contains u3 "finished=true"
          && contains u3 "checksum=abc%2B123%3D")
   | _ -> check "upload flags: first resets, last finishes, checksum encoded" false)

let () =
  let d e v : Datascript.datom =
    { e; a = "logseq.property.tldraw/page"; v; tx = 0; added = true }
  in
  let small = String "ok" in
  let big = String (String.make 1_000_001 'x') in
  let datoms = [ d 1 small; d 2 small; d 3 big ] in
  let kept, dropped = Sync_upload.drop_oversized_upload_datoms datoms in
  check "drop-oversized keeps small datoms"
    (List.map (fun (x : Datascript.datom) -> x.e) kept = [ 1; 2 ]);
  check "drop-oversized drops large tldraw page value"
    (match dropped with
     | [ (a, e, size) ] ->
         a = "logseq.property.tldraw/page" && e = 3
         && size
            > Sync_upload.snapshot_upload_max_bytes
              - Sync_upload.snapshot_frame_header_bytes
     | _ -> false)

let () =
  let calls = ref [] in
  let fetch url ?(meth = "GET") ?(headers = []) ?body:_ ?response_schema:_
      ?error_schema:_ () : Wire.t Db_worker_effect.t =
    ignore headers;
    if meth = "GET" then begin
      calls := "list-remote-graphs" :: !calls;
      Db_worker_effect.pure
        (Wire.Map [ kw "graphs", Wire.Array [] ])
    end
    else begin
      calls := "create-remote-graph" :: !calls;
      Db_worker_effect.pure
        (Wire.Map
           [ kw "graph-id", Wire.String "new-graph-id"
           ; kw "graph-e2ee?", Wire.Bool true ])
    end
  in
  Sync_deps.fetch_json := Some fetch;
  Sync_deps.preflight_upload_e2ee :=
    Some
      (fun _repo graph_e2ee ->
         calls := Printf.sprintf "preflight:%b" graph_e2ee :: !calls;
         Db_worker_effect.pure ());
  Sync_deps.ensure_user_rsa_keys :=
    Some
      (fun _opts ->
         calls := "ensure-rsa" :: !calls;
         Db_worker_effect.pure Wire.Nil);
  Fun.protect
    (fun () ->
      set_sync_config "https://sync.example.test";
      set_auth_token ();
      let result =
        await
          (Sync_upload.create_remote_graph "repo-1" ~graph_e2ee:true
             ~graph_ready_for_use:true)
      in
      check "create-remote-graph returns new graph"
        (wire_get "graph-id" result = Some (Wire.String "new-graph-id")
         && wire_get "graph-e2ee?" result = Some (Wire.Bool true));
      check "create-remote-graph call order (e2ee)"
        (List.rev !calls
         = [ "list-remote-graphs"; "preflight:true"; "ensure-rsa"
           ; "create-remote-graph" ]))
    ~finally:clear_sync_hooks

let () =
  let calls = ref [] in
  let fetch url ?(meth = "GET") ?(headers = []) ?body:_ ?response_schema:_
      ?error_schema:_ () : Wire.t Db_worker_effect.t =
    ignore (url, headers);
    if meth = "GET" then begin
      calls := "list-remote-graphs" :: !calls;
      Db_worker_effect.pure
        (Wire.Map [ kw "graphs", Wire.Array [] ])
    end
    else begin
      calls := "create-remote-graph" :: !calls;
      Db_worker_effect.pure
        (Wire.Map
           [ kw "graph-id", Wire.String "new-graph-id"
           ; kw "graph-e2ee?", Wire.Bool false ])
    end
  in
  Sync_deps.fetch_json := Some fetch;
  Sync_deps.preflight_upload_e2ee :=
    Some
      (fun _repo graph_e2ee ->
         calls := Printf.sprintf "preflight:%b" graph_e2ee :: !calls;
         Db_worker_effect.pure ());
  Sync_deps.ensure_user_rsa_keys :=
    Some
      (fun _opts ->
         calls := "ensure-rsa" :: !calls;
         Db_worker_effect.pure Wire.Nil);
  Fun.protect
    (fun () ->
      set_sync_config "https://sync.example.test";
      set_auth_token ();
      ignore
        (await
           (Sync_upload.create_remote_graph "repo-2" ~graph_e2ee:false
              ~graph_ready_for_use:true));
      check "non-e2ee create skips ensure-rsa"
        (List.rev !calls
         = [ "list-remote-graphs"; "preflight:false"; "create-remote-graph" ]))
    ~finally:clear_sync_hooks

let () =
  let calls = ref [] in
  let fetch url ?(meth = "GET") ?(headers = []) ?body:_ ?response_schema:_
      ?error_schema:_ () : Wire.t Db_worker_effect.t =
    ignore (url, headers);
    if meth = "GET" then begin
      calls := "list-remote-graphs" :: !calls;
      Db_worker_effect.pure
        (Wire.Map
           [ kw "graphs"
           , Wire.Array
               [ Wire.Map
                   [ kw "graph-id", Wire.String "gid-1"
                   ; kw "graph-name", Wire.String "repo-1" ] ] ])
    end
    else begin
      calls := "create-remote-graph" :: !calls;
      Db_worker_effect.pure Wire.Nil
    end
  in
  Sync_deps.fetch_json := Some fetch;
  Fun.protect
    (fun () ->
      set_sync_config "https://sync.example.test";
      set_auth_token ();
      (match
         try
           ignore
             (await
                (Sync_upload.create_remote_graph "repo-1" ~graph_e2ee:true
                   ~graph_ready_for_use:true));
           `No_error
         with
         | Dispatcher.Exn_info (msg, kvs) -> `Exn_info (msg, kvs)
         | e -> `Other e
       with
       | `Exn_info (msg, kvs) ->
           check "create-remote-graph rejects matching remote graph"
             (msg = "remote graph already exists; delete it before uploading again"
              && Wire.get "code" (Wire.Map kvs)
                 = Some (Wire.Keyword "db-sync/graph-already-exists")
              && Wire.get "graph-name" (Wire.Map kvs)
                 = Some (Wire.String "repo-1")
              && List.rev !calls = [ "list-remote-graphs" ])
       | _ -> check "create-remote-graph rejects matching remote graph" false))
    ~finally:clear_sync_hooks

let () =
  let calls = ref [] in
  let fetch url ?(meth = "GET") ?(headers = []) ?body:_ ?response_schema:_
      ?error_schema:_ () : Wire.t Db_worker_effect.t =
    ignore (url, headers);
    if meth = "GET" then begin
      calls := "list-remote-graphs" :: !calls;
      Db_worker_effect.pure
        (Wire.Map [ kw "graphs", Wire.Array [] ])
    end
    else begin
      calls := "create-remote-graph" :: !calls;
      Db_worker_effect.pure Wire.Nil
    end
  in
  Sync_deps.fetch_json := Some fetch;
  Sync_deps.preflight_upload_e2ee :=
    Some
      (fun _repo _e2ee ->
         calls := "preflight" :: !calls;
         Db_worker_effect.error
           (Sync_util.ex_info "missing-e2ee-password"
              [ kw "code", Wire.Keyword "db-sync/missing-e2ee-password" ]));
  Fun.protect
    (fun () ->
      set_sync_config "https://sync.example.test";
      set_auth_token ();
      (match
         try
           ignore
             (await
                (Sync_upload.create_remote_graph "repo-1" ~graph_e2ee:true
                   ~graph_ready_for_use:true));
           `No_error
         with
         | Dispatcher.Exn_info (msg, _kvs) -> `Exn_info msg
         | _ -> `Other
       with
       | `Exn_info msg ->
           check "missing-e2ee-password aborts before create"
             (msg = "missing-e2ee-password"
              && List.rev !calls = [ "list-remote-graphs"; "preflight" ])
       | _ -> check "missing-e2ee-password aborts before create" false))
    ~finally:clear_sync_hooks

(* ---- download_test.cljs ---- *)

let () =
  let rows = [ (1, "row-1", None); (2, "row-2", None) ] in
  let row_wire (addr, content, addresses) =
    Wire.Array
      [ Wire.Int addr; Wire.String content
      ; (match addresses with Some a -> Wire.String a | None -> Wire.Nil) ]
  in
  let payload =
    frame_bytes
      (Db_sync_snapshot.encode_rows
         (Wire.Array (List.map row_wire rows)))
  in
  let sent = ref false in
  let read () =
    if not !sent then begin
      sent := true;
      Db_worker_effect.pure (Some payload)
    end
    else Db_worker_effect.pure None
  in
  let batches = ref [] in
  await
    (Sync_download.stream_snapshot_row_batches read 1000 (fun batch ->
         batches := batch :: !batches;
         Db_worker_effect.pure ()));
  check "stream-snapshot-row-batches ignores stale gzip header"
    (List.rev !batches = [ rows ])

let () =
  let calls = ref [] in
  let fetch url ?(meth = "GET") ?(headers = []) ?body:_ ?response_schema
      ?error_schema:_ () : Wire.t Db_worker_effect.t =
    ignore (url, meth, headers);
    match response_schema with
    | Some "sync/pull" ->
        Db_worker_effect.pure (Wire.Map [ kw "t", Wire.Int 42 ])
    | Some "sync/snapshot-download" ->
        Db_worker_effect.pure
          (Wire.Map
             [ kw "url"
             , Wire.String "https://sync.example.test/snapshot" ])
    | _ ->
        Db_worker_effect.error
          (Sync_util.ex_info "unexpected schema" [ kw "schema", Wire.Nil ])
  in
  Sync_deps.fetch_json := Some fetch;
  Sync_deps.fetch_graph_aes_key_for_download :=
    Some
      (fun _repo _graph_id ->
         calls := "e2ee-preflight" :: !calls;
         Db_worker_effect.pure (Wire.String "aes-key"));
  Sync_deps.http_send_stream :=
    Some
      (fun _req on_response ->
         calls := "snapshot-stream" :: !calls;
         on_response 200 [] (fun () -> Db_worker_effect.pure None));
  Fun.protect
    (fun () ->
      set_sync_config "https://sync.example.test";
      set_auth_token ();
      ignore (await (Sync_download.download_graph_by_id "repo" "graph-1" true));
      check "encrypted download preflights e2ee before snapshot stream"
        (List.rev !calls = [ "e2ee-preflight"; "snapshot-stream" ]))
    ~finally:clear_sync_hooks

let () =
  let log_events = ref [] in
  Broadcast.set_post_fn (fun ~kind ~payload ->
      if kind = "rtc-log" then
        match Transit_codec.of_string payload with
        | Wire.Array [ _; m ] | Wire.List [ _; m ] ->
            (match wire_get "sub-type" m with
             | Some (Wire.Keyword s) -> log_events := s :: !log_events
             | _ -> ())
        | _ -> ());
  let fetch url ?(meth = "GET") ?(headers = []) ?body:_ ?response_schema
      ?error_schema:_ () : Wire.t Db_worker_effect.t =
    ignore (url, meth, headers);
    match response_schema with
    | Some "sync/pull" ->
        Db_worker_effect.pure (Wire.Map [ kw "t", Wire.Int 42 ])
    | Some "sync/snapshot-download" ->
        Db_worker_effect.pure
          (Wire.Map
             [ kw "url"
             , Wire.String "https://sync.example.test/snapshot" ])
    | _ ->
        Db_worker_effect.error
          (Sync_util.ex_info "unexpected schema" [ kw "schema", Wire.Nil ])
  in
  Sync_deps.fetch_json := Some fetch;
  Sync_deps.fetch_graph_aes_key_for_download :=
    Some
      (fun _repo _graph_id ->
         Db_worker_effect.error
           (Sync_util.ex_info "decrypt-private-key" []));
  Fun.protect
    (fun () ->
      set_sync_config "https://sync.example.test";
      set_auth_token ();
      let e =
        await_error
          (Sync_download.download_graph_by_id "repo" "graph-1" true)
      in
      let msg =
        match e with Dispatcher.Exn_info (m, _) -> m | _ -> ""
      in
      check "encrypted download failure emits completed log"
        (msg = "db-sync download failed"
         && List.rev !log_events
            = [ "download-progress"; "download-completed" ]))
    ~finally:(fun () ->
      clear_sync_hooks ();
      Broadcast.set_post_fn (fun ~kind:_ ~payload:_ -> ()))

(* ---- assets_test.cljs ---- *)

let () =
  let repo = "asset-download-repo" in
  let graph_id = "graph-1" in
  let asset_uuid = fresh_uuid () in
  let conn = asset_conn asset_uuid in
  Worker_state.set_datascript_conn repo conn;
  let name = asset_uuid ^ ".png" in
  ignore
    (await
       (Asset_store.write_bytes ~repo ~name "png-bytes"));
  let broadcasts = ref 0 in
  let client = Sync_state.new_client repo in
  client.graph_id <- Some graph_id;
  Sync_assets.request_asset_download repo asset_uuid
    ~current_client:(fun _ -> Some client)
    ~enqueue_asset_task:(fun _ task -> await (task ()))
    ~broadcast_rtc_state:(fun _ -> incr broadcasts);
  check "request-asset-download skips existing local asset"
    (!broadcasts = 0)

let () =
  let repo = "asset-download-repo" in
  let graph_id = "graph-1" in
  let asset_uuid = fresh_uuid () in
  let conn = asset_conn asset_uuid in
  Worker_state.set_datascript_conn repo conn;
  let client = Sync_state.new_client repo in
  client.graph_id <- Some graph_id;
  let broadcasts = ref 0 in
  let raised = ref false in
  Sync_assets.request_asset_download repo asset_uuid
    ~current_client:(fun _ -> Some client)
    ~enqueue_asset_task:(fun _ task ->
         (match
            try
              await (task ());
              `Ok
            with _ -> `Failed
          with
          | `Ok -> ()
          | `Failed -> raised := true))
    ~broadcast_rtc_state:(fun _ -> incr broadcasts);
  check "request-asset-download propagates download failure"
    !raised;
  Worker_state.drop_datascript_conn repo

(* cljs request-asset-download-failure-does-not-block-later-downloads-test —
   a 404 on one asset must not stop later queued downloads. Goes through
   Sync_client.request_asset_download so the real db-sync-client and the
   shared Sync_assets.enqueue_asset_task queue are exercised. *)
let () =
  let repo = "asset-download-repo" in
  let graph_id = "graph-1" in
  let missing_uuid = fresh_uuid () in
  let ok_uuid = fresh_uuid () in
  let conn = asset_conn missing_uuid in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\"
             :logseq.property.asset/type \"png\"
             :logseq.property.asset/remote-metadata {:type \"png\"}}]"
          ok_uuid));
  Worker_state.set_datascript_conn repo conn;
  let client = Sync_state.new_client repo in
  client.graph_id <- Some graph_id;
  let download_calls = ref [] in
  let prev_download = !Sync_assets.download_remote_asset_fn in
  Sync_assets.download_remote_asset_fn :=
    (fun _repo _graph_id asset_uuid _asset_type ->
       download_calls := asset_uuid :: !download_calls;
       if asset_uuid = missing_uuid then
         Db_worker_effect.error
           (Sync_util.ex_info "download asset failed"
              [ kw "type", kw "rtc.exception/download-asset-failed"
              ; kw "data", Wire.Map [ kw "status", Wire.Int 404 ] ])
       else Db_worker_effect.pure ());
  Broadcast.set_post_fn (fun ~kind:_ ~payload:_ -> ());
  Fun.protect
    (fun () ->
       with_client_ops_db repo (fun _db ->
          Sync_state.db_sync_client := Some client;
          Sync_client.request_asset_download repo missing_uuid;
          let first_result = await_error !(client.Sync_state.asset_queue) in
          (match first_result with
           | Dispatcher.Exn_info (_msg, kvs) ->
               check "first download rejects with 404"
                 (match Wire.get "data" (Wire.Map kvs) with
                  | Some data ->
                      Wire.get "status" data = Some (Wire.Int 404)
                  | None -> false)
           | _ -> check "first download rejects with 404" false);
          Sync_client.request_asset_download repo ok_uuid;
          ignore (await !(client.Sync_state.asset_queue));
          check "a 404 on one asset must not stop later queued downloads"
            (List.rev !download_calls = [ missing_uuid; ok_uuid ])))
    ~finally:(fun () ->
      Sync_state.db_sync_client := None;
      Sync_assets.download_remote_asset_fn := prev_download;
      Worker_state.drop_datascript_conn repo)

(* ---- assets_test.cljs (remaining deftests) ----

   download-remote-assets-if-missing-bounds-download-concurrency-test is
   dropped: it observes real concurrency via p/delay yielding to the JS
   event loop — the native Db_worker_effect has no scheduler (sleep
   blocks the thread), so the 10-worker interleave is not observable
   natively. The bounded worker-pool logic itself is ported
   (Sync_assets.download_remote_assets_if_missing).

   cljs platform/asset-stat call-list assertions are dropped: on native
   the stat is a real file-exists check (Asset_store.exists) with no
   injectable seam; the download/broadcast assertions cover the same
   observable flow. *)

(* (deftest request-asset-download-downloads-missing-local-asset-test ...) *)
let () =
  let repo = "asset-download-missing-repo" in
  let graph_id = "graph-1" in
  let asset_uuid = fresh_uuid () in
  let conn = asset_conn asset_uuid in
  Worker_state.set_datascript_conn repo conn;
  let client = Sync_state.new_client repo in
  client.graph_id <- Some graph_id;
  let download_calls = ref [] in
  let broadcasts = ref 0 in
  let prev_download = !Sync_assets.download_remote_asset_fn in
  Sync_assets.download_remote_asset_fn :=
    (fun r g u t ->
       download_calls := (r, g, u, t) :: !download_calls;
       Db_worker_effect.pure ());
  Fun.protect
    (fun () ->
       Sync_assets.request_asset_download repo asset_uuid
         ~current_client:(fun _ -> Some client)
         ~enqueue_asset_task:(fun _ task -> await (task ()))
         ~broadcast_rtc_state:(fun _ -> incr broadcasts);
       check "request-asset-download downloads missing local asset"
         (!broadcasts = 1
          && !download_calls
             = [ (repo, Some graph_id, asset_uuid, Some "png") ]))
    ~finally:(fun () ->
      Sync_assets.download_remote_asset_fn := prev_download;
      Worker_state.drop_datascript_conn repo)

(* (deftest upload-remote-asset-serializes-resolved-encrypted-payload-test
      ...) — cljs rebinds graph-aes-key (here: graph_e2ee +
      ensure_graph_aes_key Sync_deps hooks), crypt/<encrypt-uint8array
      (Sync_deps.encrypt_bytes), js/fetch (Sync_assets.http_send_fn) and
      broadcast-to-clients! (Broadcast.set_post_fn). *)
let () =
  let repo = "asset-upload-repo" in
  let graph_id = "graph-1" in
  let asset_uuid = fresh_uuid () in
  let checksum = "sha-256-value" in
  let conn = asset_conn asset_uuid in
  Worker_state.set_datascript_conn repo conn;
  set_sync_config "https://sync.example.test";
  set_auth_token ();
  let asset_bytes = "\x01\x02\x03" in
  await
    (Asset_store.write_bytes ~repo ~name:(asset_uuid ^ ".png") asset_bytes);
  let encrypted_payload =
    Wire.Map [ kw "cipher", Wire.String "encrypted-payload" ]
  in
  let expected_body = Transit_codec.to_string encrypted_payload in
  let fetch_call = ref None in
  let encrypt_input = ref None in
  let prev_graph_e2ee = !Sync_deps.graph_e2ee in
  let prev_ensure = !Sync_deps.ensure_graph_aes_key in
  let prev_encrypt = !Sync_deps.encrypt_bytes in
  let prev_http = !Sync_assets.http_send_fn in
  Sync_deps.graph_e2ee := Some (fun _ -> true);
  Sync_deps.ensure_graph_aes_key :=
    Some (fun _ -> Db_worker_effect.pure (Wire.String "aes-key"));
  Sync_deps.encrypt_bytes :=
    Some
      (fun _key payload ->
        encrypt_input := Some payload;
        Db_worker_effect.pure encrypted_payload);
  Sync_assets.http_send_fn :=
    (fun (req : Http.request) ->
      fetch_call := Some req;
      Db_worker_effect.pure { Http.status = 200; headers = []; body = "" });
  Broadcast.set_post_fn (fun ~kind:_ ~payload:_ -> ());
  Fun.protect
    (fun () ->
       await
         (Sync_assets.upload_remote_asset repo (Some graph_id) asset_uuid
            (Some "png") (Some checksum));
       check "upload-remote-asset encrypts the raw bytes"
         (!encrypt_input = Some asset_bytes);
       check "upload-remote-asset sends transit-encoded payload"
         (match !fetch_call with
          | Some req -> req.Http.body = Some expected_body
          | None -> false))
    ~finally:(fun () ->
      Sync_deps.graph_e2ee := prev_graph_e2ee;
      Sync_deps.ensure_graph_aes_key := prev_ensure;
      Sync_deps.encrypt_bytes := prev_encrypt;
      Sync_assets.http_send_fn := prev_http;
      Worker_state.drop_datascript_conn repo;
      Worker_state.set_db_sync_config Wire.Nil)

(* (deftest upload-remote-asset-records-missing-local-file-test ...) —
   cljs rebinds graph-aes-key to nil; the OCaml port resolves aes to
   None when the repo has no datascript conn (graph-e2ee check skipped)
   — same observable nil-aes branch. *)
let () =
  let repo = "asset-upload-missing-repo" in
  let graph_id = "graph-1" in
  let asset_uuid = fresh_uuid () in
  let checksum = "sha-256-value" in
  let missing_file =
    Printf.sprintf "assets/%s.pdf" asset_uuid
  in
  set_sync_config "https://sync.example.test";
  set_auth_token ();
  Sync_assets.clear_missing_asset_upload_files repo;
  let fetch_called = ref false in
  let broadcasts = ref [] in
  let prev_http = !Sync_assets.http_send_fn in
  Sync_assets.http_send_fn :=
    (fun _ ->
      fetch_called := true;
      Db_worker_effect.pure { Http.status = 200; headers = []; body = "" });
  Broadcast.set_post_fn
    (fun ~kind ~payload -> broadcasts := (kind, payload) :: !broadcasts);
  Fun.protect
    (fun () ->
       let exn =
         try
           await
             (Sync_assets.upload_remote_asset repo (Some graph_id) asset_uuid
                (Some "pdf") (Some checksum));
           None
         with e -> Some e
       in
       check "missing local file rejects with read-asset-failed"
         (match exn with
          | Some (Dispatcher.Exn_info (_, kvs)) ->
              Wire.get "type" (Wire.Map kvs)
              = Some (Wire.Keyword "rtc.exception/read-asset-failed")
          | _ -> false);
       check "fetch not called" (not !fetch_called);
       check "no broadcasts" (!broadcasts = []);
       check "missing asset upload file recorded"
         (Sync_assets.get_missing_asset_upload_files repo
          = [ Wire.Map
                [ kw "asset-id", Wire.String asset_uuid
                ; kw "asset-type", Wire.String "pdf"
                ; kw "file", Wire.String missing_file ] ]))
    ~finally:(fun () ->
      Sync_assets.http_send_fn := prev_http;
      Sync_assets.clear_missing_asset_upload_files repo;
      Worker_state.set_db_sync_config Wire.Nil)

(* (deftest download-missing-remote-assets-downloads-only-missing-sync-assets-test
      ...) — needs :block/tags + :db/ident in the schema so the Asset
   class tag query resolves. *)
let tagged_asset_schema_edn =
  "{:db/ident {:db/unique :db.unique/identity}
    :block/uuid {:db/unique :db.unique/identity}
    :block/tags {:db/valueType :db.type/ref
                 :db/cardinality :db.cardinality/many}
    :logseq.property.asset/type {}
    :logseq.property.asset/checksum {}
    :logseq.property.asset/remote-metadata {:db/valueType :db.type/ref
                                            :db/isComponent true}
    :logseq.property.asset/external-url {}}"

let () =
  let repo = "asset-prefetch-repo" in
  let graph_id = "graph-1" in
  let missing_uuid = fresh_uuid () in
  let existing_uuid = fresh_uuid () in
  let local_uuid = fresh_uuid () in
  let external_uuid = fresh_uuid () in
  let schema = Datascript.schema_of_edn_string tagged_asset_schema_edn in
  let conn = Datascript.create_conn ~schema () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/ident :logseq.class/Asset}
            {:block/uuid #uuid \"%s\"
             :block/tags #{:logseq.class/Asset}
             :logseq.property.asset/type \"png\"
             :logseq.property.asset/checksum \"missing-checksum\"
             :logseq.property.asset/remote-metadata {:checksum \"missing-checksum\" :type \"png\"}}
            {:block/uuid #uuid \"%s\"
             :block/tags #{:logseq.class/Asset}
             :logseq.property.asset/type \"pdf\"
             :logseq.property.asset/checksum \"existing-checksum\"
             :logseq.property.asset/remote-metadata {:checksum \"existing-checksum\" :type \"pdf\"}}
            {:block/uuid #uuid \"%s\"
             :block/tags #{:logseq.class/Asset}
             :logseq.property.asset/type \"jpg\"
             :logseq.property.asset/checksum \"local-checksum\"}
            {:block/uuid #uuid \"%s\"
             :block/tags #{:logseq.class/Asset}
             :logseq.property.asset/type \"gif\"
             :logseq.property.asset/checksum \"external-checksum\"
             :logseq.property.asset/remote-metadata {:checksum \"external-checksum\" :type \"gif\"}
             :logseq.property.asset/external-url \"https://example.com/asset.gif\"}]"
          missing_uuid existing_uuid local_uuid external_uuid));
  Worker_state.set_datascript_conn repo conn;
  (* the existing asset is present on disk; the rest are absent *)
  await
    (Asset_store.write_bytes ~repo ~name:(existing_uuid ^ ".pdf") "pdf-bytes");
  let download_calls = ref [] in
  let prev_download = !Sync_assets.download_remote_asset_fn in
  Sync_assets.download_remote_asset_fn :=
    (fun r g u t ->
       download_calls := (r, g, u, t) :: !download_calls;
       Db_worker_effect.pure ());
  Fun.protect
    (fun () ->
       let result =
         await (Sync_assets.download_missing_remote_assets repo graph_id)
       in
       check "download-missing-remote-assets counts"
         (match result with
          | Wire.Map _ ->
              Wire.get "total" result = Some (Wire.Int 2)
              && Wire.get "downloaded" result = Some (Wire.Int 1)
              && Wire.get "skipped-existing" result = Some (Wire.Int 1)
          | _ -> false);
       check "only the missing remote asset downloads"
         (!download_calls
          = [ (repo, Some graph_id, missing_uuid, Some "png") ]))
    ~finally:(fun () ->
      Sync_assets.download_remote_asset_fn := prev_download;
      Worker_state.drop_datascript_conn repo)

(* ---- summary ---- *)

let () =
  if !failures = 0 then Printf.printf "all sync tests passed\n"
  else begin
    Printf.printf "%d sync test(s) FAILED\n" !failures;
    exit 1
  end
