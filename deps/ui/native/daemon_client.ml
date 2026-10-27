(* Native twin of core/daemon_client.ml.

   Same contract, different transport plumbing: instead of fetch +
   streaming SSE + window.apis.doAction, we spawn the OCaml daemon
   (deps/db-worker/bin/main.exe) ourselves, discover its port via
   <root>/server-list, POST /v1/invoke over a plain socket, and read
   /v1/events on a systhread. All cross-thread delivery goes through
   Host.enqueue so promises always settle on the app thread. *)

open Promise_ext

(* ---------- paths ---------- *)

let home () =
  match Sys.getenv_opt "HOME" with
  | Some h -> h
  | None -> failwith "HOME not set"

let root_dir () =
  match Sys.getenv_opt "LOGSEQ_ROOT_DIR" with
  | Some d -> d
  | None -> Filename.concat (home ()) "logseq"

let graphs_dir () = Filename.concat (root_dir ()) "graphs"

let server_list_path () = Filename.concat (root_dir ()) "server-list"

let rec mkdir_p path =
  if path <> "" && path <> "/" && not (Sys.file_exists path) then begin
    mkdir_p (Filename.dirname path);
    (try Unix.mkdir path 0o755 with _ -> ())
  end

let daemon_bin () =
  let candidates =
    (match Sys.getenv_opt "LOGSEQ_DB_WORKER_BIN" with
     | Some p -> [ p ]
     | None -> [])
    @ [ Filename.concat (Filename.dirname Sys.executable_name)
          "logseq-db-worker"
      ; Filename.concat (Filename.dirname Sys.executable_name)
          "../Resources/logseq-db-worker"
      (* in-tree dune build: <root>/deps/ui/_build/default/ocaml_host/
         -> <root>/deps/db-worker/_build/default/bin/main.exe *)
      ; Filename.concat (Filename.dirname Sys.executable_name)
          "../../../../db-worker/_build/default/bin/main.exe"
      (* launched with the repo root as CWD (e.g. dune exec at root) *)
      ; Filename.concat (Sys.getcwd ())
          "deps/db-worker/_build/default/bin/main.exe"
      ; Filename.concat (home ())
          "repos/logseq-rewrite/deps/db-worker/_build/default/bin/main.exe"
      ; Filename.concat (home ())
          "repos/logseq/deps/db-worker/_build/default/bin/main.exe" ]
  in
  match List.find_opt Sys.file_exists candidates with
  | Some p -> p
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
    if String.length trimmed > String.length prefix
       && String.sub trimmed 0 (String.length prefix) = prefix
    then
      String.sub trimmed (String.length prefix)
        (String.length trimmed - String.length prefix)
    else trimmed
  in
  let name = String.trim name in
  if name = "" then failwith "repo is required";
  name

let encode_graph repo =
  let name = graph_name repo in
  let unreserved c =
    (c >= 'A' && c <= 'Z')
    || (c >= 'a' && c <= 'z')
    || (c >= '0' && c <= '9')
    || c = '-' || c = '_' || c = '.' || c = '!' || c = '*'
    || c = '\'' || c = '(' || c = ')'
  in
  let b = Buffer.create (String.length name) in
  String.iter
    (fun c ->
       if c = ' ' then Buffer.add_char b ' '
       else if unreserved c then Buffer.add_char b c
       else Buffer.add_string b (Printf.sprintf "~%02X" (Char.code c)))
    name;
  Buffer.contents b

let realpath p = try Unix.realpath p with _ -> p

let sha256_hex s =
  Digestif.SHA256.(to_hex (digest_string s))

let lifecycle_dir () =
  let graphs = realpath (graphs_dir ()) in
  let store_id = sha256_hex graphs in
  Filename.concat
    (Filename.concat (Filename.dirname graphs) ".graph-lifecycle")
    store_id

let new_uuid () =
  let ic = open_in_bin "/dev/urandom" in
  let b = really_input_string ic 16 in
  close_in ic;
  let b = Bytes.of_string b in
  Bytes.set b 6 (Char.chr ((Char.code (Bytes.get b 6) land 0x0f) lor 0x40));
  Bytes.set b 8 (Char.chr ((Char.code (Bytes.get b 8) land 0x3f) lor 0x80));
  let hex =
    let buf = Buffer.create 32 in
    Bytes.iter
      (fun c -> Buffer.add_string buf (Printf.sprintf "%02x" (Char.code c)))
      b;
    Buffer.contents buf
  in
  String.sub hex 0 8 ^ "-" ^ String.sub hex 8 4 ^ "-" ^ String.sub hex 12 4
  ^ "-" ^ String.sub hex 16 4 ^ "-" ^ String.sub hex 20 12

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

