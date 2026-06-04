let () =
  let complete code = if code <> 0 then exit code in
  let fail exn =
    prerr_endline (Printexc.to_string exn);
    exit 1
  in
  let task =
    try Cli_effect.to_lwt (Cli.main_effect ()) with exn -> Lwt.fail exn
  in
  Lwt.on_any task complete fail
