let () =
  let files =
    Sys.readdir Sys.argv.(1) |> Array.to_list
    |> List.filter (fun name -> String.starts_with ~prefix:"test_" name && Filename.check_suffix name ".ml")
    |> List.sort String.compare
  in
  let out = open_out Sys.argv.(2) in
  output_string out "let suites = [\n";
  List.iter
    (fun file ->
       Printf.fprintf out "  (%S, %s.tests);\n"
         ("native-e2e/tests/" ^ file)
         (String.capitalize_ascii (Filename.remove_extension file)))
    files;
  output_string out "]\n";
  close_out out