(* repo -> base-url of the daemon this process is attached to. Daemons
   outlive the app on purpose: a live daemon keeps its repo admission
   and the graph open, so a later launch re-attaches in one healthz
   round-trip instead of paying a cold spawn + graph open. *)
let attached : (string, string) Hashtbl.t = Hashtbl.create 4

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
  mkdir_p (graphs_dir ());
  ensure_graph_created repo;
  let bin = daemon_bin () in
  let log_path =
    Filename.concat (root_dir ())
      ("db-worker-" ^ repo ^ ".log")
  in
  let log_fd =
    Unix.openfile log_path [ Unix.O_CREAT; Unix.O_WRONLY; Unix.O_APPEND ]
      0o644
  in
  let devnull = Unix.openfile "/dev/null" [ Unix.O_RDONLY ] 0 in
  let pid =
    Unix.create_process bin
      [| bin
       ; "--root-dir"
       ; root_dir ()
       ; "--graphs-dir"
       ; graphs_dir ()
       ; "--repo"
       ; repo
       ; "--owner-source"
       ; "electron" |]
      devnull log_fd log_fd
  in
  Unix.close devnull;
  Unix.close log_fd;
  (* poll server-list for our pid *)
  let deadline = Unix.gettimeofday () +. 15. in
  let rec poll () =
    match port_for_pid pid with
    | Some port ->
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

(* /healthz tells us which repo the daemon owns and whether it is
   ready — a ready daemon already holds the admission and has run
   create-or-open-db, so attaching is a warm path. *)
let probe_daemon ~(port : int) : (string * bool) option =
  match http_get ~port ~path:"/healthz" with
  | Some (status, body) when status >= 200 && status < 300 -> (
      try
        match Yojson.Safe.from_string body with
        | `Assoc kvs ->
            let field name =
              match List.assoc_opt name kvs with
              | Some (`String s) -> s
              | _ -> ""
            in
            Some (field "repo", field "status" = "ready")
        | _ -> None
      with _ -> None)
  | _ -> None

let find_live_daemon (repo : string) : string option =
  let entries = read_server_list () in
  boot_mark ("probe server-list entries="
    ^ string_of_int (List.length entries));
  List.find_map
    (fun (pid, port) ->
       match probe_daemon ~port with
       | Some (r, true) when graph_name r = graph_name repo ->
           boot_mark
             ("probe ok pid=" ^ string_of_int pid ^ " port="
              ^ string_of_int port);
           Some ("http://127.0.0.1:" ^ string_of_int port)
       | r ->
           boot_mark
             ("probe fail pid=" ^ string_of_int pid ^ " port="
              ^ string_of_int port ^ " got="
              ^ (match r with
                 | Some (rr, ready) -> rr ^ " ready=" ^ string_of_bool ready
                 | None -> "none"));
           None)
    entries

(* ---------- graph listing ---------- *)

let list_repo_names () : Wire.t list =
  let dir = graphs_dir () in
  if not (Sys.file_exists dir) then []
  else
    Sys.readdir dir |> Array.to_list
    |> List.filter (fun name ->
           name <> "" && name.[0] <> '.'
           && Sys.is_directory (Filename.concat dir name))
    |> List.map (fun name -> Wire.String ("logseq_db_" ^ name))

(* ---------- attach + prewarm ---------- *)

(* Serializes attach-or-spawn across the prewarm thread and ipc callers
   so only one daemon is ever spawned per repo: a second waiter blocks
   on the mutex, then finds the freshly published daemon in
   server-list / `attached`. *)
let attach_mu = Mutex.create ()

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
         let cached = Hashtbl.find_opt attached repo in
         let cached =
           match cached with
           | Some base ->
               (try
                  let port =
                    String.split_on_char ':' base |> List.rev |> List.hd
                    |> int_of_string
                  in
                  match probe_daemon ~port with
                  | Some (r, true) when graph_name r = graph_name repo -> Some base
                  | _ -> None
                with _ -> None)
           | None -> None
         in
         match cached with
         | Some base -> base
      | None ->
          let base =
            match find_live_daemon repo with
            | Some base ->
                boot_mark ("reuse daemon " ^ base);
                base
            | None -> spawn_daemon repo
          in
          Hashtbl.replace attached repo base;
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
          Mutex.lock attach_mu;
          Hashtbl.remove attached repo;
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

