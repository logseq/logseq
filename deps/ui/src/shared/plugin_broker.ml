open Plugin_protocol

type services = {
  get_editing_context : unit -> (editing_context, error) result Ui_task.t;
  current : unit -> bool;
}
type t = { identity : unit ref }
type session = {
  broker : t;
  plugin : plugin_id;
  capabilities : capability list;
  mutable closed : bool;
  mutable invocations : invocation list;
}
and invocation = {
  session : session;
  services : services;
  mutable retired : bool;
  mutable calls : int;
  mutable cancel_hooks : (unit -> unit) list;
}

let create () = { identity = ref () }
let require_owner t session =
  if t.identity != session.broker.identity then invalid_arg "Foreign plugin session"

let open_session broker plugin capabilities =
  { broker; plugin; capabilities; closed = false; invocations = [] }

let begin_invocation t session services =
  require_owner t session;
  if session.closed then invalid_arg "Closed plugin session";
  let invocation = { session; services; retired = false; calls = 0; cancel_hooks = [] } in
  session.invocations <- invocation :: session.invocations;
  invocation

let check t session invocation =
  require_owner t session;
  if invocation.session != session then Error Permission_denied
  else if session.closed || invocation.retired then Error Cancelled
  else if not (invocation.services.current ()) then Error Stale_context
  else Ok ()

let cancel t invocation =
  require_owner t invocation.session;
  if not invocation.retired then begin
    invocation.retired <- true;
    invocation.session.invocations <-
      List.filter (fun live -> live != invocation) invocation.session.invocations;
    let hooks = invocation.cancel_hooks in
    invocation.cancel_hooks <- [];
    List.iter (fun hook -> hook ()) hooks
  end

let dispatch t session invocation Get_editing_context =
  match check t session invocation with
  | Error error -> Ui_task.resolve (Error error)
  | Ok () when not (List.mem Editor_read session.capabilities) ->
      Ui_task.resolve (Error Permission_denied)
  | Ok () when invocation.calls >= max_calls -> Ui_task.resolve (Error Resource_limit)
  | Ok () ->
      invocation.calls <- invocation.calls + 1;
      let service = invocation.services.get_editing_context () in
      let task = Ui_task.bind service (fun result ->
        Ui_task.resolve (match check t session invocation, result with
          | Error error, _ | Ok (), Error error -> Error error
          | Ok (), Ok context -> Ok (Editing_context context))) in
      invocation.cancel_hooks <-
        (fun () -> Ui_task.cancel task; Ui_task.cancel service) :: invocation.cancel_hooks;
      task

let accept_program t session invocation program =
  match check t session invocation with
  | Error error -> Error error
  | Ok () when not (List.mem Editor_command session.capabilities) -> Error Permission_denied
  | Ok () -> cancel t invocation; Ok program

let close_session t session =
  require_owner t session;
  if not session.closed then begin
    session.closed <- true;
    List.iter (cancel t) session.invocations
  end
