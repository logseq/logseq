let check_raises_cli_unix_error name expected f =
  match f () with
  | exception Cli_unix.Cli_unix_error (actual, _, _) ->
      Alcotest.(check bool) name true (actual = expected)
  | exception exn ->
      Alcotest.failf "%s raised unexpected exception: %s" name
        (Printexc.to_string exn)
  | () -> Alcotest.failf "%s expected Cli_unix_error" name

let temp_path prefix =
  Filename.concat
    (Filename.get_temp_dir_name ())
    (prefix ^ string_of_int (Random.bits ()))

let write_file path text =
  let oc = open_out_bin path in
  Fun.protect
    ~finally:(fun () -> close_out_noerr oc)
    (fun () -> output_string oc text)

let filesystem_contract_case () =
  let dir = temp_path "logseq-cli-unix-dir-" in
  let file = Filename.concat dir "file.txt" in
  Cli_unix.mkdir dir 0o755;
  Alcotest.(check bool) "mkdir creates directory" true (Sys.is_directory dir);
  write_file file "hello";
  Cli_unix.access file [ Cli_unix.R_OK ];
  let stat = Cli_unix.stat file in
  Alcotest.(check int) "stat size" 5 stat.Cli_unix.st_size;
  Alcotest.(check bool) "stat mtime positive" true (stat.st_mtime > 0.);
  Cli_unix.chmod file 0o600;
  check_raises_cli_unix_error "access missing" Cli_unix.ESRCH (fun () ->
      Cli_unix.access (Filename.concat dir "missing") [ Cli_unix.R_OK ]);
  Sys.remove file;
  Cli_unix.rmdir dir;
  Alcotest.(check bool) "rmdir removes directory" false (Sys.file_exists dir)

let () =
  Random.self_init ();
  Alcotest.run "cli unix native"
    [
      ( "native backend",
        [
          Alcotest.test_case "filesystem contract" `Quick
            filesystem_contract_case;
        ] );
    ]
