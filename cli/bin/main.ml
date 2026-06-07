let cli_argv () =
  let process_argv = Cli_platform.argv () in
  let len = Array.length process_argv in
  let args =
    if len <= 2 then [||] else Array.sub process_argv 2 (len - 2)
  in
  Array.append [| "logseq" |] args

let () =
  let complete code = if code <> 0 then exit code in
  let fail exn =
    prerr_endline (Printexc.to_string exn);
    exit 1
  in
  let task =
    try Cli.main_effect ~argv:(cli_argv ()) () with exn -> Cli_effect.error exn
  in
  Cli_effect.on_any task complete fail
