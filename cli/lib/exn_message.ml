(* Text for an exception that is shown to the user, in place of
   `Printexc.to_string`, which prints constructor names and ids such as
   `Cli_unix.Cli_unix_error/1(3readENOENT...)`. *)
let to_string = function
  | Cli_unix.Cli_unix_error (_, _, detail) -> detail
  | Melange_edn_melange.Parse_error message -> "invalid EDN: " ^ message
  | Failure message -> message
  | exn -> Printexc.to_string exn
