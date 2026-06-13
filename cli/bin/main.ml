open Cli_effect.Infix

let cli_argv () =
  let process_argv = Cli_platform.argv () in
  let len = Array.length process_argv in
  let args = if len <= 2 then [||] else Array.sub process_argv 2 (len - 2) in
  Array.to_list args

let cli_env () =
  Cli_unix.environment () |> Array.to_list
  |> List.filter_map (fun item ->
      match String.index_opt item '=' with
      | None -> None
      | Some index ->
          let key = String.sub item 0 index in
          let value =
            String.sub item (index + 1) (String.length item - index - 1)
          in
          Some (key, value))

let cli_input () =
  {
    Cli.argv = cli_argv ();
    env = cli_env ();
    cwd = Sys.getcwd ();
    stdin = None;
  }

let finalize_error err = Cli.final_effect (Cli.make_error_state err)

let run app input =
  let raw = Cli.make_raw_argv_state app input in
  match Cli.parse_args app raw with
  | Error err -> finalize_error err
  | Ok parsed -> (
      Cli.resolve_config app parsed >>= function
      | Error err -> finalize_error err
      | Ok resolved -> (
          Cli.build_action app resolved >>= function
          | Error err -> finalize_error err
          | Ok built -> (
              Cli.execute_action app built >>= function
              | Error err -> finalize_error err
              | Ok executed -> Cli.final_effect executed)))

let () =
  let complete code = if code <> 0 then exit code in
  let fail exn =
    prerr_endline (Printexc.to_string exn);
    exit 1
  in
  let task =
    try
      let app = Cli.make_app_context () in
      run app (cli_input ())
    with exn -> Cli_effect.error exn
  in
  Cli_effect.on_any task complete fail
