type server_status = Starting | Ready | Error | Unknown

type server = {
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph option;
  pid : Cli_primitive.pid;
  host : string;
  port : Cli_primitive.port;
  base_url : Cli_primitive.url;
  status : server_status;
  revision : string option;
  root_dir : Cli_primitive.path option;
  owner_source : Cli_primitive.owner_source;
  owned : bool;
  raw : Edn_ocaml.any option;
}

type start_result = {
  repo : Cli_primitive.repo;
  owner_source : Cli_primitive.owner_source;
  owned : bool;
}

type stop_result = { repo : Cli_primitive.repo }
type revision_mismatch = { cli_revision : string; servers : server list }

type cleanup_result = {
  cli_revision : string;
  checked : int;
  mismatched : int;
  eligible : int;
  skipped_owner : int;
  killed : server list;
  failed : (server * Error.t) list;
}

let resolve_root_dir config = config.Cli_config.root_dir
let graphs_dir config = Filename.concat (resolve_root_dir config) "graphs"

let lock_path ~root_dir repo =
  Filename.concat
    (Filename.concat
       (Filename.concat root_dir "graphs")
       (Graph_dir.graph_dir_name_of_repo repo))
    "db-worker.lock"

let db_worker_runtime_script_path () =
  match Sys.getenv_opt "LOGSEQ_DB_WORKER_NODE_SCRIPT" with
  | Some path when String.trim path <> "" -> path
  | _ -> "db-worker-node.js"

let starts_with ~prefix value =
  let prefix_len = String.length prefix in
  String.length value >= prefix_len && String.sub value 0 prefix_len = prefix

let server_list_path config =
  Filename.concat (resolve_root_dir config) "server-list"

let repo_identity repo = Cli_config.repo_to_graph repo
let same_repo a b = repo_identity a = repo_identity b

let process_alive pid =
  try
    Cli_unix.kill pid 0;
    true
  with
  | Cli_unix.Cli_unix_error (Cli_unix.ESRCH, _, _) -> false
  | Cli_unix.Cli_unix_error (Cli_unix.EPERM, _, _) -> true

let http_request ~(method_ : Cohttp.Code.meth) ~url ~headers ~body ~timeout_span
    =
  Cli_effect.bind
    (Cli_platform.HTTP.request ?timeout_span method_ (Uri.of_string url)
       ~headers:(Cohttp.Header.of_list headers)
       ~body:(Cohttp_lwt.Body.of_string body))
    (fun (response, body) ->
      Cli_effect.bind
        (Cli_effect.of_lwt (Cohttp_lwt.Body.to_string body))
        (fun body -> Cli_effect.pure (response, body)))

let http_success response =
  let status = Cohttp.Response.status response |> Cohttp.Code.code_of_status in
  status >= 200 && status < 300

let parse_server_list_line line =
  match
    String.split_on_char ' ' (String.trim line) |> List.filter (( <> ) "")
  with
  | [ pid; port ] -> (
      match (int_of_string_opt pid, int_of_string_opt port) with
      | Some pid, Some port when pid > 0 && port > 0 -> Some (pid, port)
      | _ -> None)
  | _ -> None

let read_server_list path =
  if not (Sys.file_exists path) then []
  else
    let ic = open_in path in
    Fun.protect
      ~finally:(fun () -> close_in_noerr ic)
      (fun () ->
        let rec loop acc =
          match input_line ic with
          | line ->
              let acc =
                match parse_server_list_line line with
                | Some entry -> entry :: acc
                | None -> acc
              in
              loop acc
          | exception End_of_file -> List.rev acc
        in
        loop [])

type json_parser = { text : string; mutable pos : int }

let parser text = { text; pos = 0 }
let parser_done p = p.pos >= String.length p.text
let peek p = if parser_done p then None else Some p.text.[p.pos]

let bump p =
  let c = p.text.[p.pos] in
  p.pos <- p.pos + 1;
  c

let rec skip_ws p =
  match peek p with
  | Some (' ' | '\n' | '\r' | '\t') ->
      ignore (bump p);
      skip_ws p
  | _ -> ()

let expect p expected =
  skip_ws p;
  match peek p with
  | Some c when c = expected -> ignore (bump p)
  | _ -> invalid_arg ("expected " ^ String.make 1 expected)

