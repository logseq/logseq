open Plugin_protocol

type t = {
  runtime : Quickjs_runtime.t;
  broker : Plugin_broker.t;
  session : Plugin_broker.session;
  mutable timer : int option;
  mutable busy : bool;
  mutable closed : bool;
}

let stop_timer runner =
  Option.iter Host.clear_timeout runner.timer;
  runner.timer <- None

let close runner =
  (Ui_services.get ()).assert_owner ();
  if not runner.closed then begin
    runner.closed <- true;
    stop_timer runner;
    Quickjs_runtime.close runner.runtime
  end

let current runner = not runner.closed && Plugin_broker.session_current runner.broker runner.session
let invoking runner = current runner && runner.busy
let commands runner = Plugin_broker.commands runner.broker runner.session

let owned runner task =
  Ui_task.create ~cancel:(fun () -> close runner; Ui_task.cancel task)
    (fun ~resolve ~reject ->
      ignore (Ui_task.catch
        (Ui_task.bind task (fun result -> resolve result; Ui_task.resolve ()))
        (fun error -> reject error; Ui_task.resolve ())))

let perform runner ~read_only invocation callback =
  runner.busy <- true;
  let activation =
    if read_only then Ui_task.bind
      (Quickjs_runtime.invoke_read_only runner.runtime invocation callback)
      (fun result -> Ui_task.resolve (Result.bind result (fun () -> program [])))
    else Quickjs_runtime.invoke_command runner.runtime invocation callback in
  let pending = ref true in
  Ui_task.create ~cancel:(fun () -> close runner)
    (fun ~resolve ~reject:_ ->
      let observer = Ui_task.bind activation (fun result ->
        pending := false;
        runner.busy <- false;
        stop_timer runner;
        (match result with Error _ -> close runner | Ok _ -> ());
        resolve result;
        Ui_task.resolve ()) in
      ignore (Ui_task.catch observer (fun error ->
        pending := false;
        runner.busy <- false;
        close runner;
        resolve (Error (match error with Ui_task.Cancelled -> Cancelled | _ -> Runtime_failure));
        Ui_task.resolve ()));
      let rec pump () =
        runner.timer <- None;
        if not runner.closed && !pending then begin
          Quickjs_runtime.pump runner.runtime;
          if not runner.closed && !pending then
            runner.timer <- Some (Host.set_timeout pump 1)
        end in
      pump ())

let start ~commands ~id ~grants ~source =
  (Ui_services.get ()).assert_owner ();
  let broker = Plugin_broker.create () in
  let session = Plugin_broker.open_session broker id grants in
  match Quickjs_runtime.create broker session with
  | Error error -> Plugin_broker.close_session broker session; Ui_task.resolve (Error error)
  | Ok runtime ->
      let runner = { runtime; broker; session; timer = None; busy = false; closed = false } in
      match Quickjs_runtime.load runtime ~source with
      | Error error -> close runner; Ui_task.resolve (Error error)
      | Ok callback ->
          let services, reads = Plugin_read_services.capture ~id in
          let invocation = Plugin_broker.begin_invocation ~reads broker session services in
          owned runner (Ui_task.bind (perform runner ~read_only:true invocation callback) (fun result ->
            let result = Result.bind result (fun _ ->
              if commands then Plugin_broker.activate_commands broker session else Ok ()) in
            (match result with Error _ -> close runner | Ok () -> ());
            Ui_task.resolve (Result.map (fun () -> runner) result)))

let start_read ~id ~grants ~source =
  if List.mem Editor_command grants then Ui_task.resolve (Error Permission_denied)
  else start ~commands:false ~id ~grants ~source

let start_commands ~id ~grants ~source =
  if not (List.mem Editor_command grants) then Ui_task.resolve (Error Permission_denied)
  else start ~commands:true ~id ~grants ~source

let invoke runner ~key services reads =
  (Ui_services.get ()).assert_owner ();
  if not (current runner) then Ui_task.resolve (Error Cancelled)
  else if runner.busy then Ui_task.resolve (Error Invalid_request)
  else match Plugin_broker.command_callback runner.broker runner.session ~key with
    | Error error -> Ui_task.resolve (Error error)
    | Ok callback ->
        let invocation = Plugin_broker.begin_invocation ~reads runner.broker runner.session services in
        perform runner ~read_only:false invocation callback
