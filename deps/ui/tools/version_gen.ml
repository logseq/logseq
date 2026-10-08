(* Generate the shared app version from the desktop package metadata. *)
let () =
  let package = Yojson.Basic.from_file Sys.argv.(1) in
  let version = Yojson.Basic.Util.(package |> member "version" |> to_string) in
  let output = open_out Sys.argv.(2) in
  Printf.fprintf output "let app = %S\n" version;
  close_out output
