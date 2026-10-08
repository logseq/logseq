type scheduler = {
  enqueue : (unit -> unit) -> unit;
  assert_owner : unit -> unit;
}

let installed : scheduler option ref = ref None
let scheduler () = match !installed with
  | Some scheduler -> scheduler
  | None -> invalid_arg "UI task scheduler not installed"
let owner () = (scheduler ()).assert_owner ()
let install scheduler =
  match !installed with
  | Some _ -> invalid_arg "UI task scheduler already installed"
  | None -> scheduler.assert_owner (); installed := Some scheduler

exception Cancelled
type 'a state = Pending | Settled of ('a, exn) result
type 'a listener = {
  callback : ('a, exn) result -> unit;
  mutable active : bool;
}
type 'a t = {
  mutable state : 'a state;
  mutable callbacks : 'a listener list;
  mutable cancel_hooks : (unit -> unit) list;
  mutable cleanup_hooks : (unit -> unit) list;
}

let new_pending () =
  owner ();
  { state = Pending; callbacks = []; cancel_hooks = []; cleanup_hooks = [] }

let notify listener result =
  (scheduler ()).enqueue (fun () ->
    owner ();
    if listener.active then begin
      listener.active <- false;
      listener.callback result
    end)

let settle task result =
  owner ();
  match task.state with
  | Settled _ -> ()
  | Pending ->
      task.state <- Settled result;
      let callbacks = List.rev task.callbacks and cleanup = task.cleanup_hooks in
      task.callbacks <- [];
      task.cancel_hooks <- [];
      task.cleanup_hooks <- [];
      List.iter (fun hook -> hook ()) cleanup;
      List.iter (fun listener -> notify listener result) callbacks

let pending () =
  let task = new_pending () in
  let enqueue = (scheduler ()).enqueue in
  task,
  (fun value -> enqueue (fun () -> settle task (Ok value))),
  (fun error -> enqueue (fun () -> settle task (Error error)))

let create ?cancel f =
  let task, resolve, reject = pending () in
  task.cancel_hooks <- (match cancel with None -> [] | Some hook -> [hook]);
  (try f ~resolve ~reject with error -> reject error);
  task

let resolve value = let task = new_pending () in settle task (Ok value); task
let reject error = let task = new_pending () in settle task (Error error); task

let observe task callback =
  owner ();
  let listener = { callback; active = true } in
  (match task.state with
  | Pending -> task.callbacks <- listener :: task.callbacks
  | Settled result -> notify listener result);
  fun () ->
    owner ();
    listener.active <- false;
    task.callbacks <- List.filter (fun current -> current != listener) task.callbacks

let chain task on_success on_error =
  let out = new_pending () in
  let unsubscribe = observe task (fun result ->
    match out.state with
    | Settled _ -> ()
    | Pending ->
        let next = try match result with
          | Ok value -> on_success value
          | Error error -> on_error error
        with error -> reject error in
        match out.state with
        | Settled _ -> ()
        | Pending ->
            let unsubscribe = observe next (settle out) in
            out.cleanup_hooks <- unsubscribe :: out.cleanup_hooks)
  in
  out.cleanup_hooks <- [unsubscribe];
  out

let bind task f = chain task f reject
let catch task f = chain task resolve f

let all tasks =
  let out = new_pending () in
  let remaining = ref (Array.length tasks) in
  let values = Array.make !remaining None in
  if !remaining = 0 then settle out (Ok [||]);
  Array.iteri (fun index task ->
    let unsubscribe = observe task (fun result ->
      match out.state with
      | Settled _ -> ()
      | Pending -> match result with
        | Error error -> settle out (Error error)
        | Ok value ->
            values.(index) <- Some value;
            decr remaining;
            if !remaining = 0 then settle out (Ok (Array.map Option.get values)))
    in
    out.cleanup_hooks <- unsubscribe :: out.cleanup_hooks) tasks;
  out

let cancel task =
  owner ();
  match task.state with
  | Settled _ -> ()
  | Pending ->
      let hooks = task.cancel_hooks in
      settle task (Error Cancelled);
      List.iter (fun hook -> hook ()) hooks

let ( let* ) = bind