let json_field name = function
  | Js.Json.JObject fields -> List.assoc_opt name fields
  | _ -> None
let canonical_repo repo = "logseq_db_" ^ graph_name repo
let normalize_path = Unix.realpath

(* Epochs fence client continuations, not server-side execution. *)
type scope = { repo : string; epoch : int }
type outcome = Not_sent | Outcome_unknown
type request_failure =
  { scope : scope option
  ; method_name : string
  ; outcome : outcome
  ; cause : exn
  }
exception Request_failed of request_failure
exception Remote_error of string
exception Identity_changed of string

type phase = Disconnected | Recovering | Ready | Failed of exn
type lifecycle = { scope : scope option; phase : phase }
type invoke = string -> Wire.t list -> Wire.t Js.Promise.t
type bootstrap =
  { scope : scope
  ; invoke : invoke
  ; is_current : unit -> bool
  }
type identity =
  { base_url : string
  ; repo : string
  ; root : string
  ; graphs_dir : string
  ; lifecycle_dir : string
  ; generation : string
  ; ticket : string
  ; pid : int
  ; port : int
  ; owner_source : string
  ; revision : string
  }
type control =
  { mark_sent : unit -> unit
  ; was_sent : unit -> bool
  ; cancel : unit -> unit
  ; install_cancel : (unit -> unit) -> unit
  }

let pending () =
  let resolve_ref = ref (fun _ -> ()) in
  let reject_ref = ref (fun (_ : exn) -> ()) in
  let promise =
    Js.Promise.make (fun ~resolve ~reject ->
        resolve_ref := (fun v -> resolve v [@u]);
        reject_ref := (fun e -> reject e [@u]))
  in
  promise, (fun v -> !resolve_ref v), (fun e -> !reject_ref e)

let required_string name json =
  match Option.bind (json_field name json) Js.Json.decodeString with
  | Some s when String.trim s <> "" -> s
  | _ -> failwith ("Missing daemon identity field: " ^ name)

let required_int name json =
  match Option.bind (json_field name json) Js.Json.decodeNumber with
  | Some n when n > 0. && n = Float.floor n && n <= float_of_int max_int ->
      int_of_float n
  | _ -> failwith ("Invalid daemon identity field: " ^ name)

let port_of_base base =
  let prefix = "http://127.0.0.1:" in
  let n = String.length prefix in
  if String.length base <= n || String.sub base 0 n <> prefix then
    failwith "Daemon endpoint must be IPv4 loopback";
  match int_of_string_opt (String.sub base n (String.length base - n)) with
  | Some port when port > 0 && port <= 65535 -> port
  | _ -> failwith "Invalid daemon endpoint port"

let decode_identity base json =
  if required_string "status" json <> "ready" then
    failwith "Daemon is not ready";
  if required_string "host" json <> "127.0.0.1"
     || required_string "ownership-protocol" json <> "sqlite-v1" then
    failwith "Unsupported daemon ownership";
  let storage =
    match json_field "storage" json with
    | Some s -> s
    | None -> failwith "Daemon storage identity is missing"
  in
  let port = required_int "port" json in
  if port <> port_of_base base then failwith "Daemon port identity changed";
  let root = normalize_path (required_string "root" storage) in
  if root <> normalize_path (required_string "root-dir" json) then
    failwith "Daemon root identity disagrees";
  { base_url = base
  ; repo = canonical_repo (required_string "repo" json)
  ; root
  ; graphs_dir = normalize_path (required_string "graphsDir" storage)
  ; lifecycle_dir = normalize_path (required_string "lifecycleDir" storage)
  ; generation = required_string "generation" json
  ; ticket = required_string "ticket" json
  ; pid = required_int "pid" json
  ; port
  ; owner_source = required_string "owner-source" json
  ; revision = required_string "revision" json
  }

let verify_binding (old : identity) (next : identity) =
  if old.repo <> next.repo || old.root <> next.root
     || old.graphs_dir <> next.graphs_dir
     || old.lifecycle_dir <> next.lifecycle_dir
     || old.generation <> next.generation then
    raise (Identity_changed "Graph or storage incarnation changed")