let parse_json_string p =
  expect p '"';
  let buffer = Buffer.create 16 in
  let rec loop () =
    match bump p with
    | '"' -> Buffer.contents buffer
    | '\\' -> (
        match bump p with
        | '"' ->
            Buffer.add_char buffer '"';
            loop ()
        | '\\' ->
            Buffer.add_char buffer '\\';
            loop ()
        | '/' ->
            Buffer.add_char buffer '/';
            loop ()
        | 'n' ->
            Buffer.add_char buffer '\n';
            loop ()
        | 'r' ->
            Buffer.add_char buffer '\r';
            loop ()
        | 't' ->
            Buffer.add_char buffer '\t';
            loop ()
        | other ->
            Buffer.add_char buffer other;
            loop ())
    | c ->
        Buffer.add_char buffer c;
        loop ()
  in
  loop ()

let rec parse_json_value p =
  skip_ws p;
  match peek p with
  | Some '"' -> Edn_util.string (parse_json_string p)
  | Some '{' -> parse_json_object p
  | Some '[' -> parse_json_array p
  | Some 't' ->
      p.pos <- p.pos + 4;
      Edn_util.bool true
  | Some 'f' ->
      p.pos <- p.pos + 5;
      Edn_util.bool false
  | Some 'n' ->
      p.pos <- p.pos + 4;
      Edn_util.nil
  | Some _ -> parse_json_number p
  | None -> invalid_arg "empty json"

and parse_json_object p =
  expect p '{';
  skip_ws p;
  let rec loop fields =
    skip_ws p;
    match peek p with
    | Some '}' ->
        ignore (bump p);
        Edn_util.map (List.rev fields)
    | _ -> (
        let key = parse_json_string p in
        expect p ':';
        let value = parse_json_value p in
        skip_ws p;
        match peek p with
        | Some ',' ->
            ignore (bump p);
            loop ((Edn_util.keyword (":" ^ key), value) :: fields)
        | Some '}' ->
            ignore (bump p);
            Edn_util.map
              (List.rev ((Edn_util.keyword (":" ^ key), value) :: fields))
        | _ -> invalid_arg "expected object separator")
  in
  loop []

and parse_json_array p =
  expect p '[';
  skip_ws p;
  let rec loop values =
    skip_ws p;
    match peek p with
    | Some ']' ->
        ignore (bump p);
        Edn_util.vector (List.rev values)
    | _ -> (
        let value = parse_json_value p in
        skip_ws p;
        match peek p with
        | Some ',' ->
            ignore (bump p);
            loop (value :: values)
        | Some ']' ->
            ignore (bump p);
            Edn_util.vector (List.rev (value :: values))
        | _ -> invalid_arg "expected array separator")
  in
  loop []

and parse_json_number p =
  let start = p.pos in
  let rec loop () =
    match peek p with
    | Some ('0' .. '9' | '-' | '+') ->
        ignore (bump p);
        loop ()
    | _ -> ()
  in
  loop ();
  let text = String.sub p.text start (p.pos - start) in
  Edn_util.int (int_of_string text)

let value_of_json text = parse_json_value (parser text)

let status_of_string = function
  | "ready" -> Ready
  | "starting" -> Starting
  | "error" -> Error
  | _ -> Unknown

let owner_source_of_string = function
  | "cli" -> Cli_primitive.Cli
  | "electron" -> Electron
  | _ -> Unknown

let server_of_health ~fallback_port body =
  let raw = value_of_json body in
  let repo =
    Edn_util.get_string raw ":repo"
    |> Option.value ~default:"" |> Cli_primitive.create_repo
  in
  let host =
    Edn_util.get_string raw ":host" |> Option.value ~default:"127.0.0.1"
  in
  let port =
    Edn_util.get_int raw ":port" |> Option.value ~default:fallback_port
  in
  let pid = Edn_util.get_int raw ":pid" |> Option.value ~default:0 in
  let status =
    Edn_util.get_string raw ":status"
    |> Option.map status_of_string
    |> Option.value ~default:Unknown
  in
  let owner_source =
    Edn_util.get_string raw ":owner-source"
    |> Option.map owner_source_of_string
    |> Option.value ~default:Cli_primitive.Unknown
  in
  {
    repo;
    graph = Some (Cli_config.repo_to_graph repo);
    pid;
    host;
    port;
    base_url = "http://" ^ host ^ ":" ^ string_of_int port;
    status;
    revision = Edn_util.get_string raw ":revision";
    root_dir = Edn_util.get_string raw ":root-dir";
    owner_source;
    owned = owner_source = Cli_primitive.Cli || owner_source = Unknown;
    raw = Some raw;
  }

