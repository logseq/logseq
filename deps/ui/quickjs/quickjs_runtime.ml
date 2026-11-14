open Plugin_protocol

type handle
type event = Waiting | Host_request of int * int * Json.t | Finished of Json.t | Failed of int
external native_create : int array -> handle = "logseq_quickjs_create"
external native_load : handle -> string -> int = "logseq_quickjs_load"
external native_start : handle -> int -> int = "logseq_quickjs_start"
external native_has_callback : handle -> int -> bool = "logseq_quickjs_has_callback"
external native_poll : handle -> event = "logseq_quickjs_poll"
external native_complete : handle -> int -> bool -> Json.t -> unit = "logseq_quickjs_complete"
external native_stop : handle -> unit = "logseq_quickjs_stop"
external native_close : handle -> unit = "logseq_quickjs_close"

type call = {
  invocation : Plugin_broker.invocation;
  read_only : bool;
  resolve : (program, error) result -> unit;
  mutable jobs : unit Ui_task.t list;
}
type t = {
  handle : handle;
  broker : Plugin_broker.t;
  session : Plugin_broker.session;
  owner : int;
  mutable closed : bool;
  mutable loaded : bool;
  mutable active : call option;
}

let next_owner = ref 0
let create broker session =
  if !next_owner = max_int then Error Resource_limit
  else
    try
    let handle = native_create
      [|24 * 1024 * 1024; 512 * 1024; 256 * 1024; max_message_bytes;
        max_string_bytes; max_nodes; max_depth; max_calls|] in
    incr next_owner;
    Ok { handle; broker; session; owner = !next_owner;
         closed = false; loaded = false; active = None }
    with Failure _ -> Error Resource_limit

let is_active t call =
  match t.active with Some active -> active == call | None -> false

let rec finish t call result =
  if is_active t call then begin
    t.active <- None;
    if not t.closed then native_stop t.handle;
    Plugin_broker.cancel t.broker call.invocation;
    List.iter Ui_task.cancel call.jobs;
    call.jobs <- [];
    if Result.is_error result then close t;
    call.resolve result
  end

and close t =
  if not t.closed then begin
    t.closed <- true;
    Option.iter (fun call -> finish t call (Error Cancelled)) t.active;
    Plugin_broker.close_session t.broker t.session;
    native_close t.handle
  end

let load t ~source =
  if t.closed then Error Cancelled
  else if t.loaded then Error Invalid_request
  else if String.length source > 256 * 1024 then Error Resource_limit
  else if not (valid_utf8 source) then Error Invalid_request
  else
    match native_load t.handle source with
    | 0 -> t.loaded <- true; Ok (callback_id ~owner:t.owner)
    | code -> let error = error_of_code (code - 1) in close t; Error error

let invoke ~read_only t invocation callback =
  if t.closed then Ui_task.resolve (Error Cancelled)
  else if not t.loaded || not (owns_callback ~owner:t.owner callback) then
    Ui_task.resolve (Error Invalid_request)
  else match t.active with
  | Some _ -> Ui_task.resolve (Error Invalid_request)
  | None ->
      match Plugin_broker.check t.broker t.session invocation with
      | Error error -> Ui_task.resolve (Error error)
      | Ok () ->
          let current = ref None in
          Ui_task.create ~cancel:(fun () ->
            Option.iter (fun call -> finish t call (Error Cancelled)) !current)
            (fun ~resolve ~reject:_ ->
              let call = { invocation; read_only; resolve; jobs = [] } in
              current := Some call;
              t.active <- Some call;
              match native_start t.handle (callback_slot callback) with
              | 0 -> ()
              | code ->
                  finish t call (Error (error_of_code (code - 1)));
                  close t)

let invoke_command = invoke ~read_only:false

let invoke_read_only t invocation callback =
  Ui_task.bind (invoke ~read_only:true t invocation callback)
    (fun result -> Ui_task.resolve (Result.map (fun _ -> ()) result))

let serve t call request operation payload =
  let decoded =
    if operation <> 9 then decode_request ~operation payload
    else match payload with
      | Json.Array [|descriptor; Json.Number slot|]
        when Float.is_finite slot && Float.floor slot = slot && slot >= 1. && slot <= 32.
             && native_has_callback t.handle (int_of_float slot) ->
          Result.bind (command_descriptor descriptor) (fun descriptor ->
            Result.map (fun callback -> Register_editor_command (descriptor, callback))
              (command_callback_id ~owner:t.owner ~slot:(int_of_float slot)))
      | _ -> Error Invalid_request in
  let task = match decoded with
    | Ok decoded -> Plugin_broker.dispatch t.broker t.session call.invocation decoded
    | Error error -> Ui_task.resolve (Error error) in
  let job = Ui_task.bind task (fun result ->
    if is_active t call then begin
      match Plugin_broker.check t.broker t.session call.invocation with
      | Error error -> finish t call (Error error)
      | Ok () ->
          let success, value = match result with
            | Ok reply -> true, reply_value reply
            | Error error -> false, Json.String (error_name error) in
          native_complete t.handle request success value
    end;
    Ui_task.resolve ()) in
  let job = Ui_task.catch job (fun error ->
    finish t call (Error (match error with Ui_task.Cancelled -> Cancelled | _ -> Runtime_failure));
    Ui_task.resolve ()) in
  call.jobs <- job :: call.jobs

let pump t =
  match t.active with
  | None -> ()
  | Some call ->
        match Plugin_broker.check t.broker t.session call.invocation with
        | Error error -> finish t call (Error error)
        | Ok () ->
            match native_poll t.handle with
            | Waiting -> ()
            | Host_request (request, operation, payload) -> serve t call request operation payload
            | Finished value ->
                let result = Result.bind (decode_program value) (fun program ->
                  if call.read_only && actions program <> [] then Error Permission_denied
                  else Plugin_broker.accept_program t.broker t.session call.invocation program) in
                finish t call result
            | Failed code -> finish t call (Error (error_of_code code)); close t
