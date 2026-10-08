let check label condition = if not condition then failwith label
let invalid f = try f (); false with Invalid_argument _ -> true

let run ~enqueue ~drain ~set_owner () =
  check "missing task scheduler must fail" (invalid (fun () -> ignore (Ui_task.resolve 1)));
  let scheduler : Ui_task.scheduler =
    { enqueue; assert_owner = (fun () -> check "callbacks must run on the application thread" (set_owner None)) }
  in
  Ui_task.install scheduler;
  check "duplicate installation must fail" (invalid (fun () -> Ui_task.install scheduler));
  let tests =
    [ "deferred completion and observer order", (fun () ->
        let task, resolve, _ = Ui_task.pending () in
        let values = ref [] in
        ignore (Ui_task.bind task (fun value -> values := !values @ [value]; Ui_task.resolve ()));
        ignore (Ui_task.bind task (fun value -> values := !values @ [value + 1]; Ui_task.resolve ()));
        resolve 4;
        check "settlement cannot execute callbacks inline" (!values = []);
        drain ();
        check "observers run once in registration order" (!values = [4; 5]);
        ignore (Ui_task.bind task (fun value -> values := !values @ [value + 2]; Ui_task.resolve ()));
        check "already settled observers are deferred" (!values = [4; 5]);
        drain ();
        check "late observer receives retained value" (!values = [4; 5; 6]));
      "cross-thread completion and owner validation", (fun () ->
        let task, resolve, _ = Ui_task.pending () in
        let observed = ref false in
        ignore (Ui_task.bind task (fun _ -> observed := true; Ui_task.resolve ()));
        ignore (set_owner (Some false));
        resolve ();
        check "I/O completion cannot call UI handlers" (not !observed);
        check "task observation from I/O threads must fail" (try
          ignore (Ui_task.bind task (fun () -> Ui_task.resolve ()));
          false
        with Failure _ -> true);
        ignore (set_owner (Some true));
        drain ();
        check "completion enters through the UI queue" !observed);
      "rejection propagation and thrown continuations", (fun () ->
        let error = Failure "worker rejected" in
        let task = Ui_task.reject error in
        let received = ref None and bound = ref false in
        let chained = Ui_task.bind task (fun _ -> bound := true; Ui_task.resolve ()) in
        ignore (Ui_task.catch chained (fun e -> received := Some e; Ui_task.resolve ()));
        check "rejection handlers are deferred" (!received = None);
        drain ();
        check "rejection propagates without calling success" (not !bound && !received = Some error);
        let thrown = Ui_task.bind (Ui_task.resolve ()) (fun () -> failwith "handler failed") in
        ignore (Ui_task.catch thrown (fun e -> received := Some e; Ui_task.resolve ()));
        drain ();
        check "handler exceptions reject the dependent task" (!received = Some (Failure "handler failed")));
      "first completion wins", (fun () ->
        let task, resolve, reject = Ui_task.pending () in
        let received = ref [] in
        ignore (Ui_task.bind task (fun value -> received := value :: !received; Ui_task.resolve ()));
        resolve 1; reject (Failure "late rejection"); resolve 2;
        drain ();
        check "duplicates do not repeat or replace completion" (!received = [1]));
      "ordered all and empty all", (fun () ->
        let first, resolve_first, _ = Ui_task.pending () in
        let second, resolve_second, _ = Ui_task.pending () in
        let values = ref None in
        ignore (Ui_task.bind (Ui_task.all [|first; second|]) (fun result ->
          values := Some result; Ui_task.resolve ()));
        resolve_second 2; drain ();
        check "all waits for remaining inputs" (!values = None);
        resolve_first 1; drain ();
        check "all retains input order" (!values = Some [|1; 2|]);
        let empty = ref false in
        ignore (Ui_task.bind (Ui_task.all [||]) (fun result ->
          empty := Array.length result = 0; Ui_task.resolve ()));
        check "empty all observers are deferred" (not !empty);
        drain ();
        check "empty all completes" !empty);
      "all rejects on the first failure", (fun () ->
        let pending, resolve, _ = Ui_task.pending () in
        let error = Failure "one failed" in
        let observed = ref [] in
        ignore (Ui_task.catch (Ui_task.all [|pending; Ui_task.reject error|]) (fun e ->
          observed := e :: !observed; Ui_task.resolve [||]));
        drain ();
        check "all rejects without waiting for successful inputs" (!observed = [error]);
        resolve 1; drain ();
        check "late successes cannot replace failure" (!observed = [error]));
      "cancellation cleanup and late completion", (fun () ->
        let cleaned = ref 0 and resolve = ref (fun _ -> ()) in
        let task = Ui_task.create ~cancel:(fun () -> incr cleaned) (fun ~resolve:complete ~reject:_ ->
          resolve := complete) in
        let success = ref false and cancelled = ref false in
        ignore (Ui_task.bind task (fun _ -> success := true; Ui_task.resolve ()));
        ignore (Ui_task.catch task (fun error -> cancelled := error = Ui_task.Cancelled; Ui_task.resolve ()));
        Ui_task.cancel task; Ui_task.cancel task;
        !resolve ();
        check "cancellation handlers remain deferred" (not !cancelled);
        drain ();
        check "cleanup happens exactly once" (!cleaned = 1);
        check "cancelled tasks ignore late responses" (!cancelled && not !success));
      "cancelled dependent callbacks never run", (fun () ->
        let source = Ui_task.resolve () in
        let calls = ref 0 in
        let dependent = Ui_task.bind source (fun () -> incr calls; Ui_task.resolve ()) in
        Ui_task.cancel dependent;
        drain ();
        check "pending callback respects dependent cancellation" (!calls = 0));
      "queued completions run in submission order", (fun () ->
        let first, resolve_first, _ = Ui_task.pending () in
        let second, resolve_second, _ = Ui_task.pending () in
        let pushed = ref [] in
        ignore (Ui_task.bind first (fun _ -> pushed := !pushed @ [ `First ]; Ui_task.resolve ()));
        ignore (Ui_task.bind second (fun _ -> pushed := !pushed @ [ `Second ]; Ui_task.resolve ()));
        resolve_first ();
        resolve_second ();
        check "queued completions cannot run inline" (!pushed = []);
        drain ();
        check "queued completions keep submission order" (!pushed = [ `First; `Second ]));
      "rejected arm still releases its queued successor", (fun () ->
        (* the apply queue's either-outcome tail: a failed apply must not
           poison the queue — the next arm still runs *)
        let arm, _, reject_arm = Ui_task.pending () in
        let tail = Ui_task.catch arm (fun _ -> Ui_task.resolve ()) in
        let successor_ran = ref false in
        ignore (Ui_task.bind tail (fun () -> successor_ran := true; Ui_task.resolve ()));
        reject_arm (Failure "apply failed");
        drain ();
        check "queued successor runs after a rejected arm" !successor_ran);
      "graph-switch retires stale completions", (fun () ->
        (* a route switch cancels the in-flight fetch; its late reply
           must not publish, and work armed for the new route still
           completes *)
        let fetch, resolve_fetch, _ = Ui_task.pending () in
        let published = ref None and retired = ref false in
        let landed =
          Ui_task.bind fetch
            (fun page -> published := Some page; Ui_task.resolve ())
        in
        ignore
          (Ui_task.catch landed
             (fun e -> retired := e = Ui_task.Cancelled; Ui_task.resolve ()));
        Ui_task.cancel landed;
        Ui_task.cancel fetch;
        resolve_fetch "stale page";
        drain ();
        check "late completion after the switch is suppressed"
          (!published = None && !retired);
        let next, resolve_next, _ = Ui_task.pending () in
        ignore (Ui_task.bind next (fun page -> published := Some page; Ui_task.resolve ()));
        resolve_next "fresh page";
        drain ();
        check "work armed after the switch completes" (!published = Some "fresh page"));
      "creation exceptions reject asynchronously", (fun () ->
        let received = ref None in
        let task = Ui_task.create (fun ~resolve:_ ~reject:_ -> failwith "request startup failed") in
        ignore (Ui_task.catch task (fun error -> received := Some error; Ui_task.resolve ()));
        check "startup exception does not run observers inline" (!received = None);
        drain ();
        check "startup exception reaches rejection handler" (!received = Some (Failure "request startup failed")))
    ]
  in
  let failures = ref [] in
  List.iter (fun (name, test) ->
    try test (); print_endline ("PASS " ^ name)
    with error ->
      ignore (set_owner (Some true));
      drain ();
      failures := name :: !failures;
      prerr_endline ("FAIL " ^ name ^ ": " ^ Printexc.to_string error)) tests;
  check "task contract scenarios failed" (!failures = [])
