let check label condition = if not condition then failwith label

(* Ui_effect: scope-bound timers/tasks drop their callbacks on dispose,
   explicit load signals expose Loading/Ready/Failed, and the request
   guard retires earlier tickets. Runs inside both contracts runners —
   Ui_task and Ui_services are installed by then. *)
let run ~drain () =
  let scope = Signal.scope "fx-live" in

  (* task: settlement deferred through the scheduler queue *)
  let seen = ref [] in
  let t, resolve, _ = Ui_task.pending () in
  Ui_effect.task ~scope t
    ~ok:(fun v -> seen := `ok v :: !seen)
    ~error:(fun _ -> seen := `err :: !seen);
  resolve 7;
  check "scoped task settlement is deferred" (!seen = []);
  drain ();
  check "scoped task delivers while alive" (!seen = [ `ok 7 ]);

  (* task: rejection reaches error while alive *)
  let t2, _, reject2 = Ui_task.pending () in
  Ui_effect.task ~scope t2
    ~ok:(fun _ -> seen := `ok 0 :: !seen)
    ~error:(fun _ -> seen := `err :: !seen);
  reject2 (Failure "worker rejected");
  drain ();
  check "scoped task reports errors while alive" (!seen = [ `err; `ok 7 ]);

  (* task: a cancelled task never reports an error *)
  let t3, _, _ = Ui_task.pending () in
  Ui_effect.task ~scope t3
    ~ok:(fun _ -> seen := `ok 0 :: !seen)
    ~error:(fun _ -> seen := `err :: !seen);
  Ui_task.cancel t3;
  drain ();
  check "cancelled task stays silent" (!seen = [ `err; `ok 7 ]);

  (* task: disposing the scope cancels; late completions never land *)
  let dead = Signal.scope "fx-dead" in
  let delivered = ref false in
  let t4, resolve4, _ = Ui_task.pending () in
  Ui_effect.task ~scope:dead t4
    ~ok:(fun _ -> delivered := true)
    ~error:(fun _ -> delivered := true);
  Signal.dispose_scope dead;
  resolve4 ();
  drain ();
  check "disposed scope drops the task result" (not !delivered);

  (* timeout: fires while the scope is alive *)
  let fired = ref 0 in
  ignore (Ui_effect.timeout ~scope 10 (fun () -> incr fired));
  Ui_services_scenarios.run_timers ();
  check "scoped timeout fires while alive" (!fired = 1);

  (* timeout: disposing the scope clears the pending timer *)
  let dead2 = Signal.scope "fx-dead2" in
  ignore (Ui_effect.timeout ~scope:dead2 10 (fun () -> incr fired));
  Signal.dispose_scope dead2;
  Ui_services_scenarios.run_timers ();
  check "disposed scope clears the pending timer" (!fired = 1);

  (* load: explicit Loading -> Ready / Failed *)
  let sched = Signal.scheduler () in
  let lt, lresolve, _ = Ui_task.pending () in
  let ls = Ui_effect.load ~sched ~scope lt in
  check "load starts Loading" (Signal.get ls = Ui_effect.Loading);
  lresolve "content";
  drain ();
  Signal.stabilize sched;
  check "load resolves to Ready" (Signal.get ls = Ui_effect.Ready "content");
  let lt2, _, lreject = Ui_task.pending () in
  let ls2 = Ui_effect.load ~sched ~scope lt2 in
  lreject (Failure "nope");
  drain ();
  Signal.stabilize sched;
  check "load rejects to Failed"
    (match Signal.get ls2 with Ui_effect.Failed _ -> true | _ -> false);

  (* load on a dead scope stays Loading forever *)
  let dead3 = Signal.scope "fx-dead3" in
  let lt3, lresolve3, _ = Ui_task.pending () in
  let ls3 = Ui_effect.load ~sched ~scope:dead3 lt3 in
  Signal.dispose_scope dead3;
  lresolve3 "late";
  drain ();
  check "disposed load stays Loading" (Signal.get ls3 = Ui_effect.Loading);

  (* request: latest-wins ticket guard *)
  let req = Ui_effect.request () in
  let a = Ui_effect.issue req in
  let b = Ui_effect.issue req in
  check "request retires earlier tickets"
    (not (Ui_effect.is_current req a) && Ui_effect.is_current req b);

  Signal.dispose_scope scope;
  print_endline "PASS ui_effect: scoped tasks, timers, load, request"
