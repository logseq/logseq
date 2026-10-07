(* Native twin of core/daemon_client.ml.

   Same contract, different transport plumbing: instead of fetch +
   EventSource + window.apis.doAction, we spawn the OCaml daemon
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

let boot_mark msg =
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
          Unix.sleepf 0.01;
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
       | Some (r, true) when r = repo ->
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
      match Hashtbl.find_opt attached repo with
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
  | None -> ()
  | Some repo ->
      boot_mark ("prewarm " ^ repo);
      ignore (ensure_attached repo);
      ensure_login_daemon repo

let () = ignore (Thread.create (fun () -> prewarm ()) ())

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

(* ---------- http ---------- *)

(* minimal blocking HTTP over a socket; localhost only *)
let http_post ~(host : string) ~(port : int) ~(path : string)
    ~(body : string) : (int * string) =
  let addr = Unix.ADDR_INET (Unix.inet_addr_of_string host, port) in
  let ic, oc = Unix.open_connection addr in
  let req =
    Printf.sprintf
      "POST %s HTTP/1.1\r\nHost: %s:%d\r\nContent-Type: \
       application/json\r\nContent-Length: %d\r\nConnection: \
       close\r\n\r\n%s"
      path host port (String.length body) body
  in
  output_string oc req;
  flush oc;
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
  Unix.close (Unix.descr_of_in_channel ic);
  (status, Buffer.contents buf)

let http_get_stream ~(host : string) ~(port : int) ~(path : string)
    ~(on_line : string -> unit) ~(alive : unit -> bool) : unit =
  let addr = Unix.ADDR_INET (Unix.inet_addr_of_string host, port) in
  let fd = Unix.socket Unix.PF_INET Unix.SOCK_STREAM 0 in
  (try
     Unix.connect fd addr;
     let oc = Unix.out_channel_of_descr fd in
     Printf.fprintf oc
       "GET %s HTTP/1.1\r\nHost: %s:%d\r\nAccept: \
        text/event-stream\r\n\r\n"
       path host port;
     flush oc;
     let ic = Unix.in_channel_of_descr fd in
     (* consume status + headers *)
     let rec skip_headers () =
       let line = input_line ic in
       if line <> "" && line <> "\r" then skip_headers ()
     in
     ignore (input_line ic);
     skip_headers ();
     while alive () do
       match input_line ic with
       | line -> on_line line
       | exception End_of_file -> raise Exit
       | exception _ -> raise Exit
     done
   with Exit -> ()
  | e ->
      prerr_endline
        ("[daemon] SSE stream ended: " ^ Printexc.to_string e));
  (try Unix.close fd with _ -> ())

(* ---------- transport ---------- *)

type sse_state = { mutable stop : bool }

type transport =
  { mutable base_url : string
  ; mutable repo : string
  ; mutable sse : sse_state option
  ; mutable sink : string -> Wire.t -> unit
  ; pending : (string * Wire.t list) Queue.t
  ; dead : string Js.Promise.t
  }

let json_field (name : string) (j : Js.Json.t) : Js.Json.t option =
  match j with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt name kvs with
      | Some v -> Some v
      | None -> None)
  | _ -> None

let post_invoke (base_url : string) (name : string) (args : Wire.t list)
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
           let _status, resp = http_post ~host ~port ~path:"/v1/invoke" ~body in
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
    (state : sse_state) : unit =
  http_get_stream ~host ~port ~path:"/v1/events"
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
                     Host.enqueue (fun () -> sink kind payload)
                 | _ -> ())
             | None -> ())
         | None -> ()))

let attach (t : transport) (repo : string) (base_url : string) : unit =
  (match t.sse with
   | Some s -> s.stop <- true
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
  let state = { stop = false } in
  t.sse <- Some state;
  t.base_url <- base_url;
  t.repo <- repo;
  boot_mark ("sse attach " ^ repo);
  ignore (Thread.create (fun () -> sse_thread t host port state) ())

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
      let name, args = Queue.take t.pending in
      let* _ = post_invoke t.base_url name args in
      loop ()
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
        Queue.add (name, args) t.pending;
        Js.Promise.resolve Wire.Nil)
      else post_invoke t.base_url name args

let create_transport () : transport =
  { base_url = ""
  ; repo = ""
  ; sse = None
  ; sink = (fun _ _ -> ())
  ; pending = Queue.create ()
  ; dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())
  }

let is_electron () = true
