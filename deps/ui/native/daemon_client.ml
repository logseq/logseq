(* Native twin of core/daemon_client.ml.

   Same contract, different transport plumbing: instead of fetch +
   EventSource + window.apis.doAction, we spawn the OCaml daemon
   (deps/db-worker/bin/main.exe) ourselves, discover its port via
   <root>/server-list, POST /v1/invoke over a plain socket, and read
   /v1/events on a systhread. All cross-thread delivery goes through
   Host.enqueue so promises always settle on the app thread. *)

open Promise_ext

(* ---------- paths ---------- *)

let home = Platform_native.home_directory

(* Only consumes the Win32 process handle returned by Unix.create_process.
   Registry and health messages use the child's real OS pid. *)
external worker_process_id : int -> int = "caml_logseq_worker_process_id"

(* The wait identity is the actual unreaped child on POSIX, or the original
   process HANDLE on Windows. It is never reconstructed from a registry PID. *)
module Child_process : sig
  type t
  val spawn : ?on_created:(t -> unit) -> string -> string array -> string array ->
    Unix.file_descr -> Unix.file_descr -> Unix.file_descr -> int * t
  val poll : t -> Unix.process_status option
  val await_clean_exit : timeout:float -> t -> unit
end = struct
  type state = Waiting | Exited of Unix.process_status | Unknown of exn
  type t = { wait_identity : int; mutex : Mutex.t; mutable state : state }
  external process_os_id : int -> int = "caml_logseq_worker_process_id_retained"
  let spawn ?(on_created=fun _ -> ()) executable arguments environment input_fd output_fd error_fd =
    let wait_identity = Unix.create_process_env executable arguments environment input_fd output_fd error_fd in
    let child = { wait_identity; mutex=Mutex.create (); state=Waiting } in
    (* Publish the exact token before the fallible OS-PID lookup. A failed
       startup remains owned and unqualified rather than losing its handle. *)
    on_created child;
    let pid = process_os_id wait_identity in
    if pid <= 0 then invalid_arg "Invalid actual child process identity";
    pid, child
  let poll child =
    Mutex.lock child.mutex;
    Fun.protect ~finally:(fun () -> Mutex.unlock child.mutex) (fun () ->
      match child.state with
      | Exited status -> Some status
      | Unknown error -> raise error
      | Waiting ->
          try
            match Unix.waitpid [Unix.WNOHANG] child.wait_identity with
            | 0, _ -> None
            | identity, status when identity=child.wait_identity ->
                child.state <- Exited status;
                Some status
            | _ -> failwith "Exact child wait returned an unrelated process"
          with
          | Unix.Unix_error (Unix.EINTR, _, _) -> None
          | error -> child.state <- Unknown error; raise error)
  let await_clean_exit ~timeout child =
    if not (Float.is_finite timeout) || timeout < 0. then invalid_arg "Invalid child exit timeout";
    let started = Mtime_clock.elapsed_ns () in
    let rec wait () =
      match poll child with
      | Some (Unix.WEXITED 0) -> ()
      | Some (Unix.WEXITED code) -> failwith ("Owned worker exited unsuccessfully: " ^ string_of_int code)
      | Some (Unix.WSIGNALED signal) | Some (Unix.WSTOPPED signal) ->
          failwith ("Owned worker did not exit normally: " ^ string_of_int signal)
      | None ->
          if Int64.to_float (Int64.sub (Mtime_clock.elapsed_ns ()) started) *. 1e-9 >= timeout then
            failwith "Owned worker exit is unproven after stop dispatch";
          Thread.delay 0.02;
          wait () in
    wait ()
end

let root_dir () =
  match Sys.getenv_opt "LOGSEQ_ROOT_DIR" with
  | Some d -> d
  | None -> Filename.concat (home ()) "logseq"

let realpath p = try Unix.realpath p with _ -> p

let graphs_dir () =
  let path =
    match Sys.getenv_opt "LOGSEQ_GRAPHS_DIR" with
    | Some dir -> dir
    | None -> Filename.concat (root_dir ()) "graphs"
  in
  let path =
    if String.starts_with ~prefix:"~" path then
      Filename.concat (home ()) (String.sub path 1 (String.length path - 1))
    else path
  in
  realpath
    (if Filename.is_relative path then Filename.concat (Sys.getcwd ()) path
     else path)

let server_list_path () = Filename.concat (root_dir ()) "server-list"

let rec mkdir_p path =
  if path <> "" && path <> "/" && not (Sys.file_exists path) then begin
    mkdir_p (Filename.dirname path);
    (try Unix.mkdir path 0o755 with _ -> ())
  end

let daemon_bin () =
  let runnable path =
    try
      (Unix.stat path).Unix.st_kind = Unix.S_REG
      && (Unix.access path [Unix.X_OK]; true)
    with
    | Unix.Unix_error ((Unix.ENOENT | Unix.ENOTDIR | Unix.EACCES), _, _) -> false
  in
  match Sys.getenv_opt "LOGSEQ_DB_WORKER_BIN" with
  | Some path ->
      if path <> "" && runnable path then path
      else failwith ("LOGSEQ_DB_WORKER_BIN is not an executable regular file: " ^ path)
  | None ->
    let worker = if Sys.os_type = "Win32" then "logseq-db-worker.exe" else "logseq-db-worker" in
    let packaged = Filename.concat Platform_native.packaged_resource_dir worker in
    let package_metadata =
      if Platform_native.is_mac () then
        Filename.concat Platform_native.packaged_resource_dir "nsh/app.json"
      else Filename.concat (Filename.dirname Sys.executable_name) "nsh/app.json" in
    let candidates =
      if Sys.file_exists package_metadata then [packaged]
      else [ packaged
      ; Filename.concat (Filename.dirname Sys.executable_name) worker
      (* in-tree dune build: <root>/deps/ui/_build/default/native/
         -> <root>/deps/db-worker/_build/default/bin/main.exe *)
      ; Filename.concat (Filename.dirname Sys.executable_name)
          "../../../../db-worker/_build/default/bin/main.exe"
      (* launched with the repo root as CWD (e.g. dune exec at root) *)
      ; Filename.concat (Sys.getcwd ())
          "deps/db-worker/_build/default/bin/main.exe" ]
    in
    match List.find_opt runnable candidates with
    | Some path -> path
    | None ->
        failwith
          ("logseq-db-worker binary not found; set LOGSEQ_DB_WORKER_BIN \
            (searched: " ^ String.concat ", " candidates ^ ")")

(* ---------- server-list ---------- *)

(* server-list lines: "<pid> <port>" *)
let read_server_list () : (int * int) list =
  let path = server_list_path () in
  if not (Sys.file_exists path) then []
  else
    try
      let ic = open_in_bin path in
      let rec lines acc =
        match input_line ic with
        | line -> lines (line :: acc)
        | exception End_of_file -> close_in ic; List.rev acc
        | exception _ -> close_in ic; List.rev acc
      in
      lines []
      |> List.filter_map (fun line ->
             match
               String.split_on_char ' ' (String.trim line)
               |> List.filter (fun s -> s <> "")
             with
             | [ pid; port ] -> (
                 match int_of_string_opt pid, int_of_string_opt port with
                 | Some pid, Some port -> Some (pid, port)
                 | _ -> None)
             | _ -> None)
    with _ -> []

let port_for_pid pid =
  match
    List.find_opt (fun (p, _port) -> p = pid) (read_server_list ())
  with
  | Some (_, port) -> Some port
  | None -> None

(* ---------- graph lifecycle (owner side) ---------- *)

(* The daemon's admission check refuses to start unless the lifecycle
   state says phase=available and the graph dir exists — the JS side does
   this via deps/graph-lifecycle createGraph before spawning. Minimal
   native equivalent of graph_lifecycle.{encode_graph,resolve_storage,
   context,create_graph} for the single-owner case. *)

let graph_name repo =
  let prefix = "logseq_db_" in
  let trimmed = String.trim repo in
  let name =
    if String.length trimmed >= String.length prefix
       && String.sub trimmed 0 (String.length prefix) = prefix
    then
      String.sub trimmed (String.length prefix)
        (String.length trimmed - String.length prefix)
    else trimmed
  in
  let name = String.trim name in
  if name = "" then failwith "repo is required";
  name

let encode_graph repo = Graph_dir.encode_graph_dir_name (graph_name repo)

let sha256_hex s =
  Digestif.SHA256.(to_hex (digest_string s))

let lifecycle_dir () =
  let graphs = realpath (graphs_dir ()) in
  let store_id = sha256_hex graphs in
  Filename.concat
    (Filename.concat (Filename.dirname graphs) ".graph-lifecycle")
    store_id

(* Graph generations are unique identities, not authentication secrets. Reuse
   the native application's UUID generator on every desktop platform. *)
let new_uuid = Host.random_uuid

(* A process-origin stamp, not authentication or permission to stop a daemon.
   Reused workers keep their own origin and remain fully usable. *)
let app_session = new_uuid ()
let app_session_header = "X-Logseq-App-Session: " ^ app_session ^ "\r\n"

let jobj (kvs : (string * Js.Json.t) list) : Js.Json.t =
  Js.Json.JObject kvs

let json_stringify (j : Js.Json.t) : string = Js.Json.stringify j

(* createGraph — ensure the graph dir exists and state.json says
   phase=available so the daemon's admission check passes. *)
let ensure_graph_created (repo : string) : unit =
  let enc = encode_graph repo in
  let graph_dir = Filename.concat (realpath (graphs_dir ())) enc in
  let dir = Filename.concat (lifecycle_dir ()) enc in
  let state_file = Filename.concat dir "state.json" in
  mkdir_p graph_dir;
  mkdir_p dir;
  let already =
    Sys.file_exists graph_dir && Sys.file_exists state_file
    &&
      (try
         match Yojson.Safe.from_file state_file with
         | `Assoc kvs -> List.assoc_opt "phase" kvs = Some (`String "available")
         | _ -> false
       with _ -> false)
  in
  if not already then
    let owner =
      try
        match Yojson.Safe.from_file state_file with
        | `Assoc kvs ->
            Option.value (List.assoc_opt "owner" kvs) ~default:`Null
        | _ -> `Null
      with _ -> `Null
    in
    let next =
      `Assoc
        [ "generation", `String (new_uuid ())
        ; "phase", `String "available"
        ; "workers", `List []
        ; "owner", owner ]
    in
    Yojson.Safe.to_file state_file next

(* ---------- daemon spawn ---------- *)

let attachment_key repo =
  (realpath (root_dir ()), graphs_dir (), realpath (lifecycle_dir ()), repo)

(* (canonical storage, repo) -> base-url of the attached daemon. Daemons
   outlive the app on purpose: a live daemon keeps its repo admission
   and the graph open, so a later launch re-attaches in one healthz
   round-trip instead of paying a cold spawn + graph open. *)
let attached : (string * string * string * string, string) Hashtbl.t =
  Hashtbl.create 4

type worker_origin = {
  pid : int;
  port : int;
  executable : string;
  session : string;
  instance : string;
}
type update_worker = {
  storage : string * string * string * string;
  origin : worker_origin;
  generation : string;
  ticket : string option;
  revision : string;
}
(* Guarded by attach_mu. Retain workers after graph detachment: their process
   and installed executable intentionally outlive the current graph view. *)
let update_workers :
    (string * string * string * string, worker_origin option) Hashtbl.t = Hashtbl.create 4

type spawned_child = {
  process : Child_process.t;
  storage : string * string * string * string;
  mutable origin : worker_origin option;
}
let spawned_children : (string, spawned_child) Hashtbl.t = Hashtbl.create 4

let worker_environment ~session ~instance =
  let inherited = Unix.environment () |> Array.to_list |> List.filter (fun entry ->
    let name = if Sys.os_type = "Win32" then String.uppercase_ascii entry else entry in
    not (String.starts_with ~prefix:"LOGSEQ_NSH_APP_SESSION=" name
         || String.starts_with ~prefix:"LOGSEQ_NSH_WORKER_INSTANCE=" name)) in
  Array.of_list (("LOGSEQ_NSH_APP_SESSION=" ^ session)
                :: ("LOGSEQ_NSH_WORKER_INSTANCE=" ^ instance) :: inherited)

(* boot timing: stderr marks carry seconds since module init so launch
   profiling needs no external stopwatch *)
let boot_t0 = Unix.gettimeofday ()

let boot_trace =
  match Sys.getenv_opt "LOGSEQ_BOOT_TRACE" with
  | Some ("" | "0") | None -> false
  | Some _ -> true

let boot_mark msg =
  if boot_trace then
  Printf.eprintf "[boot +%.3fs u=%.3f] %s\n%!"
    (Unix.gettimeofday () -. boot_t0) (Unix.gettimeofday ()) msg

(* spawn main.exe for [repo] (canonical "logseq_db_<name>"), wait for it
   to publish its port. Returns base-url. Blocking — caller runs this on
   a systhread. *)
let spawn_daemon (repo : string) : string =
  boot_mark ("spawn_daemon " ^ repo);
  mkdir_p (root_dir ());
  mkdir_p (graphs_dir ());
  let storage = attachment_key repo in
  Hashtbl.iter (fun _ child ->
    if child.storage=storage && child.origin=None then
      failwith "An earlier owned worker startup is unproven; refusing another spawn") spawned_children;
  ensure_graph_created repo;
  let bin = Unix.realpath (daemon_bin ()) in
  let instance = new_uuid () in
  let log_path =
    Filename.concat (root_dir ())
      ("db-worker-" ^ Graph_dir.encode_graph_dir_name repo ^ ".log")
  in
  let log_fd =
    Unix.openfile log_path [ Unix.O_CREAT; Unix.O_WRONLY; Unix.O_APPEND ]
      0o644
  in
  let devnull =
    Unix.openfile (if Sys.os_type = "Win32" then "NUL" else "/dev/null")
      [ Unix.O_RDONLY ] 0 in
  let pid, _ =
    Fun.protect ~finally:(fun () -> Unix.close devnull; Unix.close log_fd) (fun () ->
    Child_process.spawn ~on_created:(fun process ->
      Hashtbl.add spawned_children instance {process; storage; origin=None}) bin
      [| bin
       ; "--root-dir"
       ; root_dir ()
       ; "--graphs-dir"
       ; graphs_dir ()
       ; "--repo"
       ; repo
       ; "--owner-source"
       ; "electron" |]
      (worker_environment ~session:app_session ~instance)
      devnull log_fd log_fd)
  in
  let spawned = Hashtbl.find spawned_children instance in
  (* poll server-list for our pid *)
  let deadline = Unix.gettimeofday () +. 15. in
  let rec poll () =
    match port_for_pid pid with
    | Some port ->
        let origin = { pid; port; executable=bin; session=app_session; instance } in
        spawned.origin <- Some origin;
        Hashtbl.replace update_workers (attachment_key repo) (Some origin);
        boot_mark
          ("daemon up pid=" ^ string_of_int pid ^ " port="
           ^ string_of_int port);
        "http://127.0.0.1:" ^ string_of_int port
    | None ->
        if Unix.gettimeofday () > deadline then
          failwith
            ("db-worker daemon did not publish a port (pid "
            ^ string_of_int pid ^ "); see " ^ log_path)
        else begin
          Unix.sleepf 0.002;
          poll ()
        end
  in
  poll ()

(* ---------- daemon reuse ---------- *)

(* blocking GET with a short socket timeout; returns (status, body).
   Used only to probe /healthz — stale server-list entries (dead pids,
   reused ports) fail fast instead of hanging the boot chain. *)
let http_get ~(port : int) ~(path : string) : (int * string) option =
  let addr =
    Unix.ADDR_INET (Unix.inet_addr_of_string "127.0.0.1", port)
  in
  let fd = Unix.socket Unix.PF_INET Unix.SOCK_STREAM 0 in
  try
    Unix.setsockopt_float fd Unix.SO_RCVTIMEO 0.5;
    Unix.setsockopt_float fd Unix.SO_SNDTIMEO 0.5;
    Unix.connect fd addr;
    let oc = Unix.out_channel_of_descr fd in
    Printf.fprintf oc "GET %s HTTP/1.0\r\nHost: 127.0.0.1:%d\r\n\r\n"
      path port;
    flush oc;
    let ic = Unix.in_channel_of_descr fd in
    let status_line = input_line ic in
    let status =
      match String.split_on_char ' ' status_line with
      | _ :: code :: _ ->
          Option.value (int_of_string_opt code) ~default:0
      | _ -> 0
    in
    let rec skip () =
      let line = input_line ic in
      if line <> "" && line <> "\r" then skip ()
    in
    skip ();
    (* the daemon always sends Transfer-Encoding: chunked, so decode
       chunk frames — a raw read-to-EOF leaves the hex sizes in the
       body and breaks JSON parsing *)
    let buf = Buffer.create 2048 in
    (try
       while true do
         let size_line = String.trim (input_line ic) in
         match int_of_string_opt ("0x" ^ size_line) with
         | Some 0 ->
             (* consume the terminal CRLF, then stop — the daemon may
                keep the connection alive, so do NOT read past the last
                chunk (a timeout raises EAGAIN, not End_of_file, and
                would discard the body via the outer catch) *)
             ignore (input_line ic);
             raise Exit
         | Some n ->
             Buffer.add_channel buf ic n;
             ignore (input_line ic)
         | None -> raise Exit
       done
     with End_of_file | Exit -> ());
    Unix.close fd;
    Some (status, Buffer.contents buf)
  with _ ->
    (try Unix.close fd with _ -> ());
    None

(* /healthz identifies the ready worker and its canonical storage. *)
let probe_daemon ~(pid : int) ~(port : int) ~key : bool =
  let root, graphs, lifecycle, repo = key in
  match http_get ~port ~path:"/healthz" with
  | Some (status, body) when status >= 200 && status < 300 -> (
      try
        match Yojson.Safe.from_string body with
        | `Assoc kvs ->
            let field name = List.assoc_opt name kvs in
            field "repo" = Some (`String repo)
            && field "status" = Some (`String "ready")
            && field "pid" = Some (`Int pid)
            && field "port" = Some (`Int port)
            && (match field "storage" with
                | Some (`Assoc storage) ->
                    let path name =
                      match List.assoc_opt name storage with
                      | Some (`String p)
                        when p <> "" && not (Filename.is_relative p) ->
                          Some (Unix.realpath p)
                      | _ -> None
                    in
                    path "root" = Some root
                    && path "graphsDir" = Some graphs
                    && path "lifecycleDir" = Some lifecycle
                | _ -> false)
        | _ -> false
      with _ -> false)
  | _ -> false

let find_live_daemon key : string option =
  let entries = read_server_list () in
  boot_mark ("probe server-list entries="
    ^ string_of_int (List.length entries));
  List.find_map
    (fun (pid, port) ->
       if probe_daemon ~pid ~port ~key then begin
         boot_mark
           ("probe ok pid=" ^ string_of_int pid ^ " port="
            ^ string_of_int port);
         Some ("http://127.0.0.1:" ^ string_of_int port)
       end else begin
         boot_mark
           ("probe fail pid=" ^ string_of_int pid ^ " port="
            ^ string_of_int port);
         None
       end)
    entries

let attach_mu = Mutex.create ()

(* A sampled prerequisite only. Stage two must atomically seal ownership and
   prove final worker shutdown before any installation lease can be issued. *)
let inspect_update_worker ~key ~(origin : worker_origin) body : update_worker =
  let root, graphs, lifecycle, repo = key in
  let fail detail = failwith ("Update preparation requires this application's unshared worker: " ^ detail) in
  let fields = match Yojson.Safe.from_string body with
    | `Assoc fields -> fields
    | _ -> fail "invalid worker health descriptor" in
  let field fields name = List.assoc_opt name fields in
  let required fields name = match field fields name with
    | Some (`String value) when value <> "" -> value
    | _ -> fail ("missing " ^ name) in
  let metadata = match field fields "nsh-app-ownership" with
    | Some (`Assoc fields) -> fields
    | _ -> fail "worker has no application process origin" in
  if field fields "pid" <> Some (`Int origin.pid)
     || field fields "port" <> Some (`Int origin.port)
     || field fields "repo" <> Some (`String repo)
     || field fields "status" <> Some (`String "ready")
     || required metadata "session" <> origin.session
     || required metadata "instance" <> origin.instance
     || required metadata "executable" <> origin.executable
  then fail "worker process identity changed";
  if field metadata "shared" <> Some (`Bool false) then fail "worker is shared with another client";
  let storage = match field fields "storage" with
    | Some (`Assoc storage) -> storage
    | _ -> fail "missing canonical worker storage" in
  if required storage "root" <> root || required storage "graphsDir" <> graphs
     || required storage "lifecycleDir" <> lifecycle
  then fail "worker storage identity changed";
  let generation = required fields "generation" and revision = required fields "revision" in
  let ticket = match field fields "ticket" with
    | Some (`String value) when value <> "" -> Some value
    | Some `Null -> None
    | _ -> fail "invalid worker admission ticket" in
  { storage = key; origin; generation; ticket; revision }

let verify_update_workers ~fetch snapshot =
  List.map (fun (key, origin) ->
    let _, _, _, repo = key in
    match origin with
    | None -> failwith ("Update preparation cannot stop a reused or externally owned worker: " ^ repo)
    | Some origin ->
        match fetch ~port:origin.port ~path:"/healthz" with
        | Some (status, body) when status >= 200 && status < 300 ->
            inspect_update_worker ~key ~origin body
        | _ -> failwith ("Update preparation cannot verify the current worker: " ^ repo)) snapshot

let capture_update_workers () =
  let promise, resolve, reject = Js.Promise.pending () in
  ignore (Thread.create (fun () ->
    try
      let snapshot =
        Mutex.lock attach_mu;
        Fun.protect ~finally:(fun () -> Mutex.unlock attach_mu) (fun () ->
          Hashtbl.iter (fun _ child ->
            if child.origin=None then failwith "An owned worker has not completed attachment") spawned_children;
          Hashtbl.fold (fun key origin acc -> (key, origin) :: acc) update_workers []
          |> List.sort (fun (left, _) (right, _) -> Stdlib.compare left right)) in
      let workers = verify_update_workers ~fetch:http_get snapshot in
      Host.enqueue (fun () -> resolve workers)
    with error -> Host.enqueue (fun () -> reject error)) ());
  promise

let require_update_owned_workers () =
  let* _ = capture_update_workers () in
  Js.Promise.resolve ()

(* ---------- graph listing ---------- *)

let list_repo_names () : Wire.t list =
  let dir = graphs_dir () in
  if not (Sys.file_exists dir) then []
  else
    Sys.readdir dir |> Array.to_list
    |> List.filter (fun name ->
        name <> ""
        && name.[0] <> '.'
        && Sys.is_directory (Filename.concat dir name))
    |> List.filter_map (fun entry ->
        match Graph_dir.decode_canonical_graph_dir_key entry with
        | Some name when name <> "Unlinked graphs" && name <> "backup" ->
            Some (Wire.String ("logseq_db_" ^ name))
        | _ -> None)

(* ---------- attach + prewarm ---------- *)

(* Serializes attach-or-spawn across the prewarm thread and ipc callers
   so only one daemon is spawned per storage/repo: a second waiter blocks
   on the mutex, then finds the freshly published daemon in
   server-list / `attached`. *)

let last_repo_path () = Filename.concat (root_dir ()) "last-repo"

let record_last_repo (repo : string) : unit =
  try
    let fd =
      Unix.openfile (last_repo_path ())
        [ Unix.O_CREAT; Unix.O_WRONLY; Unix.O_TRUNC ] 0o644
    in
    ignore (Unix.write fd (Bytes.of_string repo) 0 (String.length repo));
    Unix.close fd
  with _ -> ()

let ensure_attached (repo : string) : string =
  Mutex.lock attach_mu;
  Fun.protect ~finally:(fun () -> Mutex.unlock attach_mu) (fun () ->
      let key = attachment_key repo in
      match Hashtbl.find_opt attached key with
      | Some base -> base
      | None ->
          let base =
            match find_live_daemon key with
            | Some base ->
                boot_mark ("reuse daemon " ^ base);
                (match Hashtbl.find_opt update_workers key with
                 | Some (Some origin)
                   when base = Printf.sprintf "http://127.0.0.1:%d" origin.port -> ()
                 | Some None | Some (Some _) | None -> Hashtbl.replace update_workers key None);
                base
            | None -> spawn_daemon repo
          in
          Hashtbl.replace attached key base;
          record_last_repo repo;
          base)

(* Cold-start overlap: spawn the graph's daemon on a background thread
   while the app is still booting, so the runtime ipc later attaches to
   an already-up daemon instead of paying spawn + graph open inline.
   Graph choice: the last attached repo (<root>/last-repo), else the
   single graph under graphs_dir; ambiguous cases skip prewarming —
   the ipc path spawns on demand as before. *)
let pick_prewarm_repo () : string option =
  let last =
    try
      match
        In_channel.with_open_bin (last_repo_path ())
          In_channel.input_all
      with
      | "" -> None
      | s -> Some (String.trim s)
    with _ -> None
  in
  match last with
  | Some r -> Some r
  | None -> (
      match list_repo_names () with
      | [ Wire.String r ] -> Some r
      | _ -> None)

(* ---------- login-resident daemon ---------- *)

(* Install a per-(root,repo) LaunchAgent so the db-worker daemon is
   already running at login — after that every app attach is the warm
   path (one healthz round-trip) instead of a ~120ms cold spawn. The
   plist is rewritten each launch so the paths/repo stay current.
   Opt out with LOGSEQ_NO_LOGIN_DAEMON=1. *)
let login_agent_label (repo : string) : string =
  "com.logseq.dbworker."
  ^ String.sub (sha256_hex (root_dir () ^ "|" ^ repo)) 0 8

let ensure_login_daemon (repo : string) : unit =
  if Platform_native.is_mac () then
  match Sys.getenv_opt "LOGSEQ_NO_LOGIN_DAEMON" with
  | Some _ -> ()
  | None -> (
      try
        let label = login_agent_label repo in
        let agents_dir =
          Filename.concat
            (Filename.concat (home ()) "Library") "LaunchAgents"
        in
        mkdir_p agents_dir;
        let plist_path =
          Filename.concat agents_dir (label ^ ".plist")
        in
        let xml_escape s =
          let b = Buffer.create (String.length s) in
          String.iter
            (fun c ->
              match c with
              | '&' -> Buffer.add_string b "&amp;"
              | '<' -> Buffer.add_string b "&lt;"
              | '>' -> Buffer.add_string b "&gt;"
              | _ -> Buffer.add_char b c)
            s;
          Buffer.contents b
        in
        let args =
          String.concat ""
            (List.map
               (fun a ->
                 "    <string>" ^ xml_escape a ^ "</string>\n")
               [ daemon_bin ()
               ; "--root-dir"
               ; root_dir ()
               ; "--graphs-dir"
               ; graphs_dir ()
               ; "--repo"
               ; repo
               ; "--owner-source"
               ; "electron" ])
        in
        let plist =
          "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
          ^ "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \
             \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n"
          ^ "<plist version=\"1.0\">\n<dict>\n"
          ^ "  <key>Label</key>\n  <string>" ^ label ^ "</string>\n"
          ^ "  <key>ProgramArguments</key>\n  <array>\n" ^ args
          ^ "  </array>\n"
          ^ "  <key>RunAtLoad</key>\n  <true/>\n"
          ^ "  <key>KeepAlive</key>\n  <false/>\n"
          ^ "</dict>\n</plist>\n"
        in
        let oc = open_out_bin plist_path in
        output_string oc plist;
        close_out oc;
        let uid = string_of_int (Unix.getuid ()) in
        let service = "gui/" ^ uid ^ "/" ^ label in
        if
          Sys.command ("launchctl print " ^ service ^ " >/dev/null 2>&1")
          <> 0
        then
          ignore
            (Sys.command
               ("launchctl bootstrap gui/" ^ uid ^ " "
                ^ Filename.quote plist_path ^ " >/dev/null 2>&1"))
      with _ -> ())

let prewarm () : unit =
  match pick_prewarm_repo () with
  | None -> boot_mark "prewarm skipped (no repo)"
  | Some repo ->
      boot_mark ("prewarm " ^ repo);
      ignore (ensure_attached repo);
      ensure_login_daemon repo

(* prewarm on a real domain, not a systhread: the OCaml thread
   scheduler cannot preempt long foreign calls (SDL window creation
   blocks ~100ms), so a systhread spawn stalls until the first yield
   and loses the whole point of overlapping the cold spawn. Start after
   embedded runtime startup restores the host signal mask, so neither
   the domain nor its worker process inherits the temporary mask. *)
let start_prewarm =
  State_cell.Once.memo (fun () -> ignore (Domain.spawn prewarm))

(* ---------- ipc (was window.apis.doAction) ---------- *)

let ipc (args : Wire.t list) : Wire.t Js.Promise.t =
  let p, resolve, reject = Js.Promise.pending () in
  let run () =
    try
      match args with
      | [ Wire.String "getGraphs" ] ->
          boot_mark "ipc getGraphs";
          Host.enqueue (fun () ->
              resolve (Wire.Array (list_repo_names ())))
      | [ Wire.String "db-worker-runtime"; Wire.String repo; _ ] ->
          boot_mark ("ipc db-worker-runtime " ^ repo);
          let base = ensure_attached repo in
          Host.enqueue (fun () ->
              resolve
                (Wire.Map [ (Wire.kw "base-url", Wire.String base) ]));
          (* launchctl calls take ~300ms — keep them off the ipc
             resolution path *)
          ensure_login_daemon repo
      | [ Wire.String "releaseDbWorkerRuntime"; Wire.String repo ] ->
          (* detach only — the daemon keeps the repo open so a later
             attach (or the next app launch) is instant *)
          let key = attachment_key repo in
          Mutex.lock attach_mu;
          Hashtbl.remove attached key;
          Mutex.unlock attach_mu;
          Host.enqueue (fun () -> resolve Wire.Nil)
      | _ -> Host.enqueue (fun () -> resolve Wire.Nil)
    with e ->
      prerr_endline
        ("[daemon] ipc failed: " ^ Printexc.to_string e);
      Host.enqueue (fun () -> reject e)
  in
  ignore (Thread.create (fun () -> run ()) ());
  p

(* ---------- http ---------- *)

(* minimal blocking HTTP over a socket; localhost only *)
let http_post_with_timeout ~timeout ~(host : string) ~(port : int) ~(path : string)
    ~(body : string) : (int * string) =
  let addr = Unix.ADDR_INET (Unix.inet_addr_of_string host, port) in
  let fd = Unix.socket ~cloexec:true Unix.PF_INET Unix.SOCK_STREAM 0 in
  let ic = Unix.in_channel_of_descr fd in
  Fun.protect ~finally:(fun () -> close_in_noerr ic) (fun () ->
  Option.iter (fun seconds ->
    Unix.setsockopt_float fd Unix.SO_RCVTIMEO seconds;
    Unix.setsockopt_float fd Unix.SO_SNDTIMEO seconds) timeout;
  Unix.connect fd addr;
  let req =
    Printf.sprintf
      "POST %s HTTP/1.1\r\nHost: %s:%d\r\nContent-Type: \
       application/json\r\nContent-Length: %d\r\nConnection: \
       close\r\n%s\r\n%s"
      path host port (String.length body) app_session_header body
  in
  let rec write offset =
    if offset < String.length req then
      match Unix.write_substring fd req offset (String.length req-offset) with
      | 0 -> failwith "Native daemon request socket closed while writing"
      | count -> write (offset+count)
      | exception Unix.Unix_error (Unix.EINTR, _, _) -> write offset in
  write 0;
  (* status line *)
  let status_line = input_line ic in
  let status =
    match String.split_on_char ' ' status_line with
    | _ :: code :: _ -> Option.value (int_of_string_opt code) ~default:0
    | _ -> 0
  in
  (* headers *)
  let rec headers acc =
    let line = input_line ic in
    if line = "" || line = "\r" then acc
    else headers (line :: acc)
  in
  let headers = headers [] in
  let chunked =
    List.exists
      (fun h ->
         let l = String.lowercase_ascii h in
         String.length l > 18
         && String.sub l 0 18 = "transfer-encoding:"
         &&
           (match String.index_opt l ':' with
            | Some i ->
                String.trim (String.sub l (i + 1) (String.length l - i - 1))
                = "chunked"
            | None -> false))
      headers
  in
  let buf = Buffer.create 4096 in
  if chunked then begin
    (* chunked transfer-encoding: "<hex>\r\n<data>\r\n" until "0\r\n" *)
    let rec chunks () =
      let size_line = String.trim (input_line ic) in
      match int_of_string_opt ("0x" ^ size_line) with
      | Some 0 -> ignore (try input_line ic with _ -> "")
      | Some n -> (
          Buffer.add_channel buf ic n;
          ignore (input_line ic);
          (* trailing CRLF *)
          chunks ())
      | None -> ()
    in
    (try chunks () with End_of_file -> ())
  end
  else begin
    (* body to EOF *)
    (try
       while true do
         Buffer.add_channel buf ic 8192
       done
     with End_of_file -> ())
  end;
  (status, Buffer.contents buf))

let http_post ~host ~port ~path ~body =
  http_post_with_timeout ~timeout:None ~host ~port ~path ~body

(* This explicit stage-two capability is deliberately not called by ordinary
   update preparation. Installation remains disabled until restoration and the
   application relaunch policy have their own end-to-end qualification. *)
type worker_update_action = Seal_worker | Abort_worker | Stop_worker
type worker_update_phase =
  | Worker_initial | Worker_sealing | Worker_sealed | Worker_aborting
  | Worker_released | Worker_stopping | Worker_exited
  | Worker_uncertain of worker_update_action * string
module Worker_update : sig
  type t
  val create : request_id:string -> update_worker -> t Js.Promise.t
  val phase : t -> worker_update_phase
  val seal : t -> unit Js.Promise.t
  val abort : t -> unit Js.Promise.t
  val stop : t -> unit Js.Promise.t
  val restore_exited : t -> unit Js.Promise.t
end = struct
  type t = {
    worker : update_worker;
    process : Child_process.t;
    request_id : string;
    phase : worker_update_phase Atomic.t;
    restored : worker_origin option Atomic.t;
  }
  let phase update = Atomic.get update.phase
  let background action =
    let promise, resolve, reject = Js.Promise.pending () in
    ignore (Thread.create (fun () ->
      try let value = action () in Host.enqueue (fun () -> resolve value)
      with error -> Host.enqueue (fun () -> reject error)) ());
    promise
  let create ~request_id (worker : update_worker) = background (fun () ->
    Update_admission.validate_id request_id;
    let process =
      Mutex.lock attach_mu;
      Fun.protect ~finally:(fun () -> Mutex.unlock attach_mu) (fun () ->
        if Hashtbl.find_opt update_workers worker.storage <> Some (Some worker.origin) then
          failwith "Worker update storage does not own this captured child";
        match Hashtbl.find_opt spawned_children worker.origin.instance with
        | Some child when child.origin=Some worker.origin -> child.process
        | _ -> failwith "Update shutdown requires the exact captured child, never a reused PID") in
    {worker; process; request_id; phase=Atomic.make Worker_initial; restored=Atomic.make None})
  let exchange update allowed next =
    let rec change () =
      let current = phase update in
      if not (allowed current) then failwith "Worker update operation is not admitted in its current phase";
      if not (Atomic.compare_and_set update.phase current next) then change () in
    change ()
  let request update action expected =
    let origin = update.worker.origin in
    if origin.session<>app_session then failwith "Worker update belongs to another application session";
    let status, body = http_post_with_timeout ~timeout:(Some 5.)
      ~host:"127.0.0.1" ~port:origin.port ~path:"/v1/nsh-update"
      ~body:(Yojson.Safe.to_string (`Assoc ["id", `String update.request_id;
        "instance", `String origin.instance; "action", `String action])) in
    let fields = match Yojson.Safe.from_string body with `Assoc fields -> fields
      | _ -> failwith "Invalid worker update acknowledgement" in
    let get name = List.assoc_opt name fields in
    if status<>200 || get "ok"<>Some (`Bool true) then begin
      let detail = match get "error" with Some (`String detail) -> detail
        | _ -> "worker update request was not acknowledged" in
      failwith detail
    end;
    if get "id"<>Some (`String update.request_id)
       || get "instance"<>Some (`String origin.instance)
       || get "phase"<>Some (`String expected)
    then failwith "Worker update acknowledgement belongs to a different operation"
  let run update operation next allowed action = background (fun () ->
    exchange update allowed next;
    try action ()
    with error ->
      Atomic.set update.phase (Worker_uncertain (operation, Printexc.to_string error));
      raise error)
  let seal update =
    run update Seal_worker Worker_sealing ((=) Worker_initial) (fun () ->
      request update "seal" "sealed";
      Atomic.set update.phase Worker_sealed)
  let abort update =
    run update Abort_worker Worker_aborting (function
      | Worker_initial | Worker_sealed | Worker_uncertain (Seal_worker, _)
      | Worker_uncertain (Abort_worker, _) -> true
      | _ -> false) (fun () ->
      request update "abort" "open";
      Atomic.set update.phase Worker_released)
  let stop update =
    run update Stop_worker Worker_stopping ((=) Worker_sealed) (fun () ->
      request update "stop" "stopping";
      Child_process.await_clean_exit ~timeout:30. update.process;
      Atomic.set update.phase Worker_exited)
  let restore_exited update = background (fun () ->
    (match phase update with
     | Worker_exited | Worker_stopping | Worker_uncertain (Stop_worker, _) -> ()
     | _ -> failwith "Worker restoration requires a captured stopped child");
    (* A lost management acknowledgement cannot replace exact child proof. *)
    Child_process.await_clean_exit ~timeout:30. update.process;
    Atomic.set update.phase Worker_exited;
    Mutex.lock attach_mu;
    Fun.protect ~finally:(fun () -> Mutex.unlock attach_mu) (fun () ->
      let worker = update.worker in
      let _, _, _, repo = worker.storage in
      if attachment_key repo <> worker.storage then
        failwith "Worker restoration storage changed";
      match Atomic.get update.restored with
      | Some origin ->
          if Hashtbl.find_opt update_workers worker.storage <> Some (Some origin)
             || Hashtbl.find_opt attached worker.storage <>
                  Some (Printf.sprintf "http://127.0.0.1:%d" origin.port)
          then failwith "Restored worker origin changed";
          (match http_get ~port:origin.port ~path:"/healthz" with
           | Some (200, body) -> ignore (inspect_update_worker ~key:worker.storage ~origin body)
           | _ -> failwith "Restored worker no longer proves readiness")
      | None ->
      if Hashtbl.find_opt update_workers worker.storage <> Some (Some worker.origin) then
        failwith "Worker restoration would replace a different origin";
      (match Hashtbl.find_opt spawned_children worker.origin.instance with
       | Some child when child.process == update.process && child.origin=Some worker.origin -> ()
       | _ -> failwith "Worker restoration lost its exact captured child");
      let previous_base = Printf.sprintf "http://127.0.0.1:%d" worker.origin.port in
      (match Hashtbl.find_opt attached worker.storage with
       | None -> ()
       | Some base when base=previous_base -> ()
       | Some _ -> failwith "Worker restoration would replace a different attachment");
      (* Never adopt another client's replacement. Use the same owned spawning
         path as normal attachment, under its existing serialization lock. *)
      if Option.is_some (find_live_daemon worker.storage) then
        failwith "Worker restoration found an externally replaced endpoint";
      Hashtbl.remove attached worker.storage;
      let base = spawn_daemon repo in
      let origin = match Hashtbl.find_opt update_workers worker.storage with
        | Some (Some origin) when origin.instance<>worker.origin.instance -> origin
        | _ -> failwith "Restored worker has no fresh captured origin" in
      (match http_get ~port:origin.port ~path:"/healthz" with
       | Some (200, body) -> ignore (inspect_update_worker ~key:worker.storage ~origin body)
       | _ -> failwith "Restored worker did not prove ready storage");
      Hashtbl.replace attached worker.storage base;
      Atomic.set update.restored (Some origin)))
end

let http_get_stream ~(host : string) ~(port : int) ~(path : string)
    ~(on_line : string -> unit) ~(alive : unit -> bool)
    ~(on_ready : unit -> unit) ~(on_socket : Unix.file_descr -> unit)
    ~(on_socket_closed : unit -> unit) : (unit, exn) result =
  let fd = Unix.socket ~cloexec:true Unix.PF_INET Unix.SOCK_STREAM 0 in
  let input = Unix.in_channel_of_descr fd in
  Fun.protect ~finally:(fun () -> on_socket_closed (); close_in_noerr input) (fun () ->
    try
      on_socket fd;
      if not (alive ()) then failwith "Native event stream owner retired";
      Unix.setsockopt_float fd Unix.SO_RCVTIMEO 5.;
      Unix.setsockopt_float fd Unix.SO_SNDTIMEO 5.;
      Unix.connect fd (Unix.ADDR_INET (Unix.inet_addr_of_string host, port));
      let request = Printf.sprintf
        "GET %s HTTP/1.1\r\nHost: %s:%d\r\nAccept: text/event-stream\r\n%s\r\n"
        path host port app_session_header in
      let rec write offset = if offset<String.length request then
        match Unix.write_substring fd request offset (String.length request-offset) with
        | 0 -> failwith "Native event stream closed while writing"
        | count -> write (offset+count)
        | exception Unix.Unix_error (Unix.EINTR, _, _) -> write offset in
      write 0;
      (match String.split_on_char ' ' (input_line input) with
       | _ :: "200" :: _ -> ()
       | _ -> failwith "Native event stream did not acknowledge HTTP 200");
      let rec headers stream =
        match String.trim (input_line input) |> String.lowercase_ascii with
        | "" -> stream
        | header -> headers (stream || header="content-type: text/event-stream") in
      if not (headers false) then failwith "Native endpoint did not acknowledge an event stream";
      (* Only the finite handshake has a deadline; an idle event stream is
         liveness, not pending preparation work or a recurring timer. *)
      Unix.setsockopt_float fd Unix.SO_RCVTIMEO 0.;
      on_ready ();
      (try while alive () do on_line (input_line input) done with End_of_file -> ());
      Ok ()
    with error -> Error error)

(* ---------- transport ---------- *)

type sse_state = {
  mutable stop : bool;
  closed : bool Atomic.t;
  socket_lock : Mutex.t;
  mutable socket : Unix.file_descr option;
}
let cancel_stream state =
  state.stop <- true;
  Mutex.lock state.socket_lock;
  Fun.protect ~finally:(fun () -> Mutex.unlock state.socket_lock) (fun () ->
    Option.iter (fun fd -> try Unix.shutdown fd Unix.SHUTDOWN_ALL with Unix.Unix_error _ -> ())
      state.socket)

type transport =
  { mutable base_url : string
  ; mutable repo : string
  ; mutable sse : sse_state option
  ; mutable sink : string -> Wire.t -> unit
  ; pending : (string * Wire.t list * (unit -> unit) option) Queue.t
  ; dead : string Js.Promise.t
  }

let json_field (name : string) (j : Js.Json.t) : Js.Json.t option =
  match j with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt name kvs with
      | Some v -> Some v
      | None -> None)
  | _ -> None

