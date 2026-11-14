open Plugin_protocol

type services = {
  get_editing_context : unit -> (editing_context, error) result Ui_task.t;
  current : unit -> bool;
}
type read_services = {
  editing_state : unit -> (editing_context option, error) result Ui_task.t;
  current_block : unit -> (entity option, error) result Ui_task.t;
  current_page : unit -> (page_result, error) result Ui_task.t;
  get_block : identity -> (entity option, error) result Ui_task.t;
  get_block_tree : identity -> (entity option, error) result Ui_task.t;
  get_page : identity -> (entity option, error) result Ui_task.t;
  page_linked_references : identity -> ((entity * entity list) list option, error) result Ui_task.t;
  sibling_block : sibling_direction -> identity -> (entity option, error) result Ui_task.t;
  block_properties : identity -> (Json.t, error) result Ui_task.t;
  page_blocks_tree : identity -> (entity list, error) result Ui_task.t;
  block_children : identity -> (entity list, error) result Ui_task.t;
  query : query -> (Json.t, error) result Ui_task.t;
  log : log_level -> string -> (unit, error) result Ui_task.t;
}
type write_services = {
  apply : check:(unit -> (unit, error) result) -> mutation -> (reply, error) result Ui_task.t;
}
type t = { identity : unit ref }
type session = {
  broker : t;
  plugin : plugin_id;
  capabilities : capability list;
  mutable closed : bool;
  mutable invocations : invocation list;
  mutable registering : bool;
  mutable commands : (command_descriptor * callback_id) list;
}
and invocation = {
  session : session;
  services : services;
  reads : read_services option;
  writes : write_services option;
  mutable retired : bool;
  mutable calls : int;
  mutable diagnostic_bytes : int;
  mutable cancel_hooks : (unit -> unit) list;
}

let create () = { identity = ref () }
let require_owner t session =
  if t.identity != session.broker.identity then invalid_arg "Foreign plugin session"

let open_session broker plugin capabilities =
  { broker; plugin; capabilities; closed = false; invocations = [];
    registering = true; commands = [] }

let session_current t session =
  require_owner t session;
  not session.closed

let activate_commands t session =
  require_owner t session;
  if session.closed then Error Cancelled
  else if not session.registering then Error Invalid_request
  else begin session.registering <- false; Ok () end

let commands t session =
  require_owner t session;
  if session.closed || session.registering then [] else List.map fst session.commands

let command_callback t session ~key =
  require_owner t session;
  if session.closed then Error Cancelled
  else if not (List.mem Editor_command session.capabilities) then Error Permission_denied
  else if session.registering then Error Invalid_request
  else match List.find_opt (fun (descriptor, _) -> command_key descriptor = key) session.commands with
    | Some (_, callback) -> Ok callback
    | None -> Error Invalid_request

let begin_invocation ?reads ?writes t session services =
  require_owner t session;
  if session.closed then invalid_arg "Closed plugin session";
  let invocation = { session; services; reads; writes; retired = false; calls = 0;
                     diagnostic_bytes = 0; cancel_hooks = [] } in
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

let required_capabilities = function
  | Get_plugin_info | Log _ -> []
  | Get_editing_context | Get_editing_state -> [Editor_read]
  | Get_current_block | Get_current_page -> [Editor_read; Graph_read]
  | Get_block _ | Get_block_tree _ | Get_page_linked_references _ | Get_page _ | Get_sibling_block _ | Get_block_properties _
  | Get_page_blocks_tree _ | Get_block_children _ -> [Graph_read]
  | Mutate _ -> [Graph_write]
  | Datascript_query _ -> [Graph_read; Db_query]
  | Register_editor_command _ -> [Editor_command]

