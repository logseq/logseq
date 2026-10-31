(* The error for a file the user named that cannot be read, written or
   parsed. Any other exception stays an `exception` error. *)
let of_exn ~path exn =
  match exn with
  | Cli_unix.Cli_unix_error _ | Melange_edn_melange.Parse_error _ ->
      Error.invalid_options (path ^ ": " ^ Exn_message.to_string exn)
  | _ -> Error.exception_error exn
