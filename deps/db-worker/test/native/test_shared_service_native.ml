(* cljs -> ocaml translation, 1:1:
   src/test/frontend/worker/shared_service_test.cljs (1 deftest)
   src/test/frontend/worker/a_test_env.cljs — JS global shims
   (self/importScripts/postMessage); N/A natively.

   The cljs test stubs a :node platform and checks the service proxy's
   remoteInvoke applies its args onto the target. On the :node branch
   cljs pins master-client = true and client-id = "node"; the browser
   master/slave election branch is exercised in melange only. cljs
   deftest name kept as the OCaml test name. *)

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

(* (deftest node-proxy-remote-invoke-applies-args ...) *)
let test_node_proxy_remote_invoke_applies_args () =
  let received = ref None in
  (* cljs target #js {"remoteInvoke" (fn [& args] (reset! received args) :ok)} *)
  let target _method_name args =
    received := Some args;
    Db_worker_effect.pure (Wire.Keyword "ok")
  in
  let service =
    await
      (Shared_service.create_service ~service_name:"test-service" ~target
         ~on_become_master_handler:(fun _ -> Db_worker_effect.pure ())
         ~broadcast_data_types:[] ())
  in
  check "client-id" (service.Shared_service.client_id = "node");
  let _res =
    await
      (service.Shared_service.proxy
         [ Wire.String "thread-api/foo"; Wire.String "transit-payload" ])
  in
  match !received with
  | Some [ Wire.String method_; Wire.String payload ] ->
      check "method" (method_ = "thread-api/foo");
      check "payload" (payload = "transit-payload")
  | _ -> check "received args" false

module E = Db_worker_effect

let observe task =
  let outcome = ref None in
  E.on_any task
    (fun value -> outcome := Some (Ok value))
    (fun exn -> outcome := Some (Error exn));
  outcome

let create handler =
  await
    (Shared_service.create_service ~service_name:"failure-contract"
       ~target:(fun _ _ -> E.pure Wire.Nil)
       ~on_become_master_handler:handler ~broadcast_data_types:[] ())

let test_ready_success_is_synchronous () =
  let calls = ref 0 in
  let service = create (fun _ -> incr calls; E.pure ()) in
  check "initialization ran before create returned" (!calls = 1);
  check "ready settled before observer returned"
    (!(observe service.status_ready) = Some (Ok ()))

let test_ready_failure () =
  let failure = Failure "initialization failed" in
  let service = create (fun _ -> E.error failure) in
  check "ready rejects with initialization failure"
    (!(observe service.status_ready) = Some (Error failure))

let test_ready_synchronous_throw () =
  let failure = Failure "initialization threw" in
  let service = create (fun _ -> raise failure) in
  check "ready rejects with synchronous initialization failure"
    (!(observe service.status_ready) = Some (Error failure))

let test_ready_deferred_success () =
  let init, resolver = E.wait () in
  let service = create (fun _ -> init) in
  let outcome = observe service.status_ready in
  check "ready waits for initialization" (!outcome = None);
  E.wakeup resolver ();
  check "ready resolves when initialization completes" (!outcome = Some (Ok ()))

let test_ready_deferred_failure () =
  let init, resolver = E.wait () in
  let service = create (fun _ -> init) in
  let first = observe service.status_ready in
  let second = observe service.status_ready in
  let failure = Failure "deferred initialization failed" in
  check "ready waits for initialization" (!first = None && !second = None);
  E.reject resolver failure;
  check "both observers receive initialization failure"
    (!first = Some (Error failure) && !second = Some (Error failure));
  E.wakeup resolver ();
  check "late settlement cannot replace failure" (!first = Some (Error failure))

let test_new_service_after_failure () =
  let failure = Failure "first initialization failed" in
  let first = create (fun _ -> E.error failure) in
  let second = create (fun _ -> E.pure ()) in
  check "old ready remains rejected"
    (!(observe first.status_ready) = Some (Error failure));
  check "new service can initialize"
    (!(observe second.status_ready) = Some (Ok ()))

let test_proxy_synchronous_throw () =
  let failure = Failure "target threw" in
  let service =
    await
      (Shared_service.create_service ~service_name:"proxy-failure"
         ~target:(fun _ _ -> raise failure)
         ~on_become_master_handler:(fun _ -> E.pure ())
         ~broadcast_data_types:[] ())
  in
  check "proxy returns a rejected effect"
    (!(observe (service.proxy [])) = Some (Error failure))

let cases =
  [ Alcotest.test_case "node-proxy-remote-invoke-applies-args" `Quick
      test_node_proxy_remote_invoke_applies_args
  ; Alcotest.test_case "ready-success-is-synchronous" `Quick test_ready_success_is_synchronous
  ; Alcotest.test_case "ready-failure" `Quick test_ready_failure
  ; Alcotest.test_case "ready-synchronous-throw" `Quick test_ready_synchronous_throw
  ; Alcotest.test_case "ready-deferred-success" `Quick test_ready_deferred_success
  ; Alcotest.test_case "ready-deferred-failure" `Quick test_ready_deferred_failure
  ; Alcotest.test_case "new-service-after-failure" `Quick test_new_service_after_failure
  ; Alcotest.test_case "proxy-synchronous-throw" `Quick test_proxy_synchronous_throw
  ]
