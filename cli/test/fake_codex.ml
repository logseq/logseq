let set_timeout f ms = ignore (Js.Global.setTimeout ~f ms : Js.Global.timeoutId)
let argv_contains value = Array.exists (( = ) value) Node.Process.argv

let () =
  if argv_contains "--version" then Node.Process.exit 0;
  let marker =
    match Js.Dict.get Node.Process.process##env "AGENT_BRIDGE_TEST_MARKER" with
    | Some value -> value
    | None -> failwith "missing AGENT_BRIDGE_TEST_MARKER"
  in
  let worker_script =
    match
      Js.Dict.get Node.Process.process##env "LOGSEQ_DB_WORKER_NODE_SCRIPT"
    with
    | Some value -> value
    | None -> ""
  in
  print_endline "{\"session_id\":\"cli-live-session\"}";
  set_timeout (fun () -> print_endline "still alive after session id") 200;
  set_timeout (fun () -> Node.Fs.writeFileAsUtf8Sync marker worker_script) 500;
  set_timeout (fun () -> ()) 5000
