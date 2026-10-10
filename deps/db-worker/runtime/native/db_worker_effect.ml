type 'a state =
  | Pending
  | Resolved of 'a
  | Rejected of exn

type 'a t =
  { mutable state : 'a state
  ; mutable callbacks : ('a state -> unit) Rrbvec.t
  ; mutex : Mutex.t
  }

type 'a resolver = 'a t

(* Connection threads resolve tasks while worker threads attach
   continuations — state transitions and callback attachment must
   serialize on the task's mutex or a wakeup racing an on_state can
   strand a callback that is never invoked. *)
let make state = { state; callbacks = Rrbvec.empty; mutex = Mutex.create () }

let pure value = make (Resolved value)
let error exn = make (Rejected exn)

let is_pending task = match task.state with Pending -> true | _ -> false

let wait () =
  let task = make Pending in
  (task, task)

(* JS .then isolates each listener: a raising callback must not drop
   the remaining listeners nor propagate into whatever settled the task
   (ws onmessage / timer / IDB). Log and continue instead. *)
let run_callback callback state =
  try callback state
  with exn ->
    Worker_log.error "effect/callback-raised"
      [ ("error", Printexc.to_string exn) ]

let notify task state =
  Mutex.lock task.mutex;
  let callbacks =
    match task.state with
    | Pending ->
        task.state <- state;
        let cbs = Rrbvec.rev task.callbacks in
        task.callbacks <- Rrbvec.empty;
        cbs
    | _ -> Rrbvec.empty
  in
  Mutex.unlock task.mutex;
  Rrbvec.iter (fun callback -> run_callback callback state) callbacks

let wakeup resolver value = notify resolver (Resolved value)
let reject resolver exn = notify resolver (Rejected exn)

let on_state task callback =
  Mutex.lock task.mutex;
  let run_now =
    match task.state with
    | Pending ->
        task.callbacks <- Rrbvec.push_front task.callbacks callback;
        false
    | _ -> true
  in
  Mutex.unlock task.mutex;
  if run_now then run_callback callback task.state

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
  (* [on_state] callbacks fire on whichever thread resolves each task, so
     the shared countdown must be serialized — a lost decrement would
     leave the aggregate pending forever. *)
  let count_mutex = Mutex.create () in
  let finish_if_ready () =
    Mutex.lock count_mutex;
    let ready = !pending = 0 in
    Mutex.unlock count_mutex;
    if ready && is_pending result then
      wakeup resolver (Array.map Option.get values |> Array.to_list)
  in
  Rrbvec.iteri
    (fun index task ->
       on_state task (function
         | Pending -> ()
         | Resolved value ->
             Mutex.lock count_mutex;
             values.(index) <- Some value;
             decr pending;
             Mutex.unlock count_mutex;
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
  (* No event loop on native yet; block briefly. Used only by tests. *)
  ignore (Unix.select [] [] [] (span /. 1000.));
  pure ()

let timeout task ms =
  (* Handlers run on per-connection threads, so blocking until the task
     settles or the deadline passes matches promesa p/timeout. *)
  match task.state with
  | Resolved value -> pure value
  | Rejected exn -> error exn
  | Pending ->
      let deadline = Unix.gettimeofday () +. (ms /. 1000.) in
      while
        is_pending task && Unix.gettimeofday () < deadline
      do
        ignore (Unix.select [] [] [] 0.005)
      done;
      (match task.state with
       | Resolved value -> pure value
       | Rejected exn -> error exn
       | Pending -> error (Failure "timeout"))