let service t invocation request =
  let map task f = Ui_task.bind task (fun result -> Ui_task.resolve (Result.map f result)) in
  match request with
  | Get_editing_context ->
      map (invocation.services.get_editing_context ()) (fun value -> Editing_context value)
  | Get_plugin_info -> Ui_task.resolve (Ok (Plugin_info
        (invocation.session.plugin, invocation.session.capabilities)))
  | Mutate mutation ->
      if invocation.session.registering then Ui_task.resolve (Error Unsupported)
      else (match invocation.writes with
        | None -> Ui_task.resolve (Error Unsupported)
        | Some writes -> writes.apply
            ~check:(fun () -> check t invocation.session invocation) mutation)
  | Register_editor_command (descriptor, callback) ->
      let session = invocation.session in
      let result =
        if not session.registering then Error Unsupported
        else if List.exists (fun (existing, _) -> command_key existing = command_key descriptor)
                  session.commands then Error Invalid_request
        else if List.length session.commands >= max_calls then Error Resource_limit
        else begin
          session.commands <- session.commands @ [descriptor, callback];
          Ok Editor_command_registered
        end in
      Ui_task.resolve result
  | request ->
      match invocation.reads with
      | None -> Ui_task.resolve (Error Unsupported)
      | Some reads ->
          match request with
          | Get_editing_state -> map (reads.editing_state ()) (fun value -> Editing_state value)
          | Get_current_block -> map (reads.current_block ()) (fun value -> Block value)
          | Get_current_page -> map (reads.current_page ()) (fun value -> Current_page value)
          | Get_block identity -> map (reads.get_block identity) (fun value -> Block value)
          | Get_block_tree identity -> map (reads.get_block_tree identity) (fun value -> Block value)
          | Get_page identity -> map (reads.get_page identity) (fun value -> Page value)
          | Get_block_properties identity -> map (reads.block_properties identity) (fun value -> Properties value)
          | Get_page_blocks_tree identity -> map (reads.page_blocks_tree identity) (fun value -> Blocks value)
          | Get_block_children identity -> map (reads.block_children identity) (fun value -> Blocks value)
          | Get_page_linked_references identity ->
              map (reads.page_linked_references identity) (fun value -> Page_linked_references value)
          | Get_sibling_block (direction, identity) ->
              map (reads.sibling_block direction identity) (fun value -> Block value)
          | Datascript_query query -> map (reads.query query) (fun value -> Query_result value)
          | Log (level, text) ->
              invocation.diagnostic_bytes <- invocation.diagnostic_bytes + String.length text;
              if invocation.diagnostic_bytes > 8192 then Ui_task.resolve (Error Resource_limit)
              else map (reads.log level text) (fun () -> Logged)
          | Get_editing_context | Get_plugin_info | Register_editor_command _ | Mutate _ -> assert false

let dispatch t session invocation request =
  match check t session invocation with
  | Error error -> Ui_task.resolve (Error error)
  | Ok () when not (List.for_all (fun capability -> List.mem capability session.capabilities)
                    (required_capabilities request)) ->
      Ui_task.resolve (Error Permission_denied)
  | Ok () when invocation.calls >= max_calls -> Ui_task.resolve (Error Resource_limit)
  | Ok () ->
      invocation.calls <- invocation.calls + 1;
      let request_task = service t invocation request in
      let task = Ui_task.bind request_task (fun result ->
        Ui_task.resolve (match check t session invocation, result with
          | Error error, _ | Ok (), Error error -> Error error
          | Ok (), Ok reply ->
              Result.map (fun () -> reply) (validate_value (reply_value reply)))) in
      invocation.cancel_hooks <-
        (fun () -> Ui_task.cancel task; Ui_task.cancel request_task) :: invocation.cancel_hooks;
      task

let get_sibling_block t session invocation ~direction identity =
  Ui_task.bind (dispatch t session invocation (Get_sibling_block (direction, identity)))
    (function
      | Ok (Block block) -> Ui_task.resolve (Ok block)
      | Error error -> Ui_task.resolve (Error error)
      | Ok _ -> invalid_arg "Unexpected sibling block reply")

let get_block_tree t session invocation identity =
  Ui_task.bind (dispatch t session invocation (Get_block_tree identity)) (function
    | Ok (Block block) -> Ui_task.resolve (Ok block)
    | Error error -> Ui_task.resolve (Error error)
    | Ok _ -> invalid_arg "Unexpected block tree reply")

let get_page_linked_references t session invocation identity =
  Ui_task.bind (dispatch t session invocation (Get_page_linked_references identity)) (function
    | Ok (Page_linked_references groups) -> Ui_task.resolve (Ok groups)
    | Error error -> Ui_task.resolve (Error error)
    | Ok _ -> invalid_arg "Unexpected page references reply")

let accept_program t session invocation program =
  match check t session invocation with
  | Error error -> Error error
  | Ok () when not (List.mem Editor_command session.capabilities)
               && (actions program <> [] || Option.is_none invocation.reads) -> Error Permission_denied
  | Ok () -> cancel t invocation; Ok program

let close_session t session =
  require_owner t session;
  if not session.closed then begin
    session.closed <- true;
    session.commands <- [];
    List.iter (cancel t) session.invocations
  end
