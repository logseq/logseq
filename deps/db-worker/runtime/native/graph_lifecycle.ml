(* deps/graph-lifecycle native port — the daemon-side surface only:
   resolveStorage, context, admit, publish, checkAdmission,
   assertOwnership, releaseOwnership, recordStop, abortAdmission,
   createGraph, ownershipPath, acquireOwnership, release.

   The on-disk protocol (lease.sqlite under <lifecycleDir>/<graph>/,
   state.json, runtime-<ticket>.json, the per-graph sqlite ownership
   lock under <home>/…/Logseq/runtime-locks/<sha256>/lock.sqlite and
   the <root>/server-list registry) is byte-compatible with the JS
   implementation in deps/graph-lifecycle/*.cjs so the cljs
   orchestrators (electron, cli) interoperate unchanged. *)

module E = Db_worker_effect

let protocol = "sqlite-v1"

exception Lifecycle_error of string * string (* message, code *)

let fail ?(code = "server-stop-failed") msg : 'a =
  raise (Lifecycle_error (msg, code))

let () =
  Printexc.register_printer (function
    | Lifecycle_error (msg, code) -> Some (code ^ ": " ^ msg)
    | _ -> None)

(* JS Date.now — integer milliseconds are enough here. *)
let now_ms () : int = int_of_float (Unix.gettimeofday () *. 1000.)

let sleep_ms (ms : int) : unit = Node_process.sleep_sync_ms ms

let new_id () : string = Uuid_gen.uuid ()

(* settle an E.t inline — every op used here resolves synchronously on
   native. *)
let sync (t : 'a E.t) : 'a =
  let result : ('a, exn) result option ref = ref None in
  E.on_any t (fun v -> result := Some (Ok v)) (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok v) -> v
  | Some (Error e) -> raise e
  | None -> invalid_arg "Graph_lifecycle: async operation did not settle"

(* ---- fs / json ---- *)

let mkdir_p (dir : string) : unit =
  let rec go path =
    if path <> "" && path <> "/" && not (Sys.file_exists path) then begin
      go (Filename.dirname path);
      Unix.mkdir path 0o755
    end
  in
  go dir

let file_exists (path : string) : bool = Sys.file_exists path

let realpath (path : string) : string = Unix.realpath path

let read_text_opt (file : string) : string option =
  if not (Sys.file_exists file) then None
  else
    let ic = open_in_bin file in
    let n = in_channel_length ic in
    let s = really_input_string ic n in
    close_in ic;
    Some s

let remove_file (file : string) : unit =
  if Sys.file_exists file then Sys.remove file

(* writeJSON — tmp file with 'wx' then rename. *)
let write_json (file : string) (value : Yojson.Safe.t) : unit =
  let tmp = file ^ "." ^ new_id () ^ ".tmp" in
  (try
     let oc =
       open_out_gen [ Open_wronly; Open_creat; Open_excl; Open_binary ] 0o644 tmp
     in
     output_string oc (Yojson.Safe.to_string value);
     close_out oc;
     Unix.rename tmp file
   with exn -> remove_file tmp; raise exn)

let read_json (file : string) : Yojson.Safe.t option =
  match read_text_opt file with
  | None -> None
  | Some raw -> Some (Yojson.Safe.from_string raw)

(* ---- json accessors ---- *)

let jget (j : Yojson.Safe.t) (key : string) : Yojson.Safe.t option =
  match j with
  | `Assoc kvs -> List.assoc_opt key kvs
  | _ -> None

let jstr (j : Yojson.Safe.t) (key : string) : string option =
  match jget j key with
  | Some (`String s) -> Some s
  | _ -> None

let jint (j : Yojson.Safe.t) (key : string) : int option =
  match jget j key with
  | Some (`Int n) -> Some n
  | Some (`Intlit s) -> int_of_string_opt s
  | Some (`Float f) -> Some (int_of_float f)
  | _ -> None

let jbool (j : Yojson.Safe.t) (key : string) : bool option =
  match jget j key with
  | Some (`Bool b) -> Some b
  | _ -> None

let jobj (j : Yojson.Safe.t) (key : string) : Yojson.Safe.t option =
  match jget j key with
  | Some (`Assoc _ as o) -> Some o
  | _ -> None

let jhas (j : Yojson.Safe.t) (key : string) : bool = jget j key <> None

(* ---- names / paths ---- *)

let home_dir () : string = Node_process.home_dir ()

let expand_home (path : string) : string =
  if String.length path > 1 && String.sub path 0 2 = "~/"
  then Filename.concat (home_dir ()) (String.sub path 2 (String.length path - 2))
  else path

let graph_name (repo : string) : string =
  if repo = "" then fail ~code:"missing-repo" "repo is required";
  let trimmed = String.trim repo in
  let name =
    let prefix = "logseq_db_" in
    if String.length trimmed >= String.length prefix
       && String.sub trimmed 0 (String.length prefix) = prefix
    then
      String.sub trimmed (String.length prefix)
        (String.length trimmed - String.length prefix)
    else trimmed
  in
  let name = String.trim name in
  if name = "" then fail ~code:"missing-repo" "repo is required";
  name

(* encodeGraph — encodeURIComponent then %20->' ', '~'->%7E, '%'->'~'. *)
let encode_graph (repo : string) : string =
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

let canonical_root (root : string) : string =
  if root = "" then fail ~code:"missing-root-dir" "root-dir is required";
  realpath (expand_home root)

let runtime_root_dir () : string =
  let home = home_dir () in
  let sysname =
    if Sys.os_type = "Win32" then "windows"
    else
      match Node_process.spawn_stdout "uname" [ "uname"; "-s" ] with
      | Some (0, out) -> String.lowercase_ascii (String.trim out)
      | _ -> "linux"
  in
  match sysname with
  | "darwin" ->
      Filename.concat
        (Filename.concat home "Library")
        (Filename.concat "Application Support"
           (Filename.concat "Logseq" "runtime-locks"))
  | "windows" ->
      Filename.concat home
        (Filename.concat "AppData"
           (Filename.concat "Local"
              (Filename.concat "Logseq" "runtime-locks")))
  | _ ->
      Filename.concat home
        (Filename.concat ".local"
           (Filename.concat "state"
              (Filename.concat "Logseq" "runtime-locks")))

type storage =
  { root : string
  ; graphs_dir : string
  ; lifecycle_dir : string
  }

type ctx =
  { root : string
  ; graphs_dir : string
  ; lifecycle_dir : string
  ; repo : string
  ; dir : string
  ; graph_dir : string
  ; state_file : string
  }

let resolve_storage ~root ~graphs_dir : storage =
  mkdir_p root;
  let root = canonical_root root in
  if graphs_dir = "" then
    fail ~code:"missing-graphs-dir" "graphs-dir is required";
  mkdir_p graphs_dir;
  let graphs_dir = canonical_root graphs_dir in
  let store_id = sync (Crypto.sha256_hex graphs_dir) in
  let lifecycle_dir =
    Filename.concat
      (Filename.concat (Filename.dirname graphs_dir) ".graph-lifecycle")
      store_id
  in
  mkdir_p lifecycle_dir;
  { root; graphs_dir; lifecycle_dir }

let context ~(storage : storage) ~(repo : string) : ctx =
  if storage.root = "" || storage.graphs_dir = "" || storage.lifecycle_dir = ""
  then fail "Canonical storage context is required";
  let repo = graph_name repo in
  let dir = Filename.concat storage.lifecycle_dir (encode_graph repo) in
  mkdir_p dir;
  { root = storage.root
  ; graphs_dir = storage.graphs_dir
  ; lifecycle_dir = storage.lifecycle_dir
  ; repo
  ; dir
  ; graph_dir = Filename.concat storage.graphs_dir (encode_graph repo)
  ; state_file =
      Filename.concat
        (Filename.concat storage.lifecycle_dir (encode_graph repo))
        "state.json" }

let snapshot (storage : storage) (repo : string) : Yojson.Safe.t option =
  read_json
    (Filename.concat
       (Filename.concat storage.lifecycle_dir (encode_graph repo))
       "state.json")

let same_storage (ctx : ctx) (value : Yojson.Safe.t) : bool =
  match jstr value "graphsDir", jstr value "lifecycleDir" with
  | Some gd, Some ld ->
      (try
         canonical_root gd = ctx.graphs_dir && canonical_root ld = ctx.lifecycle_dir
       with _ -> false)
  | _ -> false

let pid_exists (pid : int) : bool =
  if pid <= 0 then fail "Invalid PID";
  match Node_process.kill0 pid with
  | Node_process.Alive -> true
  | Node_process.Not_found -> false
  (* JS process.kill(pid, 0) propagates EPERM and other errors. *)
  | Node_process.No_permission | Node_process.Error ->
      fail (Printf.sprintf "pid %d is not inspectable" pid)

let signal_process (pid : int) (signal : int) : unit =
  if pid = Node_process.pid () then fail "Cannot stop the calling process";
  if not (pid_exists pid) then ()
  else
    try Unix.kill pid signal
    with Unix.Unix_error (Unix.ESRCH, _, _) -> ()

let sigterm = Sys.sigterm
let sigkill = Sys.sigkill

(* ---- http probes (health / shutdown) ---- *)

type http_response =
  { status : int
  ; body : string
  }

exception Http_request_failed

let str_find_sub (hay : string) (needle : string) (from : int) : int option =
  let n = String.length needle and h = String.length hay in
  let rec go i =
    if i + n > h then None
    else if String.sub hay i n = needle then Some i
    else go (i + 1)
  in
  if from + n > h then None else go from

(* Blocking http.request equivalent: 1s socket timeouts, loopback only.
   Handles Content-Length, chunked (the daemon writes chunked bodies),
   and read-to-EOF responses. *)
let http_request ~(port : int) ~(path : string) ?(method_ = "GET")
    ?(headers = []) () : http_response =
  let fail_req () = raise Http_request_failed in
  let fd = Unix.socket ~cloexec:true Unix.PF_INET Unix.SOCK_STREAM 0 in
  let result =
    try
      Unix.setsockopt_float fd Unix.SO_RCVTIMEO 1.0;
      Unix.setsockopt_float fd Unix.SO_SNDTIMEO 1.0;
      Unix.connect fd (Unix.ADDR_INET (Unix.inet_addr_loopback, port));
      let b = Buffer.create 256 in
      Buffer.add_string b (method_ ^ " " ^ path ^ " HTTP/1.1\r\n");
      Buffer.add_string b
        ("Host: 127.0.0.1:" ^ string_of_int port ^ "\r\n");
      List.iter
        (fun (k, v) -> Buffer.add_string b (k ^ ": " ^ v ^ "\r\n"))
        headers;
      Buffer.add_string b "Connection: close\r\n\r\n";
      let req = Buffer.contents b in
      ignore (Unix.write_substring fd req 0 (String.length req));
      let out = Buffer.create 1024 in
      let tmp = Bytes.create 8192 in
      let rec loop () =
        match Unix.read fd tmp 0 (Bytes.length tmp) with
        | 0 -> ()
        | n -> Buffer.add_subbytes out tmp 0 n; loop ()
      in
      loop ();
      let raw = Buffer.contents out in
      let head_end =
        match str_find_sub raw "\r\n\r\n" 0 with
        | Some i -> i
        | None -> fail_req ()
      in
      let head = String.sub raw 0 head_end in
      let body_raw =
        String.sub raw (head_end + 4) (String.length raw - head_end - 4)
      in
      let status =
        match String.split_on_char ' ' head with
        | _http :: code :: _ ->
            (match int_of_string_opt code with
             | Some n -> n
             | None -> fail_req ())
        | _ -> fail_req ()
      in
      let headers_map =
        String.split_on_char '\n' head
        |> List.tl
        |> List.filter_map (fun line ->
            match String.index_opt line ':' with
            | Some i ->
                Some
                  ( String.lowercase_ascii
                      (String.trim (String.sub line 0 i))
                  , String.trim
                      (String.sub line (i + 1)
                         (String.length line - i - 1)) )
            | None -> None)
      in
      let body =
        match List.assoc_opt "transfer-encoding" headers_map with
        | Some te when String.lowercase_ascii te = "chunked" ->
            let out = Buffer.create (String.length body_raw) in
            let rec dechunk pos =
              match str_find_sub body_raw "\r\n" pos with
              | None -> ()
              | Some eol ->
                  let size_s =
                    String.sub body_raw pos (eol - pos) |> String.trim
                  in
                  let size_s =
                    match String.index_opt size_s ';' with
                    | Some i -> String.sub size_s 0 i
                    | None -> size_s
                  in
                  (match int_of_string_opt ("0x" ^ size_s) with
                   | None -> ()
                   | Some 0 -> ()
                   | Some n ->
                       Buffer.add_substring out body_raw (eol + 2) n;
                       dechunk (eol + 2 + n + 2))
            in
            dechunk 0;
            Buffer.contents out
        | _ -> body_raw
      in
      `Ok { status; body }
    with
    | Lifecycle_error _ as e ->
        (try Unix.close fd with Unix.Unix_error _ -> ());
        raise e
    | _ -> `Err
  in
  (try Unix.close fd with Unix.Unix_error _ -> ());
  match result with
  | `Ok r -> r
  | `Err -> fail_req ()

let health_request ~(port : int) : http_response =
  http_request ~port ~path:"/healthz" ()

let shutdown_request ~(port : int) ~(deleting : bool) : http_response =
  http_request ~port ~path:"/v1/shutdown" ~method_:"POST"
    ~headers:
      (if deleting then [ "x-logseq-graph-deleting", "true" ] else [])
    ()

(* ---- state file ---- *)

(* state — state.json shape {generation, phase, workers, owner?...}. *)
let state (ctx : ctx) : Yojson.Safe.t =
  let value = read_json ctx.state_file in
  let value =
    match value with
    | None when not (file_exists ctx.state_file) ->
        let v =
          `Assoc
            [ "generation", `String (new_id ())
            ; "phase",
              `String (if file_exists ctx.graph_dir then "available" else "absent")
            ; "workers", `List [] ]
        in
        write_json ctx.state_file v;
        v
    | v -> (match v with Some v -> v | None -> `Null)
  in
  (match value with
   | `Assoc kvs ->
       let valid =
         (match List.assoc_opt "workers" kvs with
          | Some (`List _) -> true
          | _ -> false)
         && (match List.assoc_opt "generation" kvs with
            | Some (`String _) -> true
            | _ -> false)
         && (match List.assoc_opt "phase" kvs with
            | Some (`String _) -> true
            | _ -> false)
       in
       if not valid then fail "Invalid lifecycle state"
   | _ -> fail "Invalid lifecycle state");
  value

let state_workers (current : Yojson.Safe.t) : Yojson.Safe.t list =
  match jget current "workers" with
  | Some (`List ws) -> ws
  | _ -> []

let set_workers (current : Yojson.Safe.t) (workers : Yojson.Safe.t list)
    : Yojson.Safe.t =
  match current with
  | `Assoc kvs -> `Assoc (("workers", `List workers) :: List.remove_assoc "workers" kvs)
  | _ -> current

let require_available (ctx : ctx) (current : Yojson.Safe.t)
    (generation : string option) : unit =
  (match generation, jstr current "generation" with
   | Some g, Some cg when g <> cg ->
       fail ~code:"graph-not-exists" "Graph generation changed"
   | _ -> ());
  let phase = Option.value (jstr current "phase") ~default:"" in
  if phase <> "available" || not (file_exists ctx.graph_dir) then
    fail ~code:"graph-not-exists" "Graph is absent or stopped by deletion"

(* ---- ownership lock (ownership.cjs) ---- *)

let ownership_path (ctx : ctx) : string =
  let canonical =
    try realpath ctx.graph_dir
    with Unix.Unix_error (Unix.ENOENT, _, _) ->
      Filename.concat
        (realpath (Filename.dirname ctx.graph_dir))
        (Filename.basename ctx.graph_dir)
  in
  let hash = sync (Crypto.sha256_hex canonical) in
  Filename.concat
    (Filename.concat (runtime_root_dir ()) hash)
    "lock.sqlite"

type ownership_handle =
  { own_db : Sqlite3.db
  ; mutable own_released : bool
  ; mutable own_in_tx : bool
  }

let repo_locked (ctx : ctx) : 'a =
  fail ~code:"repo-locked" ("Graph ownership is locked: " ^ ctx.graph_dir)

let acquire_ownership (ctx : ctx) : ownership_handle =
  let file = ownership_path ctx in
  mkdir_p (Filename.dirname file);
  let db = Sqlite3.db_open file in
  match Sqlite3.exec db "BEGIN IMMEDIATE" with
  | Sqlite3.Rc.OK -> { own_db = db; own_released = false; own_in_tx = true }
  | Sqlite3.Rc.BUSY ->
      ignore (Sqlite3.db_close db);
      repo_locked ctx
  | rc ->
      ignore (Sqlite3.db_close db);
      fail ~code:"repo-locked"
        ("Graph ownership lock failed: " ^ Sqlite3.Rc.to_string rc)

let handle_assert (h : ownership_handle) : unit =
  if h.own_released || not h.own_in_tx then
    fail ~code:"repo-locked" "Graph ownership transaction was lost"

let release (h : ownership_handle) : unit =
  if h.own_released then ()
  else begin
    h.own_released <- true;
    (try if h.own_in_tx then ignore (Sqlite3.exec h.own_db "ROLLBACK")
     with _ -> ());
    h.own_in_tx <- false;
    ignore (Sqlite3.db_close h.own_db)
  end

let ownership_available (ctx : ctx) : bool =
  match (try Some (acquire_ownership ctx) with Lifecycle_error _ -> None) with
  | Some h -> release h; true
  | None -> false

(* ---- runtime records ---- *)

let runtime_file (ctx : ctx) (ticket : string) : string =
  (* ^[\w-]+$ *)
  let valid =
    String.length ticket > 0
    && String.for_all
         (fun c ->
            (c >= 'a' && c <= 'z')
            || (c >= 'A' && c <= 'Z')
            || (c >= '0' && c <= '9')
            || c = '_' || c = '-')
         ticket
  in
  if not valid then fail "Invalid admission ticket";
  Filename.concat ctx.dir ("runtime-" ^ ticket ^ ".json")

(* runtimeRecord — the registration payload fields, in JS key order. *)
let runtime_record_json ~(ctx : ctx) ~(ticket : string) ~(generation : string)
    ~(pid : int) ~(owner : string) : Yojson.Safe.t =
  `Assoc
    [ "ticket", `String ticket
    ; "generation", `String generation
    ; "pid", `Int pid
    ; "owner", `String owner
    ; "root", `String ctx.root
    ; "graphsDir", `String ctx.graphs_dir
    ; "lifecycleDir", `String ctx.lifecycle_dir
    ; "repo", `String ctx.repo
    ; "ownership-protocol", `String protocol ]

let json_field_equal (a : Yojson.Safe.t option) (b : Yojson.Safe.t option) : bool =
  match a, b with
  | Some (`Int x), Some (`Intlit s) | Some (`Intlit s), Some (`Int x) ->
      int_of_string_opt s = Some x
  | Some (`Float f), Some (`Int x) | Some (`Int x), Some (`Float f) ->
      f = float_of_int x
  | a, b -> a = b

(* registered — every runtimeRecord field equals the record's. *)
let registered (current : Yojson.Safe.t) ~(ctx : ctx) ~(ticket : string)
    ~(generation : string) ~(pid : int) ~(owner : string) : bool =
  let expect = runtime_record_json ~ctx ~ticket ~generation ~pid ~owner in
  let expect_fields =
    match expect with `Assoc kvs -> kvs | _ -> []
  in
  List.exists
    (fun record ->
       List.for_all
         (fun (key, value) -> json_field_equal (jget record key) (Some value))
         expect_fields)
    (state_workers current)

let validate_registration (ctx : ctx) (current : Yojson.Safe.t)
    (record : Yojson.Safe.t) : unit =
  let ok =
    match jint record "pid" with
    | Some pid -> pid > 0
    | None -> false
  in
  let ok =
    ok
    && jstr record "ticket" <> None
    && jstr record "owner" <> None
    && jstr record "root" <> None
    && jstr record "generation" = jstr current "generation"
    && jstr record "repo" = Some ctx.repo
    && jstr record "ownership-protocol" = Some protocol
    && jstr record "graphsDir" = Some ctx.graphs_dir
    && jstr record "lifecycleDir" = Some ctx.lifecycle_dir
  in
  if not ok then fail "Invalid worker registration"

let read_runtime (ctx : ctx) (record : Yojson.Safe.t) : Yojson.Safe.t option =
  let ticket = Option.value (jstr record "ticket") ~default:"" in
  let file = runtime_file ctx ticket in
  let runtime = read_json file in
  if file_exists file then
    (match runtime with
     | Some (`Assoc _) -> ()
     | _ -> fail "Invalid worker runtime metadata");
  (match runtime with
   | Some rt ->
       let expect =
         runtime_record_json ~ctx ~ticket
           ~generation:(Option.value (jstr record "generation") ~default:"")
           ~pid:(Option.value (jint record "pid") ~default:0)
           ~owner:(Option.value (jstr record "owner") ~default:"")
       in
       let expect_fields =
         match expect with `Assoc kvs -> kvs | _ -> []
       in
       if
         List.exists
           (fun (key, value) ->
              not (json_field_equal (jget rt key) (Some value)))
           expect_fields
       then fail "Worker runtime identity differs from registration"
   | None -> ());
  runtime

(* ---- server-list entries ---- *)

type entry =
  { entry_pid : int
  ; entry_port : int
  }

(* /^(\d+)\s+(\d+)$/ *)
let parse_entry_line (line : string) : entry =
  let all_digits s =
    String.length s > 0
    && String.for_all (fun c -> c >= '0' && c <= '9') s
  in
  let tokens =
    String.trim line
    |> String.split_on_char ' '
    |> List.concat_map (String.split_on_char '\t')
    |> List.filter (fun t -> t <> "")
  in
  match tokens with
  | [ a; b ] when all_digits a && all_digits b ->
      { entry_pid = int_of_string a; entry_port = int_of_string b }
  | _ -> fail "Invalid server publication"

let entries (root : string) : entry list =
  let file = Filename.concat root "server-list" in
  match read_text_opt file with
  | None -> []
  | Some raw ->
      raw
      |> String.split_on_char '\n'
      |> List.filter (fun line -> String.trim line <> "")
      |> List.map parse_entry_line

(* locked rewrite of <root>/server-list without <root>/server-list.lock *)
let remove_entries (root : string) (removed : entry list) : unit =
  let lock_file = Filename.concat root "server-list.lock" in
  let lock_id = new_id () in
  let owner_json =
    `Assoc
      [ "pid", `Int (Node_process.pid ()); "lock-id", `String lock_id ]
  in
  let deadline = Unix.gettimeofday () +. 2.0 in
  let rec acquire () =
    let acquired =
      try
        let oc =
          open_out_gen [ Open_wronly; Open_creat; Open_excl; Open_binary ] 0o644
            lock_file
        in
        output_string oc (Yojson.Safe.to_string owner_json);
        close_out oc;
        true
      with Sys_error _ -> false
    in
    if not acquired then begin
      (* stale lock check *)
      (match read_json lock_file with
       | Some lock ->
           (match jint lock "pid" with
            | Some pid when
                (match Node_process.kill0 pid with
                 | Node_process.Not_found -> true
                 | _ -> false) ->
                (* unlink only when the lock-id is unchanged *)
                (match read_json lock_file with
                 | Some cur when jstr cur "lock-id" = jstr lock "lock-id" ->
                     remove_file lock_file
                 | _ -> ())
            | _ -> ())
       | None -> ());
      if Unix.gettimeofday () >= deadline then
        fail "Timed out acquiring server-list lock";
      sleep_ms 25;
      acquire ()
    end
  in
  acquire ();
  (try
     let retained =
       List.filter
         (fun (e : entry) ->
            not
              (List.exists
                 (fun (r : entry) ->
                    r.entry_pid = e.entry_pid && r.entry_port = e.entry_port)
                 removed))
         (entries root)
     in
     let file = Filename.concat root "server-list" in
     let tmp = file ^ "." ^ new_id () ^ ".tmp" in
     (try
        let oc = open_out_bin tmp in
        output_string oc
          (String.concat ""
             (List.map
                (fun (e : entry) ->
                   Printf.sprintf "%d %d\n" e.entry_pid e.entry_port)
                retained));
        close_out oc;
        Unix.rename tmp file
      with exn -> remove_file tmp; raise exn)
   with exn -> remove_file lock_file; raise exn);
  (match read_json lock_file with
   | Some cur when jstr cur "lock-id" = Some lock_id ->
       remove_file lock_file
   | _ ->
       remove_file lock_file;
       fail "Server-list lock ownership changed")

(* ---- lease (state-file mutex via lease.sqlite) ---- *)

type lease_handle =
  { lease_db : Sqlite3.db
  ; lease_ctx : ctx
  ; lease_owner_id : string
  ; mutable lease_released : bool
  }

let acquire_lease (ctx : ctx) (operation : string)
    (check_waiting : (unit -> unit) option) : lease_handle =
  let db = Sqlite3.db_open (Filename.concat ctx.dir "lease.sqlite") in
  let deadline = Unix.gettimeofday () +. 30.0 in
  let acquired = ref false in
  (try
     let rec loop () =
       (match check_waiting with Some f -> f () | None -> ());
       match Sqlite3.exec db "BEGIN IMMEDIATE" with
       | Sqlite3.Rc.OK -> acquired := true
       | Sqlite3.Rc.BUSY ->
           if Unix.gettimeofday () >= deadline then
             fail "Timed out acquiring lifecycle lease";
           sleep_ms 25;
           loop ()
       | rc ->
           fail ("Lifecycle lease failed: " ^ Sqlite3.Rc.to_string rc)
     in
     loop ();
     let current = state ctx in
     let owner_id = new_id () in
     let owner_json =
       `Assoc
         [ "id", `String owner_id
         ; "pid", `Int (Node_process.pid ())
         ; "operation", `String operation ]
     in
     (match current with
      | `Assoc kvs ->
          write_json ctx.state_file
            (`Assoc (("owner", owner_json) :: List.remove_assoc "owner" kvs))
      | _ -> fail "Invalid lifecycle state");
     { lease_db = db
     ; lease_ctx = ctx
     ; lease_owner_id = owner_id
     ; lease_released = false }
   with exn ->
     if !acquired then ignore (Sqlite3.exec db "ROLLBACK");
     ignore (Sqlite3.db_close db);
     raise exn)

let release_lease (h : lease_handle) : unit =
  if h.lease_released then ()
  else begin
    h.lease_released <- true;
    (try
       let latest = read_json h.lease_ctx.state_file in
       let same_owner =
         match latest with
         | Some j ->
             (match jobj j "owner" with
              | Some o -> jstr o "id" = Some h.lease_owner_id
              | None -> false)
         | None -> false
       in
       if not same_owner then fail "Lifecycle lease ownership changed";
       (match latest with
        | Some (`Assoc kvs) ->
            write_json h.lease_ctx.state_file
              (`Assoc (List.remove_assoc "owner" kvs))
        | _ -> fail "Lifecycle lease ownership changed")
     with exn ->
       ignore (Sqlite3.exec h.lease_db "ROLLBACK");
       ignore (Sqlite3.db_close h.lease_db);
       raise exn);
    (try ignore (Sqlite3.exec h.lease_db "COMMIT")
     with _ -> ());
    ignore (Sqlite3.db_close h.lease_db)
  end

let with_lease (ctx : ctx) (operation : string)
    ?(check_waiting : (unit -> unit) option) (action : unit -> 'a) : 'a =
  let h = acquire_lease ctx operation check_waiting in
  match
    (try `Ok (action ()) with exn -> `Err exn)
  with
  | `Ok v -> release_lease h; v
  | `Err e -> (try release_lease h with _ -> ()); raise e

(* ---- merge of ctx+record into a target object ---- *)

let target_of (record : Yojson.Safe.t) (runtime : Yojson.Safe.t option) :
    Yojson.Safe.t =
  match record, runtime with
  | `Assoc a, Some (`Assoc b) -> `Assoc (b @ List.filter (fun (k, _) -> not (List.mem_assoc k b)) a)
  | a, _ -> a

let pending (target : Yojson.Safe.t) : bool =
  (not (jhas target "phase"))
  && (match jint target "expires" with Some e -> e > now_ms () | None -> false)
  && (match jint target "parent" with
      | Some p -> pid_exists p
      | None -> false)

(* discover — registered workers + health probes for unregistered
   publications. [registered_only] skips unregistered probes. *)
let discover (ctx : ctx) (current : Yojson.Safe.t) ~(registered_only : bool)
    : Yojson.Safe.t list =
  let targets : (int, Yojson.Safe.t) Hashtbl.t = Hashtbl.create 7 in
  List.iter
    (fun record ->
       validate_registration ctx current record;
       let pid =
         match jint record "pid" with
         | Some p -> p
         | None -> fail "Invalid worker registration"
       in
       if Hashtbl.mem targets pid then fail "Duplicate worker registration";
       Hashtbl.replace targets pid
         (target_of record (read_runtime ctx record)))
    (state_workers current);
  let check_unregistered (value : Yojson.Safe.t option) : unit =
    match value with
    | Some v ->
        (match jstr v "repo" with
         | Some repo when graph_name repo = ctx.repo ->
             let matches =
               match jobj v "storage" with
               | Some st -> same_storage ctx st
               | None ->
                   (match jstr v "root-dir" with
                    | Some rd ->
                        (try canonical_root rd = ctx.root with _ -> false)
                    | None -> true)
             in
             if matches then fail "Published graph worker is unregistered"
         | _ -> ())
    | None -> ()
  in
  let roots =
    ctx.root
    :: List.filter_map (fun r -> jstr r "root") (state_workers current)
    |> List.sort_uniq String.compare
  in
  List.iter
    (fun root ->
       List.iter
         (fun (candidate : entry) ->
            if not (pid_exists candidate.entry_pid) then ()
            else
              match Hashtbl.find_opt targets candidate.entry_pid with
              | Some target ->
                  (match jint target "port" with
                   | Some p when p <> candidate.entry_port ->
                       fail "Worker publication identity mismatch"
                   | _ -> ());
                  let target' =
                    match target with
                    | `Assoc kvs ->
                        `Assoc
                          (("port", `Int candidate.entry_port)
                           :: List.remove_assoc "port" kvs)
                    | _ -> target
                  in
                  Hashtbl.replace targets candidate.entry_pid target'
              | None when registered_only -> ()
              | None ->
                  let value =
                    try
                      let resp = health_request ~port:candidate.entry_port in
                      (try Some (Yojson.Safe.from_string resp.body)
                       with _ -> None)
                    with Http_request_failed -> None
                  in
                  check_unregistered value)
         (entries root))
      roots;
  Hashtbl.fold (fun _ v acc -> v :: acc) targets []

(* cleanup — drop publications + runtime files for [targets]; a
   recorded close error is surfaced once (acknowledgedErrors). *)
let cleanup (ctx : ctx) (current : Yojson.Safe.t)
    (targets : Yojson.Safe.t list) : unit =
  let roots =
    ctx.root
    :: List.filter_map (fun t -> jstr t "root") targets
    |> List.sort_uniq String.compare
  in
  let removed =
    List.filter_map
      (fun t ->
         match jint t "pid", jint t "port" with
         | Some pid, Some port -> Some { entry_pid = pid; entry_port = port }
         | _ -> None)
      targets
  in
  List.iter (fun root -> remove_entries root removed) roots;
  let acknowledged =
    match jget current "acknowledgedErrors" with
    | Some (`List l) ->
        List.filter_map (function `String s -> Some s | _ -> None) l
    | _ -> []
  in
  let current = ref current in
  List.iter
    (fun target ->
       (match jstr target "ticket" with
        | Some ticket ->
            (match read_json (runtime_file ctx ticket) with
             | Some record ->
                 (match jstr record "error" with
                  | Some err when
                      not (List.mem ticket acknowledged) && err <> "" ->
                      let next_ack = acknowledged @ [ ticket ] in
                      let next =
                        match !current with
                        | `Assoc kvs ->
                            `Assoc
                              (("acknowledgedErrors",
                                 `List (List.map (fun s -> `String s) next_ack))
                               :: List.remove_assoc "acknowledgedErrors" kvs)
                        | _ -> !current
                      in
                      write_json ctx.state_file next;
                      current := next;
                      fail ("Worker close failed: " ^ err)
                  | _ -> ())
             | None -> ())
        | None -> ()))
    targets;
  List.iter
    (fun target ->
       match jstr target "ticket" with
       | Some ticket -> remove_file (runtime_file ctx ticket)
       | None -> ())
    targets

(* ---- health ---- *)

let health (ctx : ctx) (target : Yojson.Safe.t) (port : int)
    : Yojson.Safe.t =
  let response = health_request ~port in
  let value =
    try Yojson.Safe.from_string response.body
    with _ -> fail "Worker endpoint identity mismatch"
  in
  let target_pid = jint target "pid" in
  let ok =
    (response.status = 200 || response.status = 503)
    && jint value "pid" = target_pid
    && jint value "port" = Some port
    && (match jobj value "storage" with
        | Some st -> same_storage ctx st
        | None -> false)
    && (match jstr value "repo" with
        | Some r -> (try graph_name r = ctx.repo with _ -> false)
        | None -> false)
    && (match jstr value "root-dir" with
        | Some rd ->
            (match jstr target "root" with
             | Some tr ->
                 (try canonical_root rd = canonical_root tr with _ -> false)
             | None -> false)
        | None -> false)
    && (match jstr value "revision" with
        | Some s -> s <> ""
        | None -> false)
    && jstr value "host" = Some "127.0.0.1"
    && jstr value "ticket" = jstr target "ticket"
    && jstr value "generation" = jstr target "generation"
    && jstr value "owner-source" = jstr target "owner"
    && jstr target "ownership-protocol" = Some protocol
    && jstr value "ownership-protocol" = Some protocol
  in
  if not ok then fail "Worker endpoint identity mismatch";
  value

let wait_exit (pid : int) (milliseconds : int) : bool =
  let deadline = Unix.gettimeofday () +. float_of_int milliseconds /. 1000. in
  let rec go () =
    if not (pid_exists pid) then true
    else if Unix.gettimeofday () >= deadline then not (pid_exists pid)
    else (sleep_ms 50; go ())
  in
  go ()

let shutdown_and_wait (ctx : ctx) (target : Yojson.Safe.t) ~(deleting : bool)
    ~(responsive : bool) : unit =
  let pid = Option.value (jint target "pid") ~default:0 in
  if pid = Node_process.pid () then fail "Cannot stop the calling process";
  if not (pid_exists pid) then ()
  else begin
    if responsive then
      (match jint target "port" with
       | Some port ->
           (try
              let response = shutdown_request ~port ~deleting in
              if response.status <> 200 then fail "Worker rejected shutdown"
            with Http_request_failed -> ())
       | None -> ());
    let stages = [ "graceful", 5000, None; "SIGTERM", 1000, Some sigterm; "SIGKILL", 2000, Some sigkill ] in
    let rec go = function
      | [] -> fail ~code:"server-stop-timeout"
                (Printf.sprintf "Timed out stopping worker %d" pid)
      | (stage, ms, signal) :: rest ->
          (match signal with
           | Some s -> signal_process pid s
           | None -> ());
          Node_console.error
            ("[graph-lifecycle] "
             ^ Yojson.Safe.to_string
                 (`Assoc
                   [ "event", `String "worker-termination"
                   ; "repo", `String ctx.repo
                   ; "graphsDir", `String ctx.graphs_dir
                   ; "generation",
                     (match jstr target "generation" with
                      | Some g -> `String g
                      | None -> `Null)
                   ; "ticket",
                     (match jstr target "ticket" with
                      | Some t -> `String t
                      | None -> `Null)
                   ; "pid", `Int pid
                   ; "stage", `String stage ]));
          if wait_exit pid ms then () else go rest
    in
    go stages
  end

(* terminate — a live PID is asked to exit; an ownership-free worker
   without a responsive endpoint just gets fenced off. *)
let terminate (ctx : ctx) (current : Yojson.Safe.t) (target : Yojson.Safe.t)
    ~(deleting : bool) : unit =
  let pid = Option.value (jint target "pid") ~default:0 in
  if not (pid_exists pid) then ()
  else if ownership_available ctx then begin
    (* Free ownership fences abandoned tickets, but a verified endpoint
       still has to exit before management can complete a stop or
       filesystem mutation. *)
    let responsive =
      match jint target "port" with
      | Some port ->
          (try ignore (health ctx target port); true
           with Http_request_failed -> false
           | _ -> false)
      | None -> false
    in
    if responsive then (shutdown_and_wait ctx target ~deleting ~responsive:true)
    else begin
      let waiting = pending target in
      if waiting then
        (let latest = state ctx in
         let kept =
           List.filter
             (fun record ->
                jstr record "ticket" <> jstr target "ticket")
             (state_workers latest)
         in
         write_json ctx.state_file (set_workers latest kept));
      (* No child-process tracking daemon-side: a spawned worker is not
         in our [children] map, so an admission-pending worker is just
         given 5s to exit on its own. *)
      if waiting && not (wait_exit pid 5000) then
        fail ~code:"server-stop-timeout" "Revoked startup worker did not exit"
    end
  end
  else
    let responsive =
      match jint target "port" with
      | Some port ->
          (try ignore (health ctx target port); true
           with Http_request_failed | Lifecycle_error _ -> false)
      | None -> false
    in
    shutdown_and_wait ctx target ~deleting ~responsive

(* ---- legacy retirement (legacy-retirement.cjs) ---- *)

let lock_file_of (ctx : ctx) : string =
  Filename.concat ctx.graph_dir "db-worker.lock"

let unresolved (ctx : ctx) (reason : string) : 'a =
  fail
    ("Legacy ownership unresolved for " ^ ctx.graph_dir ^ ": " ^ reason
     ^ ". Close old applications and daemons before explicit offline \
        recovery.")

let retire_graph (ctx : ctx) (current : Yojson.Safe.t) : Yojson.Safe.t list =
  let file = lock_file_of ctx in
  let original = read_text_opt file in
  let disk =
    match original with
    | None -> None
    | Some raw ->
        (try Some (Yojson.Safe.from_string raw)
         with _ -> None)
  in
  let records =
    List.filter
      (fun record -> not (jhas record "ownership-protocol"))
      (state_workers current)
  in
  if original = None && records = [] then []
  else begin
    let records_before =
      Yojson.Safe.to_string (`List (state_workers current))
    in
    let runtime_before =
      List.map
        (fun record ->
           let ticket = Option.value (jstr record "ticket") ~default:"" in
           (ticket, read_text_opt (runtime_file ctx ticket)))
        records
    in
    let roots =
      ctx.root
      :: List.filter_map (fun r -> jstr r "root") records
      |> List.sort_uniq String.compare
    in
    let publications =
      List.concat_map
        (fun root ->
           List.map (fun e -> (root, e)) (entries root))
        roots
    in
    let dead =
      List.filter (fun (_, e) -> not (pid_exists e.entry_pid)) publications
    in
    let candidates : (int, Yojson.Safe.t) Hashtbl.t = Hashtbl.create 7 in
    List.iter
      (fun record ->
         let ticket = Option.value (jstr record "ticket") ~default:"" in
         let raw =
           match List.assoc_opt ticket runtime_before with
           | Some raw -> raw
           | None -> None
         in
         let runtime =
           match raw with
           | None -> None
           | Some s ->
               (try Some (Yojson.Safe.from_string s)
                with _ -> None)
         in
         if raw <> None then
           (match runtime with
            | Some (`Assoc _) -> ()
            | _ -> unresolved ctx "invalid legacy runtime metadata");
         (match runtime with
          | Some rt ->
              if
                List.exists
                  (fun key -> not (json_field_equal (jget rt key) (jget record key)))
                  [ "ticket"; "generation"; "pid"; "owner"; "root"
                  ; "graphsDir"; "lifecycleDir"; "repo" ]
              then unresolved ctx "registration/runtime identity mismatch"
          | None -> ());
         let pid =
           match jint record "pid" with
           | Some p -> p
           | None -> unresolved ctx "invalid legacy registration"
         in
         let merged = target_of record runtime in
         (match Hashtbl.find_opt candidates pid with
          | Some _ -> ()
          | None -> Hashtbl.replace candidates pid merged);
         (* keep the raw record for later identity checks *)
         (match merged, Hashtbl.find_opt candidates pid with
          | `Assoc kvs, Some (`Assoc ckvs) ->
              let kvs' = ("record", record) :: List.remove_assoc "record" ckvs in
              ignore kvs;
              Hashtbl.replace candidates pid (`Assoc kvs')
          | _ -> ()))
      records;
    (match disk with
     | Some d ->
         (match jint d "pid" with
          | Some pid when pid > 0 ->
              let repo_ok =
                match jstr d "repo" with
                | Some r -> (try graph_name r = ctx.repo with _ -> false)
                | None -> false
              in
              let owner_ok =
                match jstr d "owner-source" with
                | Some o -> List.mem o [ "cli"; "electron"; "unknown" ]
                | None -> false
              in
              if
                (not repo_ok)
                || (match jstr d "lock-id" with
                    | Some s -> s = ""
                    | None -> true)
                || not owner_ok
              then unresolved ctx "invalid disk lock identity";
              let base =
                match Hashtbl.find_opt candidates pid with
                | Some (`Assoc kvs) -> kvs
                | _ -> []
              in
              let merged =
                `Assoc (("pid", `Int pid) :: ("disk", d)
                        :: List.remove_assoc "pid"
                             (List.remove_assoc "disk" base))
              in
              Hashtbl.replace candidates pid merged
          | _ -> ())
     | None -> ());
    let dead_pids = List.map (fun (_, e) -> e.entry_pid) dead in
    let is_dead e = List.mem e.entry_pid dead_pids in
    let unresolved_publications =
      List.filter
        (fun (_, e) ->
           (not (is_dead e))
           && (not (Hashtbl.mem candidates e.entry_pid))
           && not
                (List.exists
                   (fun record -> jint record "pid" = Some e.entry_pid)
                   (state_workers current)))
        publications
    in
    (* probe each unresolved publication *)
    let probes =
      List.map
        (fun (_, e) ->
           try
             let resp = health_request ~port:e.entry_port in
             (try `Ok (Yojson.Safe.from_string resp.body)
              with _ -> `Err ())
           with _ -> `Err ())
        unresolved_publications
    in
    List.iter
      (fun ((_, e) as publication) ->
         if is_dead e then ()
         else if
           List.exists
             (fun record ->
                jint record "pid" = Some e.entry_pid
                && jhas record "ownership-protocol")
             (state_workers current)
         then ()
         else
           match Hashtbl.find_opt candidates e.entry_pid with
           | Some target ->
               (match jint target "port" with
                | Some p when p <> e.entry_port ->
                    unresolved ctx "publication port mismatch"
                | _ -> ());
               let root, _ = publication in
               let target' =
                 match target with
                 | `Assoc kvs ->
                     `Assoc
                       (("port", `Int e.entry_port)
                        :: ("root", `String root)
                        :: List.remove_assoc "port"
                             (List.remove_assoc "root" kvs))
                 | _ -> target
               in
               Hashtbl.replace candidates e.entry_pid target'
           | None ->
               (* A publication for a sibling graph must not block
                  graph-targeted retirement. *)
               let idx =
                 let rec index i = function
                   | [] -> -1
                   | p :: rest ->
                       if p == publication then i else index (i + 1) rest
                 in
                 index 0 unresolved_publications
               in
               let value =
                 if idx < 0 then `Err ()
                 else List.nth probes idx
               in
               (match value with
                | `Err () ->
                    if original <> None || records <> [] then
                      unresolved ctx
                        (Printf.sprintf "unavailable publication %d:%d"
                           e.entry_pid e.entry_port)
                | `Ok v ->
                    (match jstr v "repo" with
                     | Some r ->
                         if (try graph_name r <> ctx.repo with _ -> true)
                         then ()
                         else begin
                           (match jget v "ownership-protocol" with
                            | Some (`String "sqlite-v1") -> ()
                            | Some _ -> unresolved ctx "unknown ownership protocol"
                            | None ->
                                if jstr v "root-dir" = None then
                                  unresolved ctx
                                    "unregistered graph endpoint lacks root identity"
                                else begin
                                  let matches =
                                    (match jstr v "root-dir" with
                                     | Some rd ->
                                         (try canonical_root rd = ctx.root
                                          with _ -> false)
                                     | None -> false)
                                    &&
                                    (match jobj v "storage" with
                                     | Some st -> same_storage ctx st
                                     | None -> true)
                                  in
                                  if matches then
                                    unresolved ctx
                                      "legacy publication has no \
                                       correlating lock or registration"
                                end)
                         end
                     | None -> ())))
      publications;
    if original <> None && disk = None && records = [] then
      unresolved ctx "malformed lock without independent registration";
    if original <> None && disk <> None && Hashtbl.length candidates = 0 then
      unresolved ctx "invalid lock";
    let retired = ref [] in
    Hashtbl.iter
      (fun pid target ->
         if not (pid_exists pid) then ()
         else begin
           let port =
             match jint target "port" with
             | Some p -> p
             | None ->
                 unresolved ctx
                   (Printf.sprintf "unidentified live PID %d" pid)
           in
           let probe () =
             let response =
               try health_request ~port
               with Http_request_failed ->
                 unresolved ctx
                   (Printf.sprintf "unavailable endpoint %d:%d" pid port)
             in
             let value =
               try Yojson.Safe.from_string response.body
               with _ -> unresolved ctx "endpoint identity mismatch"
             in
             let ok =
               (response.status = 200 || response.status = 503)
               && jint value "pid" = Some pid
               && jint value "port" = Some port
               && jstr value "host" = Some "127.0.0.1"
               && (match jstr value "repo" with
                   | Some r -> (try graph_name r = ctx.repo with _ -> false)
                   | None -> false)
               && (match jstr value "revision" with
                   | Some s -> s <> ""
                   | None -> false)
               && (match jstr value "owner-source" with
                   | Some o -> List.mem o [ "cli"; "electron" ]
                   | None -> false)
               && not (jhas value "ownership-protocol")
               && (match jstr value "root-dir", jstr target "root" with
                   | Some rd, Some tr ->
                       (try canonical_root rd = canonical_root tr
                        with _ -> false)
                   | _ -> false)
               && (match jobj value "storage" with
                   | Some st -> same_storage ctx st
                   | None -> true)
             in
             if not ok then unresolved ctx "endpoint identity mismatch";
             (match jget target "disk" with
              | Some disk ->
                  if
                    jstr disk "owner-source" <> jstr value "owner-source"
                    || (match jget value "lock-id" with
                        | Some lid -> json_field_equal (Some lid) (jget disk "lock-id") |> not
                        | None -> false)
                  then unresolved ctx "disk lock identity mismatch"
              | None -> ());
             (match jget target "record" with
              | Some r ->
                  let record_ok =
                    jstr r "repo" = Some ctx.repo
                    && jstr r "generation" = jstr current "generation"
                    && jstr r "graphsDir" = Some ctx.graphs_dir
                    && jstr r "lifecycleDir" = Some ctx.lifecycle_dir
                    && jstr r "owner" = jstr value "owner-source"
                    && jstr value "ticket" = jstr r "ticket"
                    && jstr value "generation" = jstr r "generation"
                    && (match jobj value "storage" with
                        | Some st -> same_storage ctx st
                        | None -> false)
                  in
                  if not record_ok then
                    unresolved ctx "registered endpoint identity mismatch";
                  (match jget target "lock" with
                   | Some lock ->
                       if
                         jint lock "pid" <> jint r "pid"
                         || jstr lock "ticket" <> jstr r "ticket"
                         || jstr lock "generation" <> jstr r "generation"
                         || jstr lock "owner-source" <> jstr r "owner"
                         || (match jget value "lock-id" with
                             | Some lid -> not (json_field_equal (Some lid) (jget lock "lock-id"))
                             | None -> true)
                       then unresolved ctx "registered lock identity mismatch"
                   | None -> ())
              | None -> ());
             value
           in
           let value = probe () in
           let confirmed = probe () in
           if Yojson.Safe.to_string value <> Yojson.Safe.to_string confirmed
           then unresolved ctx "identity changed before shutdown";
           shutdown_and_wait ctx target ~deleting:false ~responsive:true;
           retired := target :: !retired
         end)
      candidates;
    (* Recheck exact evidence; a successor's record must never be
       removed. *)
    let actual = read_text_opt file in
    if actual <> original && actual <> None then
      unresolved ctx "lock identity changed during cleanup";
    let latest = read_json ctx.state_file in
    (match latest with
     | Some j ->
         if
           Yojson.Safe.to_string
             (match jget j "workers" with Some w -> w | None -> `List [])
           <> records_before
         then unresolved ctx "registration changed during cleanup"
     | None -> unresolved ctx "registration changed during cleanup");
    List.iter
      (fun record ->
         let ticket = Option.value (jstr record "ticket") ~default:"" in
         let before =
           match List.assoc_opt ticket runtime_before with
           | Some (Some s) ->
               (try Some (Yojson.Safe.from_string s) with _ -> None)
           | _ -> None
         in
         let after = read_json (runtime_file ctx ticket) in
         (match after with
          | Some a ->
              if
                List.exists
                  (fun key ->
                     not (json_field_equal (jget a key) (jget record key)))
                  [ "pid"; "ticket"; "generation"; "owner"; "root"
                  ; "graphsDir"; "lifecycleDir"; "repo" ]
              then unresolved ctx "runtime changed during cleanup"
          | None -> ());
         (match before, after with
          | Some b, Some a ->
              (match jget b "lock", jget a "lock" with
               | Some lb, Some la when lb <> la ->
                   unresolved ctx "runtime lock changed during cleanup"
               | _ -> ())
          | _ -> ());
         (match after with
          | Some a ->
              (match jstr a "error" with
               | Some e when e <> "" ->
                   unresolved ctx ("worker close failed: " ^ e)
               | _ -> ())
          | None -> ()))
      records;
    (match actual with
     | Some _ -> remove_file file
     | None -> ());
    List.iter
      (fun root ->
         let removed =
           List.filter_map
             (fun (r, e) ->
                if r = root && (is_dead e || Hashtbl.mem candidates e.entry_pid)
                then Some e
                else None)
             publications
         in
         if removed <> [] then remove_entries root removed)
      roots;
    List.iter
      (fun record ->
         match jstr record "ticket" with
         | Some ticket -> remove_file (runtime_file ctx ticket)
         | None -> ())
      records;
    if records <> [] then begin
      let kept =
        List.filter
          (fun record -> jhas record "ownership-protocol")
          (state_workers current)
      in
      let next =
        match read_json ctx.state_file with
        | Some j -> set_workers j kept
        | None -> set_workers current kept
      in
      write_json ctx.state_file next
    end;
    !retired
  end

(* ---- runtime ---- *)

type runtime =
  { ctx : ctx
  ; ticket : string
  ; generation : string
  ; pid : int
  ; owner : string
  ; mutable ownership : ownership_handle option
  }

let runtime_ticket (rt : runtime) : string option = Some rt.ticket
let runtime_generation (rt : runtime) : string option = Some rt.generation
let runtime_root (rt : runtime) : string = rt.ctx.root
let runtime_storage (rt : runtime) : storage =
  { root = rt.ctx.root
  ; graphs_dir = rt.ctx.graphs_dir
  ; lifecycle_dir = rt.ctx.lifecycle_dir }

let check_admission (rt : runtime) : unit =
  let current = read_json rt.ctx.state_file in
  (match current with
   | Some c -> require_available rt.ctx c (Some rt.generation)
   | None ->
       require_available rt.ctx (`Assoc []) (Some rt.generation));
  let ok =
    match current with
    | Some c ->
        registered c ~ctx:rt.ctx ~ticket:rt.ticket ~generation:rt.generation
          ~pid:rt.pid ~owner:rt.owner
    | None -> false
  in
  if not ok then
    fail ~code:"server-start-failed" "Worker admission registration changed"

let assert_ownership (rt : runtime) : unit =
  match rt.ownership with
  | None -> fail ~code:"repo-locked" "Graph ownership handle is missing"
  | Some h ->
      handle_assert h;
      let current = read_json rt.ctx.state_file in
      let ok =
        match current with
        | Some c ->
            jstr c "generation" = Some rt.generation
            && registered c ~ctx:rt.ctx ~ticket:rt.ticket
                 ~generation:rt.generation ~pid:rt.pid ~owner:rt.owner
        | None -> false
      in
      if not ok then
        fail ~code:"repo-locked" "Graph ownership admission changed"

let release_ownership (rt : runtime) : unit =
  match rt.ownership with
  | None -> fail ~code:"repo-locked" "Graph ownership handle is missing"
  | Some h -> release h; rt.ownership <- None

(* ---- admit ---- *)

let admit ~storage ~repo ~owner ?ticket ?generation () : runtime E.t =
  try
    let ctx = context ~storage ~repo in
    if owner = "" then fail "Worker owner is required";
    let check_waiting =
      match ticket with
      | Some t ->
          Some
            (fun () ->
               let current = read_json ctx.state_file in
               let ok =
                 match current with
                 | Some c ->
                     jstr c "generation" = generation
                     && List.exists
                          (fun record ->
                             jstr record "ticket" = Some t
                             && jint record "pid"
                                = Some (Node_process.pid ()))
                          (state_workers c)
                 | None -> false
               in
               if not ok then
                 fail ~code:"server-start-failed"
                   "Worker admission registration was revoked")
      | None -> None
    in
    with_lease ctx "admit" ?check_waiting (fun () ->
        let current = state ctx in
        require_available ctx current generation;
        ignore (retire_graph ctx current);
        let record =
          match ticket with
          | Some t ->
              let found =
                List.find_opt
                  (fun w -> jstr w "ticket" = Some t)
                  (state_workers current)
              in
              (match found with
               | Some r
                 when jstr r "owner" = Some owner
                      && jint r "pid" = Some (Node_process.pid ()) ->
                   validate_registration ctx current r;
                   Some r
               | _ ->
                   fail
                     "Worker admission generation or process identity changed")
          | None -> None
        in
        let previous =
          match ticket with
          | Some _ -> []
          | None -> discover ctx current ~registered_only:false
        in
        if List.exists pending previous then
          fail ~code:"repo-locked" "Graph ownership admission is pending";
        let handle = acquire_ownership ctx in
        try
          let ticket =
            match ticket with
            | Some t -> t
            | None ->
                let t = new_id () in
                let record =
                  runtime_record_json ~ctx ~ticket:t
                    ~generation:
                      (Option.value (jstr current "generation") ~default:"")
                    ~pid:(Node_process.pid ()) ~owner
                in
                cleanup ctx current previous;
                let next = set_workers current [ record ] in
                write_json ctx.state_file next;
                t
          in
          let generation_value =
            match generation with
            | Some g -> g
            | None ->
                Option.value (jstr current "generation") ~default:""
          in
          let rt =
            { ctx
            ; ticket
            ; generation =
                (match record with
                 | Some r ->
                     Option.value (jstr r "generation")
                       ~default:generation_value
                 | None -> generation_value)
            ; pid = Node_process.pid ()
            ; owner
            ; ownership = Some handle }
          in
          let runtime_json =
            let base =
              runtime_record_json ~ctx ~ticket:rt.ticket
                ~generation:rt.generation ~pid:rt.pid ~owner
            in
            match base with
            | `Assoc kvs ->
                `Assoc (kvs @ [ "phase", `String "initializing" ])
            | _ -> base
          in
          write_json (runtime_file ctx rt.ticket) runtime_json;
          rt
        with exn -> release handle; raise exn)
    |> fun rt -> E.pure rt
  with exn -> E.error exn

let publish (rt : runtime) (port : int) (expose_ready : unit -> unit) :
    unit E.t =
  try
    with_lease rt.ctx "publish" (fun () ->
        check_admission rt;
        assert_ownership rt;
        let base =
          runtime_record_json ~ctx:rt.ctx ~ticket:rt.ticket
            ~generation:rt.generation ~pid:rt.pid ~owner:rt.owner
        in
        let next =
          match base with
          | `Assoc kvs ->
              `Assoc
                (kvs @ [ "port", `Int port; "phase", `String "ready" ])
          | _ -> base
        in
        write_json (runtime_file rt.ctx rt.ticket) next;
        expose_ready ());
    E.pure ()
  with exn -> E.error exn

let record_stop (rt : runtime) (error : string option) : unit =
  let file = runtime_file rt.ctx rt.ticket in
  let previous = read_json file in
  let base =
    match previous with
    | Some (`Assoc kvs) -> kvs
    | _ ->
        (match
           runtime_record_json ~ctx:rt.ctx ~ticket:rt.ticket
             ~generation:rt.generation ~pid:rt.pid ~owner:rt.owner
         with
         | `Assoc kvs -> kvs
         | _ -> [])
  in
  let phase, err =
    match error with
    | Some e -> "close-error", `String e
    | None -> "closed", `Null
  in
  let fields =
    ("phase", `String phase)
    :: ("error", err)
    :: List.remove_assoc "phase" (List.remove_assoc "error" base)
  in
  write_json file (`Assoc fields)

let abort_admission (rt : runtime) (error : string option) : unit =
  match read_json rt.ctx.state_file with
  | Some current
    when registered current ~ctx:rt.ctx ~ticket:rt.ticket
           ~generation:rt.generation ~pid:rt.pid ~owner:rt.owner ->
      record_stop rt error
  | _ -> ()

(* ---- createGraph ---- *)

let stop_under_lease (ctx : ctx) (current : Yojson.Safe.t) ~(deleting : bool)
    ~(owner : string option) : bool =
  let retired = retire_graph ctx current in
  let targets = discover ctx current ~registered_only:false in
  let available = ownership_available ctx in
  if not deleting then
    List.iter
      (fun target ->
         match jint target "pid" with
         | Some pid ->
             if
               (not (pid_exists pid))
               || (available && not (pending target))
             then ()
             else begin
               let source = Option.value (jstr target "owner") ~default:"" in
               let own = Option.value owner ~default:"" in
               if source <> own && not (own = "cli" && source = "unknown")
               then
                 fail ~code:"server-owned-by-other"
                   "Server is owned by another process"
             end
         | None -> ())
      targets;
  List.iter (fun target -> terminate ctx current target ~deleting) targets;
  let probe = acquire_ownership ctx in
  release probe;
  cleanup ctx current targets;
  write_json ctx.state_file (set_workers current []);
  retired <> [] || targets <> []

let create_graph ~storage ~repo : unit E.t =
  try
    let ctx = context ~storage ~repo in
    with_lease ctx "create" (fun () ->
        let current = state ctx in
        let phase = Option.value (jstr current "phase") ~default:"" in
        if phase = "available" && file_exists ctx.graph_dir then ()
        else begin
          (match jobj current "deletion" with
           | Some d ->
               if jbool d "moved" = Some false && file_exists ctx.graph_dir
               then fail "Graph deletion must finish before recreation"
           | None -> ());
          ignore (stop_under_lease ctx current ~deleting:true ~owner:None);
          let handle = acquire_ownership ctx in
          (try
             mkdir_p ctx.graph_dir;
             let next =
               `Assoc
                 [ "generation", `String (new_id ())
                 ; "phase", `String "available"
                 ; "workers", `List []
                 ; "owner",
                   (match jget current "owner" with
                    | Some o -> o
                    | None -> `Null) ]
             in
             write_json ctx.state_file next
           with exn -> release handle; raise exn);
          release handle
        end);
    E.pure ()
  with exn -> E.error exn
