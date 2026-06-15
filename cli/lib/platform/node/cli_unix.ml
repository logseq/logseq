type error = EAGAIN | EWOULDBLOCK | ETIMEDOUT | ESRCH | EPERM
type access_permission = R_OK | W_OK
type open_flag = O_RDWR
type file_descr = int
type stats = { st_size : int; st_mtime : float }
type process_result = { status : int; stdout : string; stderr : string }
type mkdir_result = Created | Already_exists

exception Cli_unix_error of error * string * string

module Fs = struct
  type mkdir_options
  type rm_options
  type stat

  external mkdir_options : mode:int -> unit -> mkdir_options = "" [@@mel.obj]

  external rm_options : recursive:bool -> force:bool -> unit -> rm_options = ""
  [@@mel.obj]

  external mkdir_sync : string -> mkdir_options -> unit = "mkdirSync"
  [@@mel.module "fs"]

  external stat_sync : string -> stat = "statSync" [@@mel.module "fs"]

  external read_fd_utf8_sync : int -> (_[@mel.as "utf8"]) -> string
    = "readFileSync"
  [@@mel.module "fs"]

  external copy_file_sync : string -> string -> unit = "copyFileSync"
  [@@mel.module "fs"]

  external rm_sync : string -> rm_options -> unit = "rmSync" [@@mel.module "fs"]
  external chmod_sync : string -> int -> unit = "chmodSync" [@@mel.module "fs"]

  external access_sync : string -> int -> unit = "accessSync"
  [@@mel.module "fs"]

  external open_sync : string -> string -> int = "openSync" [@@mel.module "fs"]
  external close_sync : int -> unit = "closeSync" [@@mel.module "fs"]
  external mkdtemp_sync : string -> string = "mkdtempSync" [@@mel.module "fs"]
  external size : stat -> int = "size" [@@mel.get]
  external mtime_ms : stat -> float = "mtimeMs" [@@mel.get]
  external is_directory : stat -> bool = "isDirectory" [@@mel.send]
end

module Os = struct
  external hostname : unit -> string = "hostname" [@@mel.module "os"]
  external tmpdir : unit -> string = "tmpdir" [@@mel.module "os"]
end

module Process = struct
  type writable

  external pid : int = "pid" [@@mel.module "process"]
  external stdout : writable = "stdout" [@@mel.module "process"]
  external kill : int -> int -> unit = "kill" [@@mel.module "process"]
  external write : writable -> string -> bool = "write" [@@mel.send]
end

module Child_process = struct
  type spawn_options
  type spawn_sync_options
  type child
  type spawn_result

  external spawn_options :
    ?detached:bool ->
    ?stdio:Js.Json.t array ->
    ?env:string Js.Dict.t ->
    ?shell:bool ->
    unit ->
    spawn_options = ""
  [@@mel.obj]

  external spawn_sync_options :
    ?encoding:string ->
    ?env:string Js.Dict.t ->
    ?shell:bool ->
    unit ->
    spawn_sync_options = ""
  [@@mel.obj]

  external spawn : string -> string array -> spawn_options -> child = "spawn"
  [@@mel.module "child_process"]

  external spawn_sync :
    string -> string array -> spawn_sync_options -> spawn_result = "spawnSync"
  [@@mel.module "child_process"]

  external pid : child -> int Js.nullable = "pid" [@@mel.get]
  external unref : child -> unit = "unref" [@@mel.send]
  external status : spawn_result -> int Js.nullable = "status" [@@mel.get]
  external stdout : spawn_result -> string Js.nullable = "stdout" [@@mel.get]
  external stderr : spawn_result -> string Js.nullable = "stderr" [@@mel.get]
  external error : spawn_result -> Js.Exn.t Js.nullable = "error" [@@mel.get]
end

module Atomics_sleep = struct
  type shared_array_buffer
  type int32_array

  external make_shared_array_buffer : int -> shared_array_buffer
    = "SharedArrayBuffer"
  [@@mel.new]

  external make_int32_array : shared_array_buffer -> int32_array = "Int32Array"
  [@@mel.new]

  external wait : int32_array -> int -> int -> int -> string = "wait"
  [@@mel.scope "Atomics"]

  let buffer = make_int32_array (make_shared_array_buffer 4)
  let sleep_ms ms = ignore (wait buffer 0 0 ms : string)
end

external error_code : Js.Exn.t -> string option = "code" [@@mel.get]

let js_error_message exn =
  match Js.Exn.asJsExn exn with
  | Some error ->
      Option.value (Js.Exn.message error) ~default:(Printexc.to_string exn)
  | None -> Printexc.to_string exn

let js_error_code exn =
  match Js.Exn.asJsExn exn with Some error -> error_code error | None -> None

let unix_error_of_code = function
  | Some "EAGAIN" -> EAGAIN
  | Some "EWOULDBLOCK" -> EWOULDBLOCK
  | Some "ETIMEDOUT" -> ETIMEDOUT
  | Some ("ENOENT" | "ESRCH") -> ESRCH
  | Some ("EACCES" | "EPERM") -> EPERM
  | _ -> EPERM

