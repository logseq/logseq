(* cljs -> ocaml translation, 1:1:
   src/test/frontend/worker/node_sync_test.cljs (2 deftests).

   Divergences:
   - resolve-ws-token-cli-owner-source-reads-state-token-test: the cljs
     asserts 0 calls to the :thread-api/ensure-id&access-token
     main-thread function. The OCaml resolve_ws_token short-circuits on
     cli_node_owner before any refresh code runs, so the "no refresh"
     property is proven by the state token coming straight back.
   - connect-uses-platform-websocket-adapter-test: cljs rebinds
     platform/websocket-connect and attach-ws-handlers!. The OCaml seam
     is Sync_client.websocket_connect_fn; attach-ws-handlers is a no-op
     in the port (all ws events arrive through connect's on_event
     callback), so the attach-call assertion has no counterpart — the
     connect call receiving the tokened url proves the same wiring.
     The cljs platform-map argument also has no counterpart: the OCaml
     Web_socket spec takes no platform arg. (Web_socket.t is abstract,
     so the stub returns a pending task after recording its url.) *)

let check (name : string) (ok : bool) =
  Alcotest.(check bool) name true ok

let await (t : 'a Db_worker_effect.t) : 'a =
  let result = ref None in
  Db_worker_effect.on_any t
    (fun v -> result := Some (Ok v))
    (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok v) -> v
  | Some (Error e) -> raise e
  | None -> failwith "task still pending"

let kw s = Wire.Keyword s

let () = Worker_core.init ()

let test_repo = "test-db-sync-repo"

let with_state key value f =
  let prev = Worker_state.state_get key in
  (match value with
   | Some v ->
       Worker_state.merge_state (Wire.Map [ kw key, v ])
   | None -> ());
  Fun.protect f
    ~finally:(fun () ->
      match prev with
      | Some v ->
          Worker_state.merge_state (Wire.Map [ kw key, v ])
      | None -> ())

let with_env name value f =
  let prev = Sys.getenv_opt name in
  Unix.putenv name value;
  Fun.protect f
    ~finally:(fun () ->
      match prev with
      | Some v -> Unix.putenv name v
      | None -> Unix.putenv name "")

(* (deftest resolve-ws-token-cli-owner-source-reads-state-token-test ...) *)
let test_resolve_ws_token_cli_owner_source_reads_state_token () =
  with_env "LOGSEQ_OWNER_SOURCE" "cli" (fun () ->
      with_state "auth/id-token" (Some (Wire.String "state-token"))
        (fun () ->
          check "state token returned"
            (await (Sync_client.resolve_ws_token ())
             = Some "state-token");
          check "state token kept"
            (Worker_state.state_get "auth/id-token"
             = Some (Wire.String "state-token"))))

(* (deftest connect-uses-platform-websocket-adapter-test ...) *)
let test_connect_uses_platform_websocket_adapter () =
  let prev_fn = !Sync_client.websocket_connect_fn in
  let ws_calls = ref [] in
  Fun.protect
    ~finally:(fun () -> Sync_client.websocket_connect_fn := prev_fn)
    (fun () ->
      with_state "auth/id-token" (Some (Wire.String "token-123"))
        (fun () ->
          Sync_client.websocket_connect_fn :=
            (fun ~url ~on_event:_ ->
               ws_calls := !ws_calls @ [ url ];
               (* the adapter call is recorded before connect needs a
                  concrete Web_socket.t — a pending task keeps the
                  continuation from running without a real socket *)
               fst (Db_worker_effect.wait ()));
          let client = Sync_state.new_client test_repo in
          let _connected_task =
            Sync_client.connect test_repo client
              "wss://example.com/sync/graph-1" None
          in
          check "websocket-connect got tokened url"
            (!ws_calls
             = [ "wss://example.com/sync/graph-1?token=token-123" ])))

let cases =
  List.map
    (fun (n, f) -> Alcotest.test_case n `Quick f)
    [ "resolve-ws-token-cli-owner-source-reads-state-token-test"
    , test_resolve_ws_token_cli_owner_source_reads_state_token
    ; "connect-uses-platform-websocket-adapter-test"
    , test_connect_uses_platform_websocket_adapter ]