let verify_instance (old : identity) (next : identity) =
  verify_binding old next;
  if old.pid <> next.pid || old.ticket <> next.ticket
     || old.base_url <> next.base_url || old.owner_source <> next.owner_source
     || old.revision <> next.revision then
    raise (Identity_changed "Worker changed while attaching")

let decode_reply json =
  match Option.bind (json_field "ok" json) Js.Json.decodeBoolean with
  | Some false ->
      let message =
        match json_field "error" json with
        | Some error ->
            Option.value
              (Option.bind (json_field "message" error) Js.Json.decodeString)
              ~default:"Daemon rejected request"
        | None -> "Daemon rejected request"
      in
      raise (Remote_error message)
  | Some true ->
      (match Option.bind (json_field "resultTransit" json) Js.Json.decodeString with
       | Some result -> Transit.of_string result
       | None -> failwith "Daemon response has no resultTransit")
  | None -> failwith "Malformed daemon response"

let deliver sink data =
  let json = Js.Json.parseExn data in
  match Option.bind (json_field "payload" json) Js.Json.decodeString with
  | Some payload ->
      (match Transit.of_string payload with
       | Wire.Array (Wire.Keyword kind :: rest)
       | Wire.List (Wire.Keyword kind :: rest) ->
           sink kind (match rest with [p] -> p | _ -> Wire.Array rest)
       | _ -> failwith "Malformed daemon event")
  | None -> failwith "Daemon event has no payload"

let after seconds callback =
  let cancelled = Atomic.make false in
  ignore (Thread.create (fun () ->
      Unix.sleepf seconds;
      Host.enqueue (fun () -> if not (Atomic.get cancelled) then callback ())) ());
  fun () -> Atomic.set cancelled true

let control () =
  let mutex = Mutex.create () in
  let sent = ref false and cancelled = ref false in
  let close = ref (fun () -> ()) in
  let locked f =
    Mutex.lock mutex;
    Fun.protect ~finally:(fun () -> Mutex.unlock mutex) f
  in
  { mark_sent = (fun () -> locked (fun () ->
        if !cancelled then failwith "Request cancelled";
        sent := true))
  ; was_sent = (fun () -> locked (fun () -> !sent))
  ; cancel = (fun () -> locked (fun () -> cancelled := true; !close ()))
  ; install_cancel = (fun f -> locked (fun () ->
        close := f;
        if !cancelled then f ()))
  }

let async f =
  let promise, resolve, reject = pending () in
  ignore (Thread.create (fun () ->
      match f () with
      | value -> Host.enqueue (fun () -> resolve value)
      | exception error -> Host.enqueue (fun () -> reject error)) ());
  promise

let with_socket ctl port f =
  let fd = Unix.socket Unix.PF_INET Unix.SOCK_STREAM 0 in
  let mutex = Mutex.create () in
  let open_ = ref true in
  let locked f =
    Mutex.lock mutex;
    Fun.protect ~finally:(fun () -> Mutex.unlock mutex) f
  in
  ctl.install_cancel (fun () -> locked (fun () ->
      if !open_ then (try Unix.shutdown fd Unix.SHUTDOWN_ALL with Unix.Unix_error _ -> ())));
  Fun.protect
    ~finally:(fun () -> locked (fun () -> open_ := false; Unix.close fd))
    (fun () ->
      Unix.connect fd (Unix.ADDR_INET (Unix.inet_addr_loopback, port));
      let ic = Unix.in_channel_of_descr fd in
      let send text =
        let bytes = Bytes.of_string text in
        ctl.mark_sent ();
        let rec loop pos =
          if pos < Bytes.length bytes then
            let n = Unix.write fd bytes pos (Bytes.length bytes - pos) in
            if n = 0 then raise End_of_file else loop (pos + n)
        in loop 0
      in
      f ic send)

let response_headers ?(require_ok = true) ic =
  let status =
    match String.split_on_char ' ' (input_line ic) with
    | _ :: code :: _ -> int_of_string code
    | _ -> failwith "Malformed HTTP status"
  in
  if require_ok && status <> 200 then
    failwith ("Daemon HTTP status " ^ string_of_int status);
  let rec loop headers =
    match String.trim (input_line ic) with
    | "" -> headers
    | line ->
        (match String.index_opt line ':' with
         | Some i ->
             let name = String.lowercase_ascii (String.sub line 0 i) in
             let value = String.trim (String.sub line (i+1) (String.length line-i-1)) in
             loop ((name, value) :: headers)
         | None -> failwith "Malformed HTTP header")
  in loop []

