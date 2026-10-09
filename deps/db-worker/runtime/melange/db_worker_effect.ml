type 'a state =
  | Pending
  | Resolved of 'a
  | Rejected of exn

type 'a t =
  { mutable state : 'a state
  ; mutable callbacks : ('a state -> unit) Rrbvec.t
  }

type 'a resolver = 'a t

let pure value = { state = Resolved value; callbacks = Rrbvec.empty }
let error exn = { state = Rejected exn; callbacks = Rrbvec.empty }

let is_pending task = match task.state with Pending -> true | _ -> false

let wait () =
  let task = { state = Pending; callbacks = Rrbvec.empty } in
  (task, task)

(* JS .then isolates each listener: a raising callback must not drop
   the remaining listeners nor propagate into whatever settled the task
   (ws onmessage / timer / IDB). Log and continue instead. *)
let run_callback callback state =
  try callback state
  with exn ->
    Worker_log.error "effect/callback-raised"
      [ ("error", Printexc.to_string exn) ]

(* Callbacks dispatch through a shared run-queue instead of nested
   calls: a wakeup or bind from inside a callback queues the next
   callbacks ahead of the remaining ones — the same depth-first order
   a recursive dispatch had, without growing the JS stack. Synchronous
   bind chains (let* over already-settled tasks) overflowed the small
   stack of mobile Safari workers (RangeError). *)
let pending_runs : (unit -> unit) list ref = ref []
let draining = ref false

let rec drain () =
  match !pending_runs with
  | [] -> ()
  | run :: rest ->
      pending_runs := rest;
      run ();
      drain ()

let schedule_runs runs =
  pending_runs := runs @ !pending_runs;
  if not !draining then begin
    draining := true;
    Fun.protect ~finally:(fun () -> draining := false) drain
  end

let notify task state =
  if is_pending task then begin
    task.state <- state;
    let callbacks = Rrbvec.rev task.callbacks in
    task.callbacks <- Rrbvec.empty;
    schedule_runs
      (List.map
         (fun callback () -> run_callback callback state)
         (Rrbvec.to_list callbacks))
  end

let wakeup resolver value = notify resolver (Resolved value)
let reject resolver exn = notify resolver (Rejected exn)

let on_state task callback =
  match task.state with
  | Pending -> task.callbacks <- Rrbvec.push_front task.callbacks callback
  | state -> schedule_runs [ (fun () -> run_callback callback state) ]

let bind task f =
  let result, resolver = wait () in
  on_state task (function
    | Pending -> ()
    | Resolved value ->
        (try
           let next = f value in
           on_state next (function
             | Pending -> ()
             | Resolved value -> wakeup resolver value
             | Rejected exn -> reject resolver exn)
         with exn -> reject resolver exn)
    | Rejected exn -> reject resolver exn);
  result

module Infix = struct
  let ( >>= ) = bind
end

let map f task = bind task (fun value -> pure (f value))

let both left right =
  bind left (fun left_value -> map (fun right_value -> (left_value, right_value)) right)

let all tasks_list =
  let tasks = Rrbvec.of_list tasks_list in
  let result, resolver = wait () in
  let pending = ref (Rrbvec.length tasks) in
  let values = Array.make (Rrbvec.length tasks) None in
  let finish_if_ready () =
    if !pending = 0 && is_pending result then
      wakeup resolver (Array.map Option.get values |> Array.to_list)
  in
  Rrbvec.iteri
    (fun index task ->
       on_state task (function
         | Pending -> ()
         | Resolved value ->
             values.(index) <- Some value;
             decr pending;
             finish_if_ready ()
         | Rejected exn -> if is_pending result then reject resolver exn))
    tasks;
  finish_if_ready ();
  result

let catch value handler =
  let result, resolver = wait () in
  on_state value (function
    | Pending -> ()
    | Resolved value -> wakeup resolver value
    | Rejected exn ->
        (try
           let next = handler exn in
           on_state next (function
             | Pending -> ()
             | Resolved value -> wakeup resolver value
             | Rejected exn -> reject resolver exn)
         with exn -> reject resolver exn));
  result

let finally value f =
  let result, resolver = wait () in
  let finish state =
    let cleanup = try f () with exn -> error exn in
    on_state cleanup (function
      | Pending -> ()
      | Resolved () ->
          (match state with
           | Pending -> ()
           | Resolved value -> wakeup resolver value
           | Rejected exn -> reject resolver exn)
      | Rejected exn -> reject resolver exn)
  in
  on_state value finish;
  result

(* Fire-and-forget like an unobserved promise: log the rejection instead
   of silently swallowing it (worse than cljs unhandledrejection). A
   synchronous raise in the thunk still propagates to the caller. *)
let async f =
  ignore
    (catch (f ())
       (fun exn ->
          Worker_log.error "effect/async-rejected"
            [ ("error", Printexc.to_string exn) ];
          pure ())
      : unit t)

let on_any task on_ok on_error =
  on_state task (function
    | Pending -> ()
    | Resolved value -> on_ok value
    | Rejected exn -> on_error exn)

let sleep span =
  let task, resolver = wait () in
  ignore
    (Js.Global.setTimeout ~f:(fun () -> wakeup resolver ()) (int_of_float span)
       : Js.Global.timeoutId);
  task

let timeout task ms =
  let result, resolver = wait () in
  let timer =
    Js.Global.setTimeout
      ~f:(fun () -> reject resolver (Failure "timeout"))
      (int_of_float ms)
  in
  on_state task (function
    | Pending -> ()
    | Resolved value ->
        Js.Global.clearTimeout timer;
        wakeup resolver value
    | Rejected exn ->
        Js.Global.clearTimeout timer;
        reject resolver exn);
  result