let discover_server (_pid, port) =
  Cli_effect.catch
    (Cli_effect.map
       (fun (response, body) ->
         if http_success response then
           Some (server_of_health ~fallback_port:port body)
         else None)
       (http_request ~method_:`GET
          ~url:("http://127.0.0.1:" ^ string_of_int port ^ "/healthz")
          ~headers:[ ("Accept", "application/json") ]
          ~body:""
          ~timeout_span:(Some (Ptime_util.span_of_ms 1_000L))))
    (fun _ -> Cli_effect.pure None)

let list_servers config =
  let entries =
    read_server_list (server_list_path config)
    |> List.filter (fun (pid, _) -> process_alive pid)
  in
  Cli_effect.map (List.filter_map Fun.id)
    (Cli_effect.all (List.map discover_server entries))

let rec mkdir_p path =
  if path = "" || path = Filename.dirname path || Sys.file_exists path then ()
  else (
    mkdir_p (Filename.dirname path);
    Cli_unix.mkdir path 0o755)

let ensure_repo_dir config repo =
  let path =
    Filename.concat (graphs_dir config) (Graph_dir.graph_dir_name_of_repo repo)
  in
  try
    mkdir_p path;
    if not (Sys.is_directory path) then
      Stdlib.Error
        (Error.make
           (Edn_util.keyword_t "root-dir-permission")
           ("graph-dir is not a directory: " ^ path))
    else Stdlib.Ok path
  with exn ->
    Stdlib.Error
      (Error.make
         (Edn_util.keyword_t "root-dir-permission")
         ("graph-dir is not readable/writable: " ^ path ^ " ("
        ^ Printexc.to_string exn ^ ")"))

let script_candidates config =
  let explicit = db_worker_runtime_script_path () in
  let project_dir = config.Cli_config.project_dir in
  let project_candidates =
    match project_dir with
    | None -> []
    | Some dir ->
        [
          Filename.concat (Filename.concat dir "static") "db-worker-node.js";
          Filename.concat (Filename.concat dir "dist") "db-worker-node.js";
          Filename.concat
            (Filename.concat (Filename.concat dir "static") "js")
            "db-worker-node.js";
        ]
  in
  explicit :: project_candidates

let resolve_script_path config =
  let candidates = script_candidates config in
  match List.find_opt Sys.file_exists candidates with
  | Some path -> Stdlib.Ok path
  | None ->
      Stdlib.Error
        (Error.make
           ~context:
             (Edn_util.vector
                (List.map (fun path -> Edn_util.string path) candidates))
           (Edn_util.keyword_t "server-script-missing")
           ("db-worker script is missing. Checked paths: "
           ^ String.concat ", " candidates))

let env_with_node_runtime () =
  let without_key key =
    Cli_unix.environment () |> Array.to_list
    |> List.filter (fun entry ->
        let prefix = key ^ "=" in
        not (starts_with ~prefix entry))
  in
  Array.of_list ("ELECTRON_RUN_AS_NODE=1" :: without_key "ELECTRON_RUN_AS_NODE")

let spawn_server_process ~script ~root_dir ~repo ~owner_source ~create_empty_db
    =
  let devnull = Cli_unix.openfile "/dev/null" [ Cli_unix.O_RDWR ] 0 in
  Fun.protect
    ~finally:(fun () -> Cli_unix.close devnull)
    (fun () ->
      let repo = Cli_primitive.string_of_repo repo in
      let args =
        [
          "env";
          "node";
          script;
          "--repo";
          repo;
          "--root-dir";
          root_dir;
          "--owner-source";
          owner_source;
        ]
      in
      let argv =
        Array.of_list
          (args @ if create_empty_db then [ "--create-empty-db" ] else [])
      in
      ignore
        (Cli_unix.create_process_env "/usr/bin/env" argv
           (env_with_node_runtime ()) devnull devnull devnull))

let find_repo_server config repo =
  Cli_effect.map
    (List.find_opt (fun (server : server) -> same_repo server.repo repo))
    (list_servers config)

let invoke_config_of_server config server =
  {
    Transport.base_url = server.base_url;
    timeout_span = config.Cli_config.timeout_span;
    profile_session = config.profile_session;
  }

let wait_until_effect ?(timeout_span = Ptime_util.span_of_ms 8_000L)
    ?(interval_span = Ptime_util.span_of_ms 50L) predicate =
  let open Cli_effect in
  let deadline =
    Option.value
      (Ptime.add_span (Ptime_util.now ()) timeout_span)
      ~default:Ptime.max
  in
  let rec loop () =
    bind (predicate ()) (function
      | Some _ as result -> pure result
      | None ->
          if Ptime.compare (Ptime_util.now ()) deadline >= 0 then pure None
          else bind (sleep interval_span) (fun () -> loop ()))
  in
  loop ()

let wait_for_lock path =
  wait_until_effect (fun () ->
      Cli_effect.pure (if Sys.file_exists path then Some () else None))

let wait_for_ready config repo =
  wait_until_effect (fun () ->
      Cli_effect.map
        (function
          | Some ({ status = Ready; _ } as server) -> Some server | _ -> None)
        (find_repo_server config repo))

let owner_manageable = function
  | Cli_primitive.Cli | Cli_primitive.Unknown -> true
  | _ -> false

let start_result_of_server repo (server : server) =
  { repo; owner_source = server.owner_source; owned = server.owned }

let start_server_unprofiled config repo ~create_empty_db =
  let open Cli_effect in
  let time stage f =
    Profile_types.time config.Cli_config.profile_session stage f
  in
  bind (find_repo_server config repo) (function
    | Some server -> pure (Stdlib.Ok (start_result_of_server repo server))
    | None when Option.is_some config.Cli_config.base_url ->
        pure
          (Stdlib.Ok { repo; owner_source = config.owner_source; owned = false })
    | None -> (
        match ensure_repo_dir config repo with
        | Stdlib.Error err -> pure (Stdlib.Error err)
        | Stdlib.Ok _ -> (
            match resolve_script_path config with
            | Stdlib.Error err -> pure (Stdlib.Error err)
            | Stdlib.Ok script -> (
                try
                  let lock =
                    lock_path ~root_dir:(resolve_root_dir config) repo
                  in
                  bind
                    (time "server.spawn-daemon" (fun () ->
                         spawn_server_process ~script
                           ~root_dir:(resolve_root_dir config) ~repo
                           ~owner_source:"cli" ~create_empty_db;
                         pure ()))
                    (fun () ->
                      bind
                        (time "server.wait-lock" (fun () -> wait_for_lock lock))
                        (function
                          | None ->
                              pure
                                (Stdlib.Error
                                   (Error.make
                                      (Edn_util.keyword_t
                                         "server-start-timeout-orphan")
                                      "db-worker-node failed to start"))
                          | Some () ->
                              bind
                                (time "server.wait-publish" (fun () ->
                                     wait_until_effect (fun () ->
                                         find_repo_server config repo)))
                                (function
                                  | None ->
                                      pure
                                        (Stdlib.Error
                                           (Error.make
                                              (Edn_util.keyword_t
                                                 "server-start-failed")
                                              "db-worker-node failed to start"))
                                  | Some _ ->
                                      bind
                                        (time "server.wait-ready" (fun () ->
                                             wait_for_ready config repo))
                                        (function
                                          | Some server ->
                                              pure
                                                (Stdlib.Ok
                                                   (start_result_of_server repo
                                                      server))
                                          | None ->
                                              pure
                                                (Stdlib.Error
                                                   (Error.make
                                                      (Edn_util.keyword_t
                                                         "server-start-failed")
                                                      "db-worker-node failed \
                                                       to start"))))))
                with exn ->
                  pure
                    (Stdlib.Error
                       (Error.make
                          (Edn_util.keyword_t "server-start-failed")
                          ("failed to spawn db-worker-node: "
                         ^ Printexc.to_string exn)))))))

let start_server config repo ~create_empty_db =
  Profile_types.time config.Cli_config.profile_session "server.ensure-started"
    (fun () -> start_server_unprofiled config repo ~create_empty_db)

let ensure_server config repo ~create_empty_db =
  match config.Cli_config.base_url with
  | Some base_url ->
      Cli_effect.pure
        (Ok
           {
             Transport.base_url;
             timeout_span = config.timeout_span;
             profile_session = config.profile_session;
           })
  | None ->
      let open Cli_effect in
      bind (find_repo_server config repo) (function
        | Some server -> pure (Ok (invoke_config_of_server config server))
        | None ->
            bind (start_server config repo ~create_empty_db) (function
              | Stdlib.Error err -> pure (Stdlib.Error err)
              | Stdlib.Ok _ ->
                  bind (find_repo_server config repo) (function
                    | Some server ->
                        pure (Ok (invoke_config_of_server config server))
                    | None ->
                        pure
                          (Stdlib.Error
                             (Error.make
                                (Edn_util.keyword_t "server-start-failed")
                                "db-worker-node failed to publish health")))))

let shutdown_server server =
  Cli_effect.catch
    (Cli_effect.map
       (fun (response, _body) -> http_success response)
       (http_request ~method_:`POST
          ~url:(server.base_url ^ "/v1/shutdown")
          ~headers:[ ("Content-Type", "application/json") ]
          ~body:"{}"
          ~timeout_span:(Some (Ptime_util.span_of_ms 1_000L))))
    (fun _ -> Cli_effect.pure false)