let post_invoke ?(timeout = None) (base_url : string) (name : string) (args : Wire.t list)
    : Wire.t Js.Promise.t =
  let p, resolve, reject = Js.Promise.pending () in
  (* host:port from base-url like http://127.0.0.1:PORT *)
  let host, port =
    match
      String.split_on_char '/'
        (String.sub base_url 7 (String.length base_url - 7))
    with
    | hp :: _ -> (
        match String.split_on_char ':' hp with
        | [ h; ps ] -> (h, Option.value (int_of_string_opt ps) ~default:0)
        | _ -> ("127.0.0.1", 0))
    | _ -> ("127.0.0.1", 0)
  in
  let body =
    Yojson.Safe.to_string
      (`Assoc
        [ "method", `String name
        ; "argsTransit", `String (Transit.to_string (Wire.Array args)) ])
  in
  boot_mark ("invoke " ^ name);
  ignore
    (Thread.create
       (fun () ->
         try
           let _status, resp = http_post_with_timeout ~timeout ~host ~port ~path:"/v1/invoke" ~body in
           boot_mark ("invoke " ^ name ^ " done");
           let j = Js.Json.parseExn resp in
           let ok =
             match json_field "ok" j with
             | Some v -> Js.Json.decodeBoolean v = Some true
             | None -> false
           in
           if not ok then
             let message =
               match json_field "error" j with
               | Some e -> (
                   match json_field "message" e with
                   | Some m ->
                       Option.value (Js.Json.decodeString m) ~default:""
                   | None -> "")
               | None -> ""
             in
             prerr_endline ("[daemon] invoke " ^ name ^ " failed: " ^ message);
             Host.enqueue (fun () ->
                 reject
                   (Failure ("db-worker daemon " ^ name ^ ": " ^ message)))
           else
             let result =
               match json_field "resultTransit" j with
               | Some rt -> (
                   match Js.Json.decodeString rt with
                   | Some s -> Transit.of_string s
                   | None -> Wire.Nil)
               | None -> Wire.Nil
             in
             Host.enqueue (fun () -> resolve result)
         with e ->
           prerr_endline
             ("[daemon] invoke " ^ name ^ " transport error: "
             ^ Printexc.to_string e);
           Host.enqueue (fun () -> reject e))
       ());
  p

(* SSE: lines "data: {json}"; payload is a transit string carrying
   [<kw> ...]. *)
let sse_thread (t : transport) (host : string) (port : int)
    (state : sse_state) ~on_ready ~on_closed : unit =
  let on_socket fd =
    Mutex.lock state.socket_lock;
    state.socket <- Some fd;
    Mutex.unlock state.socket_lock in
  let on_socket_closed () =
    Mutex.lock state.socket_lock;
    state.socket <- None;
    Mutex.unlock state.socket_lock in
  let result = http_get_stream ~host ~port ~path:"/v1/events" ~on_ready ~on_socket ~on_socket_closed
    ~alive:(fun () -> not state.stop)
    ~on_line:(fun line ->
      let line = String.trim line in
      if String.length line > 5 && String.sub line 0 5 = "data:" then
        let data = String.sub line 5 (String.length line - 5) |> String.trim in
        (match (try Some (Js.Json.parseExn data) with _ -> None) with
         | Some j -> (
             match
               Option.bind (json_field "payload" j) Js.Json.decodeString
             with
             | Some s -> (
                 match
                   (try Some (Transit.of_string s) with _ -> None)
                 with
                 | Some (Wire.Array (Wire.Keyword kind :: rest))
                 | Some (Wire.List (Wire.Keyword kind :: rest)) ->
                     let payload =
                       match rest with
                       | [ p ] -> p
                       | _ -> Wire.Array rest
                     in
                     let sink = t.sink in
                     Host.enqueue (fun () ->
                       if not state.stop && Option.exists (fun current -> current == state) t.sse
                       then sink kind payload)
                 | _ -> ())
             | None -> ())
         | None -> ())) in
  Atomic.set state.closed true;
  on_closed result

let attach_ready (t : transport) (repo : string) (base_url : string) : unit Js.Promise.t =
  (match t.sse with
   | Some s -> cancel_stream s
   | None -> ());
  let host, port =
    match
      String.split_on_char '/'
        (String.sub base_url 7 (String.length base_url - 7))
    with
    | hp :: _ -> (
        match String.split_on_char ':' hp with
        | [ h; ps ] -> (h, Option.value (int_of_string_opt ps) ~default:0)
        | _ -> ("127.0.0.1", 0))
    | _ -> ("127.0.0.1", 0)
  in
  let state = { stop = false; closed = Atomic.make false;
                socket_lock = Mutex.create (); socket = None } in
  let ready, resolve, reject = Js.Promise.pending () in
  let settled = Atomic.make false in
  let on_ready () =
    if Atomic.compare_and_set settled false true then Host.enqueue resolve in
  let on_closed result =
    if Atomic.compare_and_set settled false true then
      Host.enqueue (fun () -> reject (match result with Error error -> error
        | Ok () -> Failure "Native event stream closed before readiness"))
    else match result with
      | Ok () -> ()
      | Error error -> prerr_endline ("[daemon] SSE stream ended: " ^ Printexc.to_string error) in
  t.sse <- Some state;
  t.base_url <- base_url;
  t.repo <- repo;
  boot_mark ("sse attach " ^ repo);
  ignore (Thread.create (fun () -> sse_thread t host port state ~on_ready ~on_closed) ());
  ready

let attach t repo base_url = ignore (attach_ready t repo base_url)

let rebind_transport_ready (t : transport) repo base =
  let ready = attach_ready t repo base in
  let expected_stream = t.sse in
  let* () = ready in
  let* _ = post_invoke ~timeout:(Some 5.) base "thread-api/create-or-open-db"
    [Wire.String repo; Wire.Map []] in
  match expected_stream, t.sse with
  | Some expected, Some current when expected == current && t.repo=repo && t.base_url=base
      && not expected.stop && not (Atomic.get expected.closed) -> Js.Promise.resolve ()
  | _ -> Js.Promise.reject (Failure "Restored worker event stream is no longer live")

(* Capture the current transport before any worker stop. Restore only that
   owner; an unrelated graph switch must never be rebound by a late abort. *)
let capture_restore_transport (t : transport) =
  let repo = t.repo in
  let expected_base = ref t.base_url and expected_stream = ref t.sse in
  let complete = ref false in
  let same_owner () =
    t.repo=repo && t.base_url= !expected_base
    && (match !expected_stream, t.sse with
        | None, None -> true
        | Some left, Some right -> left == right
        | _ -> false) in
  let live_stream () = match t.sse with
    | Some state -> not state.stop && not (Atomic.get state.closed)
    | None -> false in
  fun () ->
    if not (same_owner ()) then
      Js.Promise.reject (Failure "Worker restoration transport owner changed")
    else if repo="" || (!complete && live_stream ()) then Js.Promise.resolve ()
    else
      let* endpoint = ipc [Wire.String "db-worker-runtime"; Wire.String repo; Wire.Map []] in
      if not (same_owner ()) then
        Js.Promise.reject (Failure "Worker restoration transport owner changed during attachment")
      else
        let restored_base = match Wire.map_get_string endpoint "base-url" with
          | Some value when value<>"" -> value
          | _ -> failwith "Restored worker omitted its endpoint" in
        let restoring = rebind_transport_ready t repo restored_base in
        expected_base := t.base_url;
        expected_stream := t.sse;
        let* () = restoring in
        if same_owner () && live_stream () then begin
          complete := true;
          Js.Promise.resolve ()
        end else Js.Promise.reject (Failure "Restored worker event stream is no longer live")

let list_graphs () : Wire.t Js.Promise.t =
  let* graphs = ipc [ Wire.String "getGraphs" ] in
  let names =
    match graphs with
    | Wire.Array xs | Wire.List xs -> xs
    | _ -> []
  in
  Js.Promise.resolve
    (Wire.Array
       (List.map (fun w -> Wire.Map [ (Wire.kw "name", w) ]) names))

let flush_pending (t : transport) : unit Js.Promise.t =
  let rec loop () =
    if Queue.is_empty t.pending then Js.Promise.resolve ()
    else
      let name, args, finish = Queue.take t.pending in
      Js.Promise.then_ (fun _ ->
        Option.iter (fun finish -> finish ()) finish;
        loop ()) (post_invoke t.base_url name args)
      |> Js.Promise.catch (fun error ->
           Option.iter (fun finish -> finish ()) finish;
           Js.Promise.reject error)
  in
  loop ()

let invoke (t : transport) (name : string) (args : Wire.t list) :
    Wire.t Js.Promise.t =
  match name with
  | "thread-api/init" -> Js.Promise.resolve Wire.Nil
  | "thread-api/list-db" -> list_graphs ()
  | "thread-api/create-or-open-db" -> (
      match args with
      | Wire.String repo :: _ ->
          let* rt =
            ipc
              [ Wire.String "db-worker-runtime"
              ; Wire.String repo
              ; Wire.Map [] ]
          in
          (match Wire.map_get_string rt "base-url" with
           | Some base when base <> "" ->
               if base <> t.base_url then (
                 (if t.repo <> "" && t.repo <> repo then
                    ignore
                      (ipc
                         [ Wire.String "releaseDbWorkerRuntime"
                         ; Wire.String t.repo ]));
                 attach t repo base)
           | _ ->
               failwith
                 ("db-worker-runtime returned no base-url for " ^ repo));
          let* _ = flush_pending t in
          post_invoke t.base_url name args
      | _ -> Js.Promise.reject (Failure "create-or-open-db: bad args"))
  | _ ->
      if t.base_url = "" then (
        Queue.add (name, args, Ui_task.Activity.begin_work ()) t.pending;
        Js.Promise.resolve Wire.Nil)
      else post_invoke t.base_url name args

let create_transport () : transport =
  { base_url = ""
  ; repo = ""
  ; sse = None
  ; sink = (fun _ _ -> ())
  ; pending = Queue.create ()
  ; dead = Js.Promise.liveness ()
  }

let is_electron () = true
