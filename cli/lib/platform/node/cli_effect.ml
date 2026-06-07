type 'a state =
  | Pending
  | Resolved of 'a
  | Rejected of exn

type 'a t = {
  mutable state : 'a state;
  mutable callbacks : ('a state -> unit) list;
}

type 'a resolver = 'a t

let pure value = { state = Resolved value; callbacks = [] }
let error exn = { state = Rejected exn; callbacks = [] }

let is_pending task =
  match task.state with Pending -> true | Resolved _ | Rejected _ -> false

let wait () =
  let task = { state = Pending; callbacks = [] } in
  (task, task)

let notify task state =
  if is_pending task then (
    task.state <- state;
    let callbacks = List.rev task.callbacks in
    task.callbacks <- [];
    List.iter (fun callback -> callback state) callbacks)

let wakeup resolver value = notify resolver (Resolved value)
let reject resolver exn = notify resolver (Rejected exn)

let on_state task callback =
  match task.state with
  | Pending -> task.callbacks <- callback :: task.callbacks
  | state -> callback state

let bind task f =
  let result, resolver = wait () in
  on_state task (function
    | Pending -> ()
    | Resolved value -> (
        try
          let next = f value in
          on_state next (function
            | Pending -> ()
            | Resolved value -> wakeup resolver value
            | Rejected exn -> reject resolver exn)
        with exn -> reject resolver exn)
    | Rejected exn -> reject resolver exn);
  result

let ( >>= ) = bind
let map f task = bind task (fun value -> pure (f value))

let rec map_s f = function
  | [] -> pure []
  | value :: rest ->
      bind (f value) (fun mapped ->
          map (fun mapped_rest -> mapped :: mapped_rest) (map_s f rest))

let both left right =
  bind left (fun left_value ->
      map (fun right_value -> (left_value, right_value)) right)

let all tasks =
  let result, resolver = wait () in
  let pending = ref (List.length tasks) in
  let values = Array.make (List.length tasks) None in
  let finish_if_ready () =
    if !pending = 0 && is_pending result then
      wakeup resolver (values |> Array.to_list |> List.map Option.get)
  in
  List.iteri
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

let pick tasks =
  let result, resolver = wait () in
  List.iter
    (fun task ->
      on_state task (function
        | Pending -> ()
        | Resolved value -> if is_pending result then wakeup resolver value
        | Rejected exn -> if is_pending result then reject resolver exn))
    tasks;
  result

let catch value handler =
  let result, resolver = wait () in
  on_state value (function
    | Pending -> ()
    | Resolved value -> wakeup resolver value
    | Rejected exn -> (
        try
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
      | Resolved () -> (
          match state with
          | Pending -> ()
          | Resolved value -> wakeup resolver value
          | Rejected exn -> reject resolver exn)
      | Rejected exn -> reject resolver exn)
  in
  on_state value finish;
  result

let async f =
  ignore (catch (f ()) (fun _ -> pure ()) : unit t)

let on_any task on_ok on_error =
  on_state task (function
    | Pending -> ()
    | Resolved value -> on_ok value
    | Rejected exn -> on_error exn)

let sleep span =
  let task, resolver = wait () in
  ignore
    (Js.Global.setTimeout
       ~f:(fun () -> wakeup resolver ())
       (int_of_float span)
      : Js.Global.timeoutId);
  task