let raise_error ?error op detail exn =
  let detail =
    let message = js_error_message exn in
    if String.trim message = "" then detail else message
  in
  let error =
    Option.value error ~default:(unix_error_of_code (js_error_code exn))
  in
  raise (Cli_unix_error (error, op, detail))

let run_unit op detail fn = try fn () with exn -> raise_error op detail exn

let mkdir path perm =
  run_unit "mkdir" path (fun () ->
      Fs.mkdir_sync path (Fs.mkdir_options ~mode:perm ()))

let rmdir path = run_unit "rmdir" path (fun () -> Node.Fs.rmdirSync path)

let mkdir_exclusive path perm =
  try
    Fs.mkdir_sync path (Fs.mkdir_options ~mode:perm ());
    Created
  with exn -> (
    match js_error_code exn with
    | Some "EEXIST" -> Already_exists
    | _ -> raise_error "mkdir" path exn)

let file_exists = Node.Fs.existsSync

let is_directory path =
  try Fs.is_directory (Fs.stat_sync path) with _ -> false

let readdir path =
  try Node.Fs.readdirSync path with exn -> raise_error "readdir" path exn

let rec mkdir_p path =
  if path = "" || path = Filename.dirname path || file_exists path then ()
  else (
    mkdir_p (Filename.dirname path);
    match mkdir_exclusive path 0o755 with Created | Already_exists -> ())

let write_text_file path content =
  run_unit "write" path (fun () -> Node.Fs.writeFileAsUtf8Sync path content)

let read_text_file path =
  try Node.Fs.readFileAsUtf8Sync path with exn -> raise_error "read" path exn

let read_stdin_all () =
  try Fs.read_fd_utf8_sync 0 with exn -> raise_error "read" "stdin" exn

