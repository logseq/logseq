module Json = Yojson.Basic.Util

let text name value = Json.member name value |> Json.to_string
let mutex = Mutex.create ()
let locked f = Mutex.lock mutex; Fun.protect ~finally:(fun () -> Mutex.unlock mutex) f
let rec mkdir path =
  if not (Sys.file_exists path) then (mkdir (Filename.dirname path); Unix.mkdir path 0o700)
  else if (Unix.lstat path).Unix.st_kind <> Unix.S_DIR then failwith "Expected a native graph directory"

let root () = match Sys.getenv_opt "LOGSEQ_WEB_DESKTOP_ROOT" with
  | Some root when not (Filename.is_relative root) -> root
  | Some _ -> invalid_arg "LOGSEQ_WEB_DESKTOP_ROOT must be absolute"
  | None -> Filename.concat (Sys.getenv "HOME") "Library/Application Support/com.logseq.desktop.web/native"
let graphs () = Filename.concat (root ()) "graphs"
let graph_key repo =
  match Graph_dir.repo_to_encoded_graph_dir_name repo with
  | Some key when key <> "." && key <> ".." && key <> "backup" && key <> "Unlinked graphs" -> key
  | Some _ | None -> invalid_arg "Invalid native graph name"
let graph_path repo = Filename.concat (graphs ()) (graph_key repo)

let uuid () =
  let bytes = Mirage_crypto_rng.generate 16 |> Ohex.encode in
  String.sub bytes 0 8 ^ "-" ^ String.sub bytes 8 4 ^ "-" ^ String.sub bytes 12 4
  ^ "-" ^ String.sub bytes 16 4 ^ "-" ^ String.sub bytes 20 12

