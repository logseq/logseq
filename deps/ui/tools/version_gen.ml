(* Generate the shared app version from the desktop package metadata. *)
let revision package =
  let root = Filename.dirname (Filename.dirname package) in
  let command =
    Printf.sprintf "git -C %s rev-parse --short=9 HEAD 2>/dev/null"
      (Filename.quote root)
  in
  try
    let input = Unix.open_process_in command in
    let line = try input_line input with End_of_file -> "" in
    match Unix.close_process_in input with
    | Unix.WEXITED 0 -> String.trim line
    | _ -> ""
  with Unix.Unix_error _ -> ""

let () =
  let package = Yojson.Basic.from_file Sys.argv.(1) in
  let version = Yojson.Basic.Util.(package |> member "version" |> to_string) in
  let output = open_out Sys.argv.(2) in
  Printf.fprintf output "let app = %S\nlet revision = %S\n" version
    (revision Sys.argv.(1));
  close_out output