let write_binary_file path content =
  run_unit "write" path (fun () -> Node.Fs.writeFileSync path content `latin1)

let read_binary_file path =
  try Node.Fs.readFileSync path `latin1
  with exn -> raise_error "read" path exn

let copy_file source destination =
  run_unit "copy" source (fun () -> Fs.copy_file_sync source destination)

let remove_tree path =
  run_unit "rm" path (fun () ->
      Fs.rm_sync path (Fs.rm_options ~recursive:true ~force:true ()))

let rename source destination =
  run_unit "rename" source (fun () -> Node.Fs.renameSync source destination)

let getpid () = Process.pid

let process_running pid =
  pid > 0
  &&
    try
      Process.kill pid 0;
      true
    with exn -> (
      match js_error_code exn with Some "ESRCH" -> false | _ -> true)

let chmod path perm = run_unit "chmod" path (fun () -> Fs.chmod_sync path perm)

let access path permissions =
  let flag =
    List.fold_left
      (fun acc -> function R_OK -> acc lor 4 | W_OK -> acc lor 2)
      0 permissions
  in
  try Fs.access_sync path flag
  with _ ->
    if file_exists path then raise (Cli_unix_error (EPERM, "access", path))
    else raise (Cli_unix_error (ESRCH, "access", path))

let stat path =
  try
    let stat = Fs.stat_sync path in
    { st_size = Fs.size stat; st_mtime = Fs.mtime_ms stat /. 1000. }
  with exn -> raise_error "stat" path exn

let environment () =
  Node.Process.process##env |> Js.Dict.entries
  |> Array.map (fun (key, value) -> key ^ "=" ^ value)

let gethostname () = try Os.hostname () with _ -> ""
let openfile _path _flags _perm = 0
let close _fd = ()

let command_args argv =
  match Array.to_list argv with
  | "env" :: command :: args -> (command, args)
  | command :: args -> (command, args)
  | [] ->
      raise (Cli_unix_error (EPERM, "create_process_env", "missing command"))

let copy_env env =
  let result = Js.Dict.empty () in
  Node.Process.process##env |> Js.Dict.entries
  |> Array.iter (fun (key, value) -> Js.Dict.set result key value);
  Array.iter
    (fun entry ->
      match String.index_opt entry '=' with
      | None -> ()
      | Some index ->
          Js.Dict.set result (String.sub entry 0 index)
            (String.sub entry (index + 1) (String.length entry - index - 1)))
    env;
  result

let stdio_ignore =
  [|
    Js.Json.string "ignore"; Js.Json.string "ignore"; Js.Json.string "ignore";
  |]

let spawn_detached command args env =
  let child =
    Child_process.spawn command (Array.of_list args)
      (Child_process.spawn_options ~detached:true ~stdio:stdio_ignore
         ~env:(copy_env env) ~shell:false ())
  in
  Child_process.unref child;
  Child_process.pid child |> Js.Nullable.toOption |> Option.value ~default:0

let windows_verbatim_spawn_options env : Child_process.spawn_options =
  let make : string Js.Dict.t -> Js.Json.t array -> Child_process.spawn_options =
    [%mel.raw
      {|
function (env, stdio) {
  return {
    detached: true,
    stdio: stdio,
    env: env,
    shell: false,
    windowsVerbatimArguments: true
  };
}
|}]
  in
  make (copy_env env) stdio_ignore

let spawn_detached_windows_verbatim command args env =
  let child =
    Child_process.spawn command (Array.of_list args)
      (windows_verbatim_spawn_options env)
  in
  Child_process.unref child;
  Child_process.pid child |> Js.Nullable.toOption |> Option.value ~default:0

let create_process_env _prog argv env _stdin _stdout _stderr =
  let command, args = command_args argv in
  try spawn_detached command args env
  with exn -> raise_error "create_process_env" command exn

let nullable_string_default value =
  value |> Js.Nullable.toOption |> Option.value ~default:""

let run_process_capture command args env =
  let result =
    Child_process.spawn_sync command (Array.of_list args)
      (Child_process.spawn_sync_options ~encoding:"utf8" ~env:(copy_env env)
         ~shell:false ())
  in
  let status =
    result |> Child_process.status |> Js.Nullable.toOption
    |> Option.value ~default:1
  in
  let stderr =
    match result |> Child_process.error |> Js.Nullable.toOption with
    | Some error ->
        Option.value (Js.Exn.message error)
          ~default:(nullable_string_default (Child_process.stderr result))
    | None -> nullable_string_default (Child_process.stderr result)
  in
  {
    status;
    stdout = nullable_string_default (Child_process.stdout result);
    stderr;
  }

let read_text_file_default path =
  try Node.Fs.readFileAsUtf8Sync path with _ -> ""

let contains_substring ~needle haystack =
  let needle_len = String.length needle in
  let haystack_len = String.length haystack in
  let rec loop index =
    if needle_len = 0 then true
    else if index + needle_len > haystack_len then false
    else if String.sub haystack index needle_len = needle then true
    else loop (index + 1)
  in
  loop 0

let find_session_line text =
  text |> String.split_on_char '\n'
  |> List.find_opt (fun line ->
      let lower = String.lowercase_ascii line in
      contains_substring ~needle:"session" lower
      || contains_substring ~needle:"thread" lower)

let start_process_capture_session_line command args env =
  let tmp_dir =
    Fs.mkdtemp_sync (Node.Path.join [| Os.tmpdir (); "logseq-cli-session-" |])
  in
  let stdout_path = Node.Path.join [| tmp_dir; "stdout.log" |] in
  let stderr_path = Node.Path.join [| tmp_dir; "stderr.log" |] in
  let stdout_fd = Fs.open_sync stdout_path "a" in
  let stderr_fd = Fs.open_sync stderr_path "a" in
  let child =
    try
      Child_process.spawn command (Array.of_list args)
        (Child_process.spawn_options ~detached:true
           ~stdio:
             [|
               Js.Json.string "ignore";
               Js.Json.number (float_of_int stdout_fd);
               Js.Json.number (float_of_int stderr_fd);
             |]
           ~env:(copy_env env) ~shell:false ())
    with exn ->
      (try Fs.close_sync stdout_fd with _ -> ());
      (try Fs.close_sync stderr_fd with _ -> ());
      raise_error "spawn" command exn
  in
  (try Fs.close_sync stdout_fd with _ -> ());
  (try Fs.close_sync stderr_fd with _ -> ());
  let pid =
    Child_process.pid child |> Js.Nullable.toOption |> Option.value ~default:0
  in
  let deadline = Js.Date.now () +. 30_000. in
  let rec loop last_stdout =
    let stdout = read_text_file_default stdout_path in
    match find_session_line stdout with
    | Some line ->
        Child_process.unref child;
        {
          status = 0;
          stdout = line;
          stderr = read_text_file_default stderr_path;
        }
    | None when Js.Date.now () >= deadline ->
        Child_process.unref child;
        {
          status = 124;
          stdout = (if stdout = "" then last_stdout else stdout);
          stderr =
            (let stderr = read_text_file_default stderr_path in
             if String.trim stderr = "" then "timed out waiting for session id"
             else stderr);
        }
    | None when pid <= 0 || not (process_running pid) ->
        { status = 1; stdout; stderr = read_text_file_default stderr_path }
    | None ->
        Atomics_sleep.sleep_ms 50;
        loop stdout
  in
  loop ""

let kill pid signal =
  try Process.kill pid signal
  with _ -> raise (Cli_unix_error (ESRCH, "kill", string_of_int pid))

let unquote_double_quoted value =
  let len = String.length value in
  if len > 1 && value.[0] = '"' && value.[len - 1] = '"' then
    String.sub value 1 (len - 2)
  else value

let windows_start_url_command url =
  "start \"\" \"" ^ unquote_double_quoted url ^ "\""

let open_url url =
  try
    let platform = Node.Process.process##platform in
    let command, args =
      match platform with
      | "darwin" -> ("open", [ url ])
      | "linux" -> ("xdg-open", [ url ])
      | "win32" -> ("cmd.exe", [ "/d"; "/c"; windows_start_url_command url ])
      | _ -> raise (Cli_unix_error (EPERM, "open", url))
    in
    ignore
      ((if platform = "win32" then spawn_detached_windows_verbatim
        else spawn_detached)
         command args (environment ())
        : int);
    true
  with _ -> false

let write_stdout text = ignore (Process.write Process.stdout text : bool)