let read_http_body ic headers consume =
  match List.assoc_opt "transfer-encoding" headers with
  | Some encoding when String.lowercase_ascii encoding = "chunked" ->
      let rec chunks () =
        let size = input_line ic |> String.trim |> String.split_on_char ';' |> List.hd in
        let size = int_of_string ("0x" ^ size) in
        if size < 0 then failwith "Invalid HTTP chunk";
        if size > 0 then (
          let rec bytes remaining =
            if remaining > 0 then (
              let n = min remaining 4096 in
              consume (really_input_string ic n);
              bytes (remaining - n))
          in
          bytes size;
          if input_line ic <> "\r" then failwith "Invalid HTTP chunk delimiter";
          chunks ())
      in chunks ()
  | Some _ -> failwith "Unsupported HTTP transfer encoding"
  | None ->
      (match List.assoc_opt "content-length" headers with
       | Some length ->
           let rec bytes remaining =
             if remaining > 0 then (
               let n = min remaining 4096 in
               consume (really_input_string ic n);
               bytes (remaining-n))
           in bytes (int_of_string length)
       | None ->
           let bytes = Bytes.create 4096 in
           let rec loop () =
             match input ic bytes 0 4096 with
             | 0 -> ()
             | n -> consume (Bytes.sub_string bytes 0 n); loop ()
           in loop ())

let raw_post ctl base name args =
  let body =
    Yojson.Safe.to_string
      (`Assoc [ "method", `String name
              ; "argsTransit", `String (Transit.to_string (Wire.Array args)) ])
  in
  let port = port_of_base base in
  async (fun () ->
      with_socket ctl port (fun ic send ->
          send (Printf.sprintf
            "POST /v1/invoke HTTP/1.1\r\nHost: 127.0.0.1:%d\r\nContent-Type: application/json\r\nContent-Length: %d\r\nConnection: close\r\n\r\n%s"
            port (String.length body) body);
          let headers = response_headers ~require_ok:false ic in
          let body = Buffer.create 4096 in
          read_http_body ic headers (Buffer.add_string body);
          decode_reply (Js.Json.parseExn (Buffer.contents body))))

let probe_identity base =
  let port = port_of_base base in
  async (fun () ->
      match http_get ~port ~path:"/healthz" with
      | Some (200, body) ->
          let id = decode_identity base (Js.Json.parseExn body) in
          if id.root <> Unix.realpath (root_dir ())
             || id.graphs_dir <> Unix.realpath (graphs_dir ())
             || id.lifecycle_dir <> Unix.realpath (lifecycle_dir ()) then
            raise (Identity_changed "Daemon belongs to another storage root");
          id
      | _ -> failwith "Daemon health probe failed")

let existing_generation repo =
  let path = Filename.concat (Filename.concat (lifecycle_dir ()) (encode_graph repo)) "state.json" in
  match Yojson.Safe.from_file path with
  | `Assoc fields when List.assoc_opt "phase" fields = Some (`String "available")
                      && Sys.file_exists (Filename.concat (graphs_dir ()) (encode_graph repo)) ->
      (match List.assoc_opt "generation" fields with
       | Some (`String generation) when generation <> "" -> generation
       | _ -> failwith "Graph generation is missing")
  | _ -> failwith "Graph is not available"

let prepare_explicit ~is_current repo creating =
  let* generation =
    async (fun () ->
        if creating then ensure_graph_created repo;
        existing_generation repo)
  in
  if not (is_current ()) then failwith "Daemon connection superseded";
  let* rt = ipc [Wire.String "db-worker-runtime"; Wire.String repo; Wire.Map []] in
  if not (is_current ()) then failwith "Daemon connection superseded";
  match Wire.map_get_string rt "base-url" with
  | Some base ->
      let* id = probe_identity base in
      if id.repo <> repo || id.generation <> generation then
        Js.Promise.reject (Identity_changed "Runtime graph identity disagrees")
      else Js.Promise.resolve id
  | None -> Js.Promise.reject (Failure "Runtime has no daemon endpoint")

