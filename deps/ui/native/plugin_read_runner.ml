open Plugin_protocol

type t = {
  runtime : Quickjs_runtime.t;
  mutable timer : int option;
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

let start ~id ~grants ~source =
  (Ui_services.get ()).assert_owner ();
  if List.mem Editor_command grants then Ui_task.resolve (Error Permission_denied)
  else
    let broker = Plugin_broker.create () in
    let session = Plugin_broker.open_session broker id grants in
    match Quickjs_runtime.create broker session with
    | Error error ->
        Plugin_broker.close_session broker session;
        Ui_task.resolve (Error error)
    | Ok runtime ->
        let runner = { runtime; timer = None; closed = false } in
        match Quickjs_runtime.load runtime ~source with
        | Error error -> close runner; Ui_task.resolve (Error error)
        | Ok callback ->
            let services, reads = Plugin_read_services.capture ~id in
            let invocation = Plugin_broker.begin_invocation ~reads broker session services in
            let activation = Quickjs_runtime.invoke_read_only runtime invocation callback in
            let pending = ref true in
            Ui_task.create ~cancel:(fun () -> close runner)
              (fun ~resolve ~reject:_ ->
                let observer = Ui_task.bind activation (fun result ->
                  pending := false;
                  stop_timer runner;
                  (match result with Error _ -> close runner | Ok () -> ());
                  resolve (Result.map (fun () -> runner) result);
                  Ui_task.resolve ()) in
                ignore (Ui_task.catch observer (fun error ->
                  pending := false;
                  close runner;
                  resolve (Error (match error with
                    | Ui_task.Cancelled -> Cancelled
                    | _ -> Runtime_failure));
                  Ui_task.resolve ()));
                let rec pump () =
                  runner.timer <- None;
                  if not runner.closed && !pending then begin
                    Quickjs_runtime.pump runtime;
                    if not runner.closed && !pending then
                      runner.timer <- Some (Host.set_timeout pump 1)
                  end
                in
                pump ())
