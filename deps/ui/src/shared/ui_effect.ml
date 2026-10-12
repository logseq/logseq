(* Scope-bound effects.

   Timers and Ui_task work started inside a view mount outlive the view
   unless they hang off its ui_scope — the helpers here register cleanup
   through Signal.on_dispose so disposal clears the pending timer and
   drops the task's callbacks. Controller-owned work (saves,
   navigation) deliberately stays unscoped: it must outlive the view
   that triggered it. *)

let alive scope = not (Signal.scope_is_disposed scope)

(* [timeout ~scope ms f] fires [f] after [ms] unless the scope was
   disposed first; returns the timer id so callers can still cancel
   early. The pending timer is cleared on dispose. *)
let timeout ~scope ms f : int =
  let fired = ref false in
  let id =
    Ui_services.timers_timeout
      (fun () ->
        fired := true;
        if alive scope then f ())
      ms
  in
  Signal.on_dispose scope (fun () ->
      if not !fired then Ui_services.timers_clear_timeout id);
  id

let interval ~scope ms f : int =
  let id =
    Ui_services.timers_interval (fun () -> if alive scope then f ()) ms
  in
  Signal.on_dispose scope (fun () -> Ui_services.timers_clear_interval id);
  id

(* [task ~scope t ~ok ~error] runs [t] bound to the scope: [ok]/[error]
   fire only while the scope is alive, and disposal cancels the task.
   A cancelled task never reaches [error]. *)
let task ~scope t ~ok ~error =
  let live = ref true in
  Signal.on_dispose scope (fun () ->
      live := false;
      Ui_task.cancel t);
  ignore
    (Ui_task.catch
       (Ui_task.bind t (fun v ->
            if !live then ok v;
            Ui_task.resolve ()))
       (fun e ->
         if !live && e <> Ui_task.Cancelled then error e;
         Ui_task.resolve ()))

(* Explicit loading/error for scope-bound reads. *)
type 'a load =
  | Loading
  | Ready of 'a
  | Failed of exn

let load ~sched ~scope t : 'a load Signal.signal =
  let st = Signal.state sched Loading in
  task ~scope t
    ~ok:(fun v ->
      Signal.set st (Ready v);
      Ui_services.request_flush ())
    ~error:(fun e ->
      Signal.set st (Failed e);
      Ui_services.request_flush ());
  Signal.value st

(* Latest-wins request guard: each [issue] retires every earlier ticket,
   so a slow async reply can't overwrite a newer request's result. *)
type request = { mutable current : int }

let request () = { current = 0 }
let issue r =
  r.current <- r.current + 1;
  r.current
let is_current r n = r.current = n
