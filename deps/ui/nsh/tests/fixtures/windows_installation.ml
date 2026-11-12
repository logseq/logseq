(* Compile against the existing worker node_process_stubs.c, not a mock.
   Two copies can hold the same product presence across different executable
   paths. Closing one stdin must not release the other process's presence. *)
external register : unit -> unit = "caml_logseq_installation_admission"
external protocol : unit -> string = "caml_logseq_installation_protocol"

let () =
  if Sys.os_type <> "Win32" then failwith "Native Windows is required";
  if Array.length Sys.argv = 2 && Sys.argv.(1) = "--installation-admission-protocol" then
    print_endline (protocol ())
  else begin
    register ();
    print_endline "ACTIVE";
    flush stdout;
    (try ignore (read_line ()) with End_of_file -> ())
  end