let stop_server config repo =
  let open Cli_effect in
  bind (find_repo_server config repo) (function
    | None when Option.is_some config.Cli_config.base_url ->
        pure (Stdlib.Ok { repo })
    | None ->
        pure
          (Stdlib.Error
             (Error.make
                (Edn_util.keyword_t "server-not-found")
                "server is not running"))
    | Some server ->
        if not (owner_manageable server.owner_source) then
          pure
            (Stdlib.Error
               (Error.make
                  (Edn_util.keyword_t "server-owned-by-other")
                  "server is owned by another process"))
        else
          let shutdown_timeout_span = Ptime_util.span_of_ms 5_000L in
          let shutdown_interval_span = Ptime_util.span_of_ms 200L in
          let kill_timeout_span = Ptime_util.span_of_ms 1_000L in
          let kill_interval_span = Ptime_util.span_of_ms 100L in
          bind (shutdown_server server) (fun _ ->
              bind
                (wait_until_effect ~timeout_span:shutdown_timeout_span
                   ~interval_span:shutdown_interval_span (fun () ->
                     map
                       (function None -> Some () | Some _ -> None)
                       (find_repo_server config repo)))
                (function
                  | Some () -> pure (Stdlib.Ok { repo })
                  | None ->
                      (try
                         if process_alive server.pid then
                           Cli_unix.kill server.pid Sys.sigterm
                       with _ -> ());
                      bind
                        (wait_until_effect ~timeout_span:kill_timeout_span
                           ~interval_span:kill_interval_span (fun () ->
                             map
                               (function None -> Some () | Some _ -> None)
                               (find_repo_server config repo)))
                        (function
                          | Some () -> pure (Stdlib.Ok { repo })
                          | None ->
                              pure
                                (Stdlib.Error
                                   (Error.make
                                      (Edn_util.keyword_t "server-stop-timeout")
                                      "timed out stopping server"))))))