let discover (old : identity) =
  let* entries = async read_server_list in
  let rec loop = function
    | [] -> Js.Promise.resolve None
    | (pid,port) :: rest ->
        let base = "http://127.0.0.1:" ^ string_of_int port in
        let probe =
          let* id = probe_identity base in
          if id.pid = pid && id.repo = old.repo then (
            verify_binding old id;
            Js.Promise.resolve (Some id))
          else Js.Promise.resolve None
        in
        let* candidate =
          probe |> Js.Promise.catch (function
            | Identity_changed _ as e -> Js.Promise.reject e
            | _ -> Js.Promise.resolve None)
        in
        match candidate with Some _ -> Js.Promise.resolve candidate | None -> loop rest
  in loop entries

let remember (id : identity) =
  Mutex.lock attach_mu;
  Hashtbl.replace attached id.repo id.base_url;
  Mutex.unlock attach_mu

let stream ctl (id : identity) on_keepalive on_data on_end =
  ignore (Thread.create (fun () ->
      let result =
        try
          with_socket ctl id.port (fun ic send ->
              send (Printf.sprintf
                "GET /v1/events HTTP/1.1\r\nHost: 127.0.0.1:%d\r\nAccept: text/event-stream\r\n\r\n" id.port);
              let headers = response_headers ic in
              if List.assoc_opt "content-type" headers <> Some "text/event-stream" then
                failwith "Daemon events are not an SSE stream";
              let line = Buffer.create 256 and data = Buffer.create 1024 in
              let consume_line () =
                let value = Buffer.contents line in
                Buffer.clear line;
                if value = ": keepalive" then Host.enqueue on_keepalive
                else if value = "" then (
                  if Buffer.length data > 0 then (
                    let event = Buffer.contents data in
                    Buffer.clear data;
                    Host.enqueue (fun () -> on_data event)))
                else if String.starts_with ~prefix:"data:" value then (
                  let value = String.sub value 5 (String.length value-5) in
                  let value = if String.starts_with ~prefix:" " value then
                      String.sub value 1 (String.length value-1) else value in
                  if Buffer.length data > 0 then Buffer.add_char data '\n';
                  Buffer.add_string data value)
              in
              let previous_cr = ref false in
              read_http_body ic headers (fun bytes ->
                  String.iter (fun c ->
                      if c = '\r' then (consume_line (); previous_cr := true)
                      else if c = '\n' then (
                        if not !previous_cr then consume_line ();
                        previous_cr := false)
                      else (previous_cr := false; Buffer.add_char line c)) bytes));
          Failure "Daemon event stream ended"
        with error -> error
      in Host.enqueue (fun () -> on_end result)) ())

type attempt =
  { scope : scope
  ; promise : scope Js.Promise.t
  ; resolve : scope -> unit
  ; reject : exn -> unit
  ; mutable cancel_timer : unit -> unit
  }
type call =
  { scope : scope
  ; name : string
  ; control : control
  ; reject : exn -> unit
  }
type hooks =
  { on_state : lifecycle -> unit
  ; on_request_failure : request_failure -> unit
  ; rehydrate : bootstrap -> unit Js.Promise.t
  }
type transport =
  { mutable base_url : string
  ; mutable repo : string
  ; mutable sink : string -> Wire.t -> unit
  ; dead : string Js.Promise.t
  ; mutable epoch : int
  ; mutable status : lifecycle
  ; mutable hooks : hooks option
  ; mutable binding : identity option
  ; mutable attempt : attempt option
  ; mutable stop_stream : unit -> unit
  ; calls : (int, call) Hashtbl.t
  ; mutable next_call : int
  ; mutable handle_loss : scope -> exn -> unit
  }

let lifecycle t = t.status
let is_current t (scope : scope) =
  t.epoch = scope.epoch && t.status.scope = Some scope

let publish t phase =
  t.status <- { t.status with phase };
  match t.hooks with Some hooks -> hooks.on_state t.status | None -> ()

let report_failure t (scope : scope option) name outcome cause reject =
  let failure = {scope; method_name = name; outcome; cause} in
  reject (Request_failed failure);
  match t.hooks with
  | Some hooks ->
      if outcome = Outcome_unknown
         || (match scope with None -> true | Some scope -> t.epoch = scope.epoch)
      then hooks.on_request_failure failure
  | None -> ()

