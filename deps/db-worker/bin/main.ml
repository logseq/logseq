(* db-worker-node native daemon entrypoint.

   Runs the OCaml worker directly instead of the node
   db-worker-node.js + db-worker-ocaml.cjs bundle. The cljs daemon is
   single-threaded; here request handlers run on connection threads,
   so worker invocations are serialized on a global mutex held until
   the returned E.t settles — preserving the JS "one invoke at a
   time" semantics. *)

module E = Db_worker_effect

let invoke_mu = Mutex.create ()

let serialize (f : 'a -> 'b E.t) : 'a -> 'b E.t =
  fun arg ->
    Mutex.lock invoke_mu;
    match
      (try `Task (f arg) with exn -> `Err exn)
    with
    | `Task task ->
        E.finally task (fun () -> Mutex.unlock invoke_mu; E.pure ())
    | `Err exn -> Mutex.unlock invoke_mu; raise exn

let () =
  (* parse_argv expects JS argv ([runtime, script, ...args]); native
     argv only has the executable name, so pad one slot. *)
  Db_worker_node.argv_fn :=
    (fun () ->
       match Node_process.argv () with
       | exe :: args -> exe :: "db-worker-node" :: args
       | args -> "db-worker-node" :: "db-worker-node" :: args);
  Db_worker_node.remote_invoke_fn :=
    (fun method_str args_transit ->
       serialize
         (fun (m, a) -> Worker_core.invoke m a)
         (method_str, args_transit));
  Db_worker_node.remote_invoke_binary_fn :=
    (fun method_str repo payload ->
       serialize
         (fun (m, r, p) ->
            Dispatcher.invoke m [ Wire.String r; Wire.Binary p ])
         (method_str, repo, payload));
  Db_worker_node.main ();
  (* The JS daemon stays alive on the node event loop; keep the main
     thread parked until [Node_process.exit] from a signal or
     /v1/shutdown ends the process. *)
  while true do
    Thread.delay 3600.0
  done
