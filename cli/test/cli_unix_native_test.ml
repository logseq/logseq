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

let filesystem_case () =
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

let process_case () =
  let pid = Cli_unix.create_process_env "true" [| "true" |] [||] 0 1 2 in
  Alcotest.(check bool) "create_process_env returns pid" true (pid > 0);
  check_raises_cli_unix_error "kill missing pid" Cli_unix.ESRCH (fun () ->
      Cli_unix.kill 999_999_999 15)

let socket_case () =
  let server = Cli_unix.socket Cli_unix.PF_INET Cli_unix.SOCK_STREAM 0 in
  Cli_unix.setsockopt server Cli_unix.SO_REUSEADDR true;
  let port = 35_000 + Random.int 10_000 in
  Cli_unix.bind server (Cli_unix.ADDR_INET (Cli_unix.inet_addr_loopback, port));
  Cli_unix.listen server 1;
  let accepted = ref None in
  let server_thread =
    Thread.create
      (fun () ->
        let client, _addr = Cli_unix.accept server in
        accepted := Some client;
        let ic = Cli_unix.in_channel_of_descr client in
        let oc = Cli_unix.out_channel_of_descr client in
        let line = input_line ic in
        output_string oc (line ^ "\n");
        flush oc)
      ()
  in
  let client = Cli_unix.socket Cli_unix.PF_INET Cli_unix.SOCK_STREAM 0 in
  Cli_unix.connect client
    (Cli_unix.ADDR_INET (Cli_unix.inet_addr_loopback, port));
  let oc = Cli_unix.out_channel_of_descr client in
  let ic = Cli_unix.in_channel_of_descr client in
  output_string oc "ping\n";
  flush oc;
  Alcotest.(check string) "socket echo" "ping" (input_line ic);
  Cli_unix.shutdown client Cli_unix.SHUTDOWN_ALL;
  Cli_unix.close client;
  Thread.join server_thread;
  Option.iter Cli_unix.close !accepted;
  Cli_unix.close server

let () =
  Random.self_init ();
  Alcotest.run "cli unix native"
    [
      ( "native backend",
        [
          Alcotest.test_case "filesystem" `Quick filesystem_case;
          Alcotest.test_case "process" `Quick process_case;
          Alcotest.test_case "socket" `Quick socket_case;
        ] );
    ]