let restart_server config repo =
  Cli_effect.bind (stop_server config repo) (function
    | Stdlib.Ok _ -> start_server config repo ~create_empty_db:false
    | Stdlib.Error err when err.code = Edn_util.keyword_t "server-not-found" ->
        start_server config repo ~create_empty_db:false
    | Stdlib.Error err -> Cli_effect.pure (Stdlib.Error err))

let ignored_graph_dir name =
  name = "Unlinked graphs" || name = "backup"
  || starts_with ~prefix:"file-version-" name
  || starts_with ~prefix:"logseq_db_" name

let contains_substring ~needle text =
  let needle_len = String.length needle in
  let text_len = String.length text in
  let rec loop index =
    index + needle_len <= text_len
    && (String.sub text index needle_len = needle || loop (index + 1))
  in
  needle_len = 0 || loop 0

let percent_decode text =
  let len = String.length text in
  let buffer = Buffer.create len in
  let rec loop index =
    if index >= len then Some (Buffer.contents buffer)
    else
      match text.[index] with
      | '%' when index + 2 < len -> (
          match
            ( Graph_dir.hex_value text.[index + 1],
              Graph_dir.hex_value text.[index + 2] )
          with
          | Some hi, Some lo ->
              Buffer.add_char buffer (Char.chr ((hi lsl 4) lor lo));
              loop (index + 3)
          | _ -> None)
      | '%' -> None
      | c ->
          Buffer.add_char buffer c;
          loop (index + 1)
  in
  loop 0

let legacy_compat_name dir_name =
  let len = String.length dir_name in
  let buffer = Buffer.create len in
  let rec loop index =
    if index >= len then Buffer.contents buffer
    else if index + 1 < len && String.sub dir_name index 2 = "++" then (
      Buffer.add_char buffer '/';
      loop (index + 2))
    else if index + 3 < len && String.sub dir_name index 4 = "+3A+" then (
      Buffer.add_char buffer ':';
      loop (index + 4))
    else (
      Buffer.add_char buffer dir_name.[index];
      loop (index + 1))
  in
  loop 0

