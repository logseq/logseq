(* db-worker-node native daemon entrypoint.

   Runs the OCaml worker directly instead of the node
   db-worker-node.js bundle. The cljs daemon is
   single-threaded; here request handlers run on connection threads,
   so worker invocations use a condition gate until the returned E.t
   settles. Completion may run on another thread; no OS mutex stays
   owned across that asynchronous boundary. *)

module E = Db_worker_effect

let invoke_mu = Mutex.create ()
let invoke_available = Condition.create ()
let invoke_busy = ref false
let last_activity = ref (Time.monotonic_now ())
let released_major_words = ref (Gc.quick_stat ()).major_words

let finish_invocation () =
  Mutex.lock invoke_mu;
  last_activity := Time.monotonic_now ();
  invoke_busy := false;
  Condition.signal invoke_available;
  Mutex.unlock invoke_mu

(* OCaml 5 keeps swept pools mapped until compaction, even when the
   live graph is small. Return that burst capacity after five idle
   seconds and at least 32 MiB of major allocations since the last
   release. Check inactivity under the invoke mutex, then release it
   before compacting so signal handlers can still close the graph. *)
let release_idle_heap () =
  let candidate =
    if Mutex.try_lock invoke_mu then
      Fun.protect ~finally:(fun () -> Mutex.unlock invoke_mu) (fun () ->
          let stats = Gc.quick_stat () in
          if not !invoke_busy && Time.diff_monotonic_ms !last_activity (Time.monotonic_now ()) >= 5000.
             && stats.major_words -. !released_major_words >= 4_194_304.
          then Some stats else None)
    else None
  in
  match candidate with
  | None -> ()
  | Some stats ->
      let started = Time.monotonic_now () in
      Gc.compact ();
      let after = Gc.quick_stat () in
      released_major_words := stats.major_words;
      Worker_log.debug "native/idle-heap-release"
        [ "heap-words-before", string_of_int stats.heap_words
        ; "heap-words-after", string_of_int after.heap_words
        ; "duration-ms", string_of_float
            (Time.diff_monotonic_ms started (Time.monotonic_now ())) ]

let serialize (f : 'a -> 'b E.t) : 'a -> 'b E.t =
  fun arg ->
    Mutex.lock invoke_mu;
    while !invoke_busy do Condition.wait invoke_available invoke_mu done;
    invoke_busy := true;
    Mutex.unlock invoke_mu;
    match
      (try `Task (f arg) with exn -> `Err exn)
    with
    | `Task task ->
        E.finally task (fun () -> finish_invocation (); E.pure ())
    | `Err exn -> finish_invocation (); raise exn

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
  (* Keep the daemon alive and maintain its native heap while idle. *)
  while true do
    Thread.delay 1.0;
    release_idle_heap ()
  done
