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

(* Optional application-owned work observation. No registry is installed for
   ordinary callers; the ambient scope only follows a serialized application. *)
module Activity = struct
  type t = { mutable pending : int; mutable epoch : int; mutable live : bool }
  type snapshot = { pending : int; epoch : int }
  let current : t option ref = ref None
  let create () = { pending = 0; epoch = 0; live = true }
  let same_scope left right = match left, right with
    | None, None -> true
    | Some left, Some right -> left == right
    | None, Some _ | Some _, None -> false
  let in_context scope f =
    let previous = !current in
    if same_scope scope previous then f ()
    else begin
      current := scope;
      Fun.protect ~finally:(fun () -> current := previous) f
    end
  let within scope f = in_context (Some scope) f
  let without f = in_context None f
  let capture f =
    let scope = !current in
    fun value ->
      if same_scope scope !current then f value
      else in_context scope (fun () -> f value)
  let begin_work () =
    match !current with
    | Some scope when scope.live ->
        scope.pending <- scope.pending + 1;
        scope.epoch <- scope.epoch + 1;
        let finished = ref false in
        Some (fun () ->
          if not !finished then begin
            finished := true;
            scope.pending <- scope.pending - 1;
            scope.epoch <- scope.epoch + 1
          end)
    | None | Some _ -> None
  let snapshot (scope : t) : snapshot = { pending = scope.pending; epoch = scope.epoch }
  let close scope = scope.live <- false
end

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
  finish_activity : (unit -> unit) option;
}

let new_pending () =
  owner ();
  { state = Pending; callbacks = []; cancel_hooks = []; cleanup_hooks = [];
    finish_activity = Activity.begin_work () }

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
      Option.iter (fun finish -> finish ()) task.finish_activity;
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
  let listener = { callback = Activity.capture callback; active = true } in
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
