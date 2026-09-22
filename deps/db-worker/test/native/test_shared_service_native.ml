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

let cases =
  [ Alcotest.test_case "node-proxy-remote-invoke-applies-args" `Quick
      test_node_proxy_remote_invoke_applies_args
  ]