let legacy_derivation_signal dir_name =
  contains_substring ~needle:"++" dir_name
  || contains_substring ~needle:"+3A+" dir_name
  || contains_substring ~needle:"%" dir_name

let decode_legacy_graph_dir_name dir_name =
  if not (legacy_derivation_signal dir_name) then None
  else
    match percent_decode (legacy_compat_name dir_name) with
    | Some decoded when decoded <> "" -> Some decoded
    | _ -> None

let canonical_graph_name graph =
  if graph <> "" && not (starts_with ~prefix:"logseq_db_" graph) then Some graph
  else None

let classify_graph_dir graphs_root dir_name =
  if ignored_graph_dir dir_name then None
  else
    match
      Option.bind
        (Graph_dir.canonical_graph_name_of_dir dir_name)
        canonical_graph_name
    with
    | Some graph_name ->
        Some
          {
            Graph_types.kind = Graph_types.Canonical;
            graph_name = Some (Cli_primitive.create_graph graph_name);
            graph_dir = Some dir_name;
            legacy_dir = None;
            target_graph_dir = None;
            conflict = false;
            reason = None;
          }
    | None -> (
        match
          Option.bind
            (decode_legacy_graph_dir_name dir_name)
            canonical_graph_name
        with
        | Some graph_name ->
            let target_graph_dir = Graph_dir.encode_graph_dir_name graph_name in
            Some
              {
                Graph_types.kind = Graph_types.Legacy;
                graph_name = Some (Cli_primitive.create_graph graph_name);
                graph_dir = None;
                legacy_dir = Some dir_name;
                target_graph_dir = Some target_graph_dir;
                conflict =
                  target_graph_dir <> dir_name
                  && Sys.file_exists
                       (Filename.concat graphs_root target_graph_dir);
                reason = None;
              }
        | None ->
            if legacy_derivation_signal dir_name then
              Some
                {
                  Graph_types.kind = Graph_types.Legacy_undecodable;
                  graph_name = None;
                  graph_dir = None;
                  legacy_dir = Some dir_name;
                  target_graph_dir = None;
                  conflict = false;
                  reason = Some (Edn_util.keyword_t ":graph-name-not-derivable");
                }
            else None)

let list_graph_items config =
  let dir = graphs_dir config in
  if Sys.file_exists dir then
    Sys.readdir dir |> Array.to_list
    |> List.filter (fun name -> Sys.is_directory (Filename.concat dir name))
    |> List.sort_uniq String.compare
    |> List.filter_map (classify_graph_dir dir)
  else []

let list_graphs config =
  list_graph_items config
  |> List.filter_map (function
    | { Graph_types.kind = Graph_types.Canonical; graph_name = Some graph; _ }
      ->
        Some graph
    | _ -> None)

let revision_matches cli_revision server =
  match server.revision with
  | Some revision -> String.equal revision cli_revision
  | None -> false

let compute_revision_mismatches ~cli_revision servers =
  let mismatched =
    List.filter
      (fun server -> not (revision_matches cli_revision server))
      servers
  in
  match mismatched with [] -> None | servers -> Some { cli_revision; servers }

let cleanup_revision_mismatched_servers config ~cli_revision =
  let open Cli_effect in
  bind (list_servers config) (fun servers ->
      let mismatched =
        List.filter
          (fun server -> not (revision_matches cli_revision server))
          servers
      in
      let eligible, skipped =
        List.partition
          (fun (server : server) -> server.owner_source = Cli_primitive.Cli)
          mismatched
      in
      let rec stop_loop (killed : server list)
          (failed : (server * Error.t) list) (targets : server list) =
        match targets with
        | [] ->
            pure
              (Ok
                 {
                   cli_revision;
                   checked = List.length servers;
                   mismatched = List.length mismatched;
                   eligible = List.length eligible;
                   skipped_owner = List.length skipped;
                   killed = List.rev killed;
                   failed = List.rev failed;
                 })
        | server :: rest ->
            bind (shutdown_server server) (fun stopped ->
                if stopped then stop_loop (server :: killed) failed rest
                else
                  stop_loop killed
                    (( server,
                       Error.make
                         (Edn_util.keyword_t "server-cleanup-failed")
                         "failed to stop revision-mismatched server" )
                    :: failed)
                    rest)
      in
      stop_loop [] [] eligible)