let retire t cause =
  t.epoch <- t.epoch + 1;
  let epoch = t.epoch in
  t.status <- {scope = None; phase = Disconnected};
  t.base_url <- "";
  t.repo <- "";
  let stop_stream = t.stop_stream in
  t.stop_stream <- (fun () -> ());
  let attempt = t.attempt in
  t.attempt <- None;
  let calls = Hashtbl.fold (fun _ call acc -> call :: acc) t.calls [] in
  Hashtbl.clear t.calls;
  stop_stream ();
  List.iter (fun (call : call) ->
      call.control.cancel ();
      report_failure t (Some call.scope) call.name
        (if call.control.was_sent () then Outcome_unknown else Not_sent)
        cause call.reject) calls;
  (match attempt with
   | Some attempt -> attempt.cancel_timer (); attempt.reject cause
   | None -> ());
  epoch

let disconnect t =
  let epoch = retire t (Failure "Daemon client disconnected") in
  if t.epoch = epoch then publish t Disconnected

let fail_attempt t (scope : scope) error =
  if is_current t scope then (
    let epoch = retire t error in
    if t.epoch = epoch then (
      t.status <- {scope = Some scope; phase = Failed error};
      publish t (Failed error)))

let dispatch t (scope : scope) base name args =
  if not (is_current t scope) then (
    let promise, _, reject = pending () in
    report_failure t (Some scope) name Not_sent (Failure "Stale daemon scope") reject;
    promise)
  else if name = "thread-api/init" then Js.Promise.resolve Wire.Nil
  else
    let promise, resolve, reject = pending () in
    let id = t.next_call in
    t.next_call <- id + 1;
    let call = {scope; name; control = control (); reject} in
    Hashtbl.add t.calls id call;
    let finish f =
      if Hashtbl.mem t.calls id then (
        Hashtbl.remove t.calls id;
        f ())
    in
    let request =
      try raw_post call.control base name args
      with error -> Js.Promise.reject error
    in
    ignore (request |> Js.Promise.then_ (fun result ->
        if is_current t scope then finish (fun () -> resolve result);
        Js.Promise.resolve ())
      |> Js.Promise.catch (fun error ->
        (match error with
         | Remote_error _ -> finish (fun () -> reject error)
         | _ ->
             if is_current t scope then t.handle_loss scope error);
        Js.Promise.resolve ()));
    promise

let rec start ?(cause = Failure "Daemon connection superseded") t repo explicit open_request =
  match t.hooks with
  | None -> Js.Promise.reject (Failure "Daemon recovery hooks are not configured")
  | Some hooks ->
      let old =
        match t.binding with Some id when id.repo = repo -> Some id | _ -> None
      in
      let epoch = retire t cause in
      if t.epoch <> epoch then Js.Promise.reject (Failure "Daemon connection superseded")
      else
        let scope = {repo; epoch} in
        let promise, resolve, reject = pending () in
        let attempt = {scope; promise; resolve; reject; cancel_timer = (fun () -> ())} in
        t.attempt <- Some attempt;
        t.status <- {scope = Some scope; phase = Recovering};
        attempt.cancel_timer <- after 60. (fun () ->
            if is_current t scope then fail_attempt t scope (Failure "Daemon connect timed out"));
        publish t Recovering;
        let current () =
          is_current t scope
          && (match t.attempt with Some active -> active == attempt | None -> false)
        in
        let check () = if not (current ()) then failwith "Daemon connection superseded" in
        let rec find () =
          check ();
          match old with
          | None -> Js.Promise.reject (Failure "No previously bound daemon to rediscover")
          | Some old ->
              let* candidate = discover old in
              check ();
              (match candidate with
               | Some id -> Js.Promise.resolve id
               | None ->
                   let delayed, resolve, _ = pending () in
                   let _cancel_delay = after 0.2 (fun () -> resolve ()) in
                   let* () = delayed in find ())
        in
        let connecting =
          try
            check ();
            let creating =
              match open_request with
              | Some ([_; (Wire.Map _ as opts)], _) -> Wire.get opts "config" <> None
              | _ -> false
            in
            let* id =
              if explicit then prepare_explicit ~is_current:current repo creating else find ()
            in
            check ();
            (match old with Some old when not creating -> verify_binding old id | _ -> ());
            if id.repo <> repo then raise (Identity_changed "Daemon repo identity changed");
            remember id;
            t.binding <- Some id;
            t.repo <- repo;
            t.base_url <- id.base_url;
            let* () =
              match open_request with
              | None -> Js.Promise.resolve ()
              | Some (args, result) ->
                  let* value = dispatch t scope id.base_url "thread-api/create-or-open-db" args in
                  result := value;
                  Js.Promise.resolve ()
            in
            check ();
            let subscribed, subscribed_resolve, subscribed_reject = pending () in
            let ctl = control () in
            t.stop_stream <- ctl.cancel;
            let observed = ref false in
            stream ctl id
              (fun () -> if current () && not !observed then (
                  observed := true; subscribed_resolve ()))
              (fun data -> if is_current t scope then (
                  try deliver t.sink data
                  with error -> t.handle_loss scope error))
              (fun error -> if is_current t scope then (
                  subscribed_reject error;
                  t.handle_loss scope error));
            let* () = subscribed in
            check ();
            let* confirmed = probe_identity id.base_url in
            check ();
            verify_instance id confirmed;
            let bootstrap =
              {scope
              ; invoke = (fun name args -> dispatch t scope id.base_url name args)
              ; is_current = (fun () -> is_current t scope)
              }
            in
            let* () = hooks.rehydrate bootstrap in
            check ();
            attempt.cancel_timer ();
            publish t Ready;
            if is_current t scope then (
              t.attempt <- None;
              resolve scope);
            Js.Promise.resolve ()
          with error -> Js.Promise.reject error
        in
        ignore (connecting |> Js.Promise.catch (fun error ->
            if is_current t scope then fail_attempt t scope error;
            Js.Promise.resolve ()));
        promise