let create_graph repo =
  mkdir (graphs ());
  let canonical = Unix.realpath (graphs ()) in
  let store = Digestif.SHA256.(to_hex (digest_string canonical)) in
  let lifecycle = Filename.concat (Filename.concat (root ()) ".graph-lifecycle") store in
  let state_dir = Filename.concat lifecycle (graph_key repo) in
  mkdir (graph_path repo); mkdir state_dir;
  let state = Filename.concat state_dir "state.json" in
  if not (Sys.file_exists state) then (
    let output = open_out_gen [Open_wronly; Open_creat; Open_excl] 0o600 state in
    Fun.protect ~finally:(fun () -> close_out output) (fun () ->
      output_string output (Yojson.Basic.to_string (`Assoc [
        "generation", `String (uuid ()); "phase", `String "available";
        "workers", `List []; "owner", `Null]))))

type worker = {pid : int; port : int}
let workers : (string, worker) Hashtbl.t = Hashtbl.create 4
let events = Queue.create ()
let event_bytes = ref 0
let stream_error = ref None
let event_mutex = Mutex.create ()
let with_events f = Mutex.lock event_mutex; Fun.protect ~finally:(fun () -> Mutex.unlock event_mutex) f

let queue_event payload = with_events (fun () ->
  if Queue.length events >= 4096 || !event_bytes + String.length payload > 33_554_432 then
    stream_error := Some "Native database event queue exceeded its limit"
  else (Queue.add payload events; event_bytes := !event_bytes + String.length payload))

let connection ?(stream = false) port path method_ body =
  let fd = Unix.socket Unix.PF_INET Unix.SOCK_STREAM 0 in
  Unix.set_close_on_exec fd;
  if not stream then Unix.setsockopt_float fd Unix.SO_RCVTIMEO 60.;
  Unix.setsockopt_float fd Unix.SO_SNDTIMEO 15.;
  try
    Unix.connect fd (Unix.ADDR_INET (Unix.inet_addr_loopback, port));
    let input = Unix.in_channel_of_descr fd in
    let output = Unix.out_channel_of_descr (Unix.dup fd) in
    Printf.fprintf output "%s %s HTTP/1.1\r\nHost: 127.0.0.1:%d\r\nContent-Type: application/json\r\nContent-Length: %d\r\nConnection: close\r\n\r\n%s"
      method_ path port (String.length body) body;
    flush output;
    let status = match String.split_on_char ' ' (input_line input) with
      | _ :: status :: _ -> int_of_string status | _ -> failwith "Invalid native HTTP status" in
    let rec headers chunked =
      let line = input_line input |> String.trim |> String.lowercase_ascii in
      if line = "" then chunked else headers (chunked || line = "transfer-encoding: chunked") in
    let chunked = headers false in
    input, output, status, chunked
  with error -> Unix.close fd; raise error

let body input chunked =
  let buffer = Buffer.create 4096 in
  let add length =
    if length < 0 || length > 16_777_216 - Buffer.length buffer then failwith "Native HTTP response is too large";
    Buffer.add_string buffer (really_input_string input length) in
  if chunked then (
    let rec chunks () =
      let line = input_line input |> String.trim |> String.split_on_char ';' |> List.hd in
      let length = int_of_string ("0x" ^ line) in
      if length > 0 then (add length; ignore (input_line input); chunks ()) in
    chunks ())
  else (
    let bytes = Bytes.create 65536 in
    let rec read () = let count = Stdlib.input input bytes 0 (Bytes.length bytes) in
      if count > 0 then (
        if count > 16_777_216 - Buffer.length buffer then failwith "Native HTTP response is too large";
        Buffer.add_subbytes buffer bytes 0 count; read ()) in
    read ());
  Buffer.contents buffer

let request port path method_ payload =
  let input, output, status, chunked = connection port path method_ payload in
  Fun.protect ~finally:(fun () -> close_in_noerr input; close_out_noerr output) (fun () ->
    let result = body input chunked in
    if status < 200 || status >= 300 then failwith ("Native worker HTTP " ^ string_of_int status ^ ": " ^ result);
    result)

let start_events worker =
  ignore (Thread.create (fun () ->
    try
      let input, output, status, _ = connection ~stream:true worker.port "/v1/events" "GET" "" in
      Fun.protect ~finally:(fun () -> close_in_noerr input; close_out_noerr output) (fun () ->
        if status <> 200 then failwith "Native event stream was refused";
        while true do
          let line = input_line input |> String.trim in
          if String.starts_with ~prefix:"data:" line then (
            let data = String.sub line 5 (String.length line - 5) |> String.trim |> Yojson.Basic.from_string in
            queue_event (text "payload" data))
        done)
    with error -> with_events (fun () -> stream_error := Some (Printexc.to_string error))) ())

let port_for_pid pid =
  let path = Filename.concat (root ()) "server-list" in
  if not (Sys.file_exists path) then None else
  let input = open_in path in
  Fun.protect ~finally:(fun () -> close_in input) (fun () ->
    let rec find () = match input_line input with
      | line -> (match String.split_on_char ' ' (String.trim line) with
          | [process; port] when int_of_string_opt process = Some pid -> int_of_string_opt port
          | _ -> find ())
      | exception End_of_file -> None in
    find ())

let spawn repo =
  let binary = Filename.concat (Filename.dirname Sys.executable_name) "logseq-db-worker" in
  let log = Unix.openfile (Filename.concat (root ()) (graph_key repo ^ ".log"))
      [Unix.O_WRONLY; Unix.O_CREAT; Unix.O_APPEND] 0o600 in
  let null = Unix.openfile "/dev/null" [Unix.O_RDONLY] 0 in
  let pid = Fun.protect ~finally:(fun () -> Unix.close log; Unix.close null) (fun () ->
    Unix.create_process binary [|binary; "--root-dir"; root (); "--graphs-dir"; graphs ();
      "--repo"; repo; "--owner-source"; "electron"|] null log log) in
  let deadline = Unix.gettimeofday () +. 20. in
  let rec ready () =
    match Unix.waitpid [Unix.WNOHANG] pid with
    | 0, _ -> (match port_for_pid pid with
        | Some port ->
            let health = request port "/healthz" "GET" "" |> Yojson.Basic.from_string in
            if text "repo" health <> repo || text "status" health <> "ready" then failwith "Unexpected native worker identity";
            {pid; port}
        | None when Unix.gettimeofday () < deadline -> Thread.delay 0.01; ready ()
        | None -> failwith "Native database worker startup timed out")
    | _ -> failwith "Native database worker exited during startup" in
  try ready () with error -> (try Unix.kill pid Sys.sigterm with Unix.Unix_error _ -> ()); raise error

let open_graph encoded = locked (fun () ->
  let request = Yojson.Basic.from_string encoded in
  let repo = text "repo" request in
  let creating = Json.member "create" request |> Json.to_bool in
  if creating then create_graph repo
  else if not (Sys.file_exists (graph_path repo)) then failwith "Native graph does not exist"
  else create_graph repo;
  if not (Hashtbl.mem workers repo) then (
    let worker = spawn repo in Hashtbl.add workers repo worker; start_events worker))

let invoke encoded =
  let input = Yojson.Basic.from_string encoded in
  let repo = text "repo" input and method_ = text "method" input in
  if not (String.starts_with ~prefix:"thread-api/" method_) then invalid_arg "Invalid native worker method";
  let worker = locked (fun () -> Hashtbl.find workers repo) in
  request worker.port "/v1/invoke" "POST" (Yojson.Basic.to_string (`Assoc [
    "method", `String method_; "argsTransit", `String (text "argsTransit" input)]))

let list_graphs () =
  mkdir (graphs ());
  Sys.readdir (graphs ()) |> Array.to_list |> List.filter_map (fun name ->
    if (Unix.lstat (Filename.concat (graphs ()) name)).Unix.st_kind <> Unix.S_DIR then None
    else match Graph_dir.decode_canonical_graph_dir_key name with
      | Some decoded when decoded <> "backup" && decoded <> "Unlinked graphs" -> Some (`String ("logseq_db_" ^ decoded))
      | Some _ | None -> None)
  |> fun names -> Yojson.Basic.to_string (`List names)

let poll_events () =
  let rec wait remaining =
    let ready = with_events (fun () -> not (Queue.is_empty events) || !stream_error <> None) in
    if not ready && remaining > 0 then (Thread.delay 0.02; wait (remaining - 1)) in
  wait 150;
  with_events (fun () ->
    Option.iter failwith !stream_error;
    let length = ref 0 and result = ref [] in
    while not (Queue.is_empty events) && !length < 400_000 do
      let frame = Queue.take events in
      length := !length + String.length frame; event_bytes := !event_bytes - String.length frame;
      result := `String frame :: !result
    done;
    Yojson.Basic.to_string (`List (List.rev !result)))

let handler f request =
  try Ok (f request) with error ->
    Error (Lui_command.error Command_failed (Printexc.to_string error))

let commands () =
  mkdir (root ());
  at_exit (fun () -> Hashtbl.iter (fun _ worker ->
    (try Unix.kill worker.pid Sys.sigterm with Unix.Unix_error _ -> ());
    (try ignore (Unix.waitpid [] worker.pid) with Unix.Unix_error _ -> ())) workers);
  [ Lui_desktop_commands.handle Desktop_commands.list_graphs (handler list_graphs)
  ; Lui_desktop_commands.handle Desktop_commands.open_graph (handler open_graph)
  ; Lui_desktop_commands.handle Desktop_commands.invoke (handler invoke)
  ; Lui_desktop_commands.handle Desktop_commands.events (handler poll_events)
  ]