and lost t scope error =
  if is_current t scope then
    match t.status.phase with
    | Ready ->
        ignore (
          start ~cause:error t scope.repo false None
          |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
          |> Js.Promise.catch (fun _ -> Js.Promise.resolve ()))
    | Recovering -> fail_attempt t scope error
    | Disconnected | Failed _ -> ()

let configure_recovery t ~on_state ~on_request_failure ~rehydrate =
  match t.status.phase with
  | Recovering | Ready -> invalid_arg "Cannot replace active daemon recovery hooks"
  | Disconnected | Failed _ ->
      t.hooks <- Some {on_state; on_request_failure; rehydrate};
      on_state t.status

let connect t ~repo =
  try
    let repo = canonical_repo repo in
    match t.status.phase, t.status.scope, t.attempt with
    | Ready, Some scope, _ when scope.repo = repo -> Js.Promise.resolve scope
    | Recovering, Some scope, Some attempt when scope.repo = repo -> attempt.promise
    | _ -> start t repo true None
  with error -> Js.Promise.reject error

let list_graphs () =
  let* graphs = ipc [Wire.String "getGraphs"] in
  match graphs with
  | Wire.Array names | Wire.List names ->
      Js.Promise.resolve
        (Wire.Array (List.map (fun name -> Wire.Map [Wire.kw "name", name]) names))
  | _ -> Js.Promise.reject (Failure "Malformed graph listing")

let invoke t name args =
  match name with
  | "thread-api/init" -> Js.Promise.resolve Wire.Nil
  | "thread-api/list-db" -> list_graphs ()
  | "thread-api/create-or-open-db" ->
      (match args with
       | Wire.String repo :: _ ->
           let result = ref Wire.Nil in
           let* _ = start t (canonical_repo repo) true (Some (args, result)) in
           Js.Promise.resolve !result
       | _ -> Js.Promise.reject (Failure "create-or-open-db requires a repo"))
  | _ ->
      (match t.status.phase, t.status.scope with
       | Ready, Some scope -> dispatch t scope t.base_url name args
       | _ ->
           let promise, _, reject = pending () in
           let scope =
             match t.status.scope with
             | Some scope when is_current t scope -> Some scope
             | _ -> None
           in
           report_failure t scope name Not_sent
             (Failure "Daemon model is not ready") reject;
           promise)

let create_transport () =
  let t =
    { base_url = ""; repo = ""; sink = (fun _ _ -> ())
    ; dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())
    ; epoch = 0; status = {scope = None; phase = Disconnected}
    ; hooks = None; binding = None; attempt = None
    ; stop_stream = (fun () -> ())
    ; calls = Hashtbl.create 16; next_call = 0
    ; handle_loss = (fun _ _ -> ())
    }
  in
  t.handle_loss <- lost t;
  t

let is_electron () = true
