(* Port of logseq.db-worker.graph-backup — shared Node-only graph
   backup filesystem policy. Sync fs calls stay synchronous; the one
   promesa surface (create-backup!) becomes a Js.Promise. *)

module Fs = struct
  type stats
  type dirent

  external exists_sync : string -> bool = "existsSync" [@@mel.module "fs"]
  external mkdir_sync : string -> unit = "mkdirSync" [@@mel.module "fs"]

  external mkdir_sync_opts :
    string -> < recursive : bool > Js.t -> unit = "mkdirSync"
    [@@mel.module "fs"]

  external readdir_dirents :
    string -> < withFileTypes : bool > Js.t -> dirent array = "readdirSync"
    [@@mel.module "fs"]

  external stat_sync : string -> stats = "statSync" [@@mel.module "fs"]

  external rm_sync :
    string -> < recursive : bool ; force : bool > Js.t -> unit = "rmSync"
    [@@mel.module "fs"]

  external rename_sync : string -> string -> unit = "renameSync"
    [@@mel.module "fs"]

  external read_file_utf8 :
    string -> (_ [@mel.as "utf8"]) -> string = "readFileSync"
    [@@mel.module "fs"]

  external write_file_utf8 :
    string -> string -> (_ [@mel.as "utf8"]) -> unit = "writeFileSync"
    [@@mel.module "fs"]

  external dirent_name : dirent -> string = "name" [@@mel.get]
  external dirent_is_directory : dirent -> bool = "isDirectory" [@@mel.send]
  external stat_is_file : stats -> bool = "isFile" [@@mel.send]
  external stat_mtime_ms : stats -> float = "mtimeMs" [@@mel.get]
  external stat_size : stats -> float = "size" [@@mel.get]
end

external process_pid : int = "pid" [@@mel.scope "process"]
external path_resolve : string -> string = "resolve" [@@mel.module "path"]
external get_index : 'a -> string -> 'b Js.Undefined.t = ""
  [@@mel.get_index]
external promise_error_as_exn : Js.Promise.error -> exn = "%identity"
external exn_as_json : exn -> Js.Json.t = "%identity"

let exn_code (e : exn) : string option =
  Option.bind
    (Js.Undefined.toOption (get_index (exn_as_json e) "code"))
    Js.Json.decodeString

let exn_info ?(code : string option) (message : string)
    (fields : (string * string) list) : exn =
  Dispatcher.Exn_info
    ( message
    , (match code with
       | Some c -> [ (Wire.Keyword "code", Wire.Keyword c) ]
       | None -> [])
      @ List.map (fun (k, v) -> (Wire.Keyword k, Wire.String v)) fields )

let backup_root_dir_name = "backup"
let backup_db_file_name = "db.sqlite"
let backup_metadata_file_name = "metadata.edn"
let metadata_schema_version = 1

let required_opt (v : 'a option) (label : string) : 'a =
  match v with
  | Some v -> v
  | None -> raise (Failure (label ^ " is required"))

let required_string (v : string) (label : string) : unit =
  if String.equal v "" then raise (Failure (label ^ " is required"))

(* child-path! — join parent/child and reject results that escape the
   parent directory. *)
let child_path ~(parent : string) ~(child : string) ~(label : string)
    : string =
  let path = Node.Path.join [| parent; child |] in
  let parent_path = path_resolve parent in
  let child_path = path_resolve path in
  let relative_path = Node.Path.relative ~from:parent_path ~to_:child_path () in
  if
    String.equal (String.trim relative_path) ""
    || String.starts_with ~prefix:".." relative_path
    || Node.Path.isAbsolute relative_path
  then
    raise
      (exn_info ~code:"invalid-backup-path"
         ("invalid " ^ label ^ " path")
         [ ("parent", parent); ("child", child); ("path", path) ])
  else path

let backup_root_path ~(graphs_dir : string) ~(repo : string) : string =
  required_string graphs_dir "graphs-dir";
  required_string repo "repo";
  let graph_dir =
    required_opt
      (Graph_dir.repo_to_encoded_graph_dir_name repo)
      "encoded graph directory"
  in
  Node.Path.join
    [| child_path ~parent:graphs_dir ~child:graph_dir
         ~label:"graph directory"
     ; backup_root_dir_name |]

let backup_dir_name ~(backup_name : string) : string =
  required_string backup_name "backup-name";
  (* cljs graph-dir-key->encoded-dir-name = (some-> key
     encode-graph-dir-name); Graph_dir.encode_graph_dir_name returns a
     string, so there is nothing option-shaped to require beyond the
     non-empty input checked above. *)
  Graph_dir.encode_graph_dir_name backup_name

let backup_dir_path ~(graphs_dir : string) ~(repo : string)
    ~(backup_name : string) : string =
  child_path ~parent:(backup_root_path ~graphs_dir ~repo)
    ~child:(backup_dir_name ~backup_name) ~label:"backup directory"

let backup_db_path ~(graphs_dir : string) ~(repo : string)
    ~(backup_name : string) : string =
  Node.Path.join
    [| backup_dir_path ~graphs_dir ~repo ~backup_name
     ; backup_db_file_name |]

let backup_metadata_path ~(graphs_dir : string) ~(repo : string)
    ~(backup_name : string) : string =
  Node.Path.join
    [| backup_dir_path ~graphs_dir ~repo ~backup_name
     ; backup_metadata_file_name |]

let pad2 (v : int) : string = if v < 10 then "0" ^ string_of_int v else string_of_int v

let utc_timestamp () : string =
  let now = Js.Date.make () in
  Printf.sprintf "%d%s%sT%s%s%sZ"
    (int_of_float (Js.Date.getUTCFullYear now))
    (pad2 (int_of_float (Js.Date.getUTCMonth now) + 1))
    (pad2 (int_of_float (Js.Date.getUTCDate now)))
    (pad2 (int_of_float (Js.Date.getUTCHours now)))
    (pad2 (int_of_float (Js.Date.getUTCMinutes now)))
    (pad2 (int_of_float (Js.Date.getUTCSeconds now)))

let trimmed_option (v : string option) : string option =
  match v with
  | Some v -> (
      let t = String.trim v in
      if String.equal t "" then None else Some t)
  | None -> None

let build_backup_name ?(timestamp : string option) (repo : string)
    (label : string option) : string =
  let timestamp = Option.value timestamp ~default:(utc_timestamp ()) in
  let graph_name =
    required_opt (Graph_dir.repo_to_graph_dir_key repo) "graph name"
  in
  match trimmed_option label with
  | Some label -> graph_name ^ "-" ^ label ^ "-" ^ timestamp
  | None -> graph_name ^ "-" ^ timestamp

type backup_target = {
  backup_name : string;
  dir_path : string;
  db_path : string;
}

let next_backup_target ~(graphs_dir : string) ~(repo : string)
    ~(base_name : string) : backup_target =
  required_string base_name "backup-name";
  let rec loop suffix =
    let backup_name =
      if suffix = 0 then base_name else base_name ^ "-" ^ string_of_int suffix
    in
    let dir_path = backup_dir_path ~graphs_dir ~repo ~backup_name in
    if Fs.exists_sync dir_path then loop (suffix + 1)
    else
      { backup_name
      ; dir_path
      ; db_path = Node.Path.join [| dir_path; backup_db_file_name |]
      }
  in
  loop 0

(* stat-file — Some stats when the path is a file, None when missing;
   other errors propagate. *)
let stat_file (file_path : string) : Fs.stats option =
  try
    let stat = Fs.stat_sync file_path in
    if Fs.stat_is_file stat then Some stat else None
  with e -> if exn_code e = Some "ENOENT" then None else raise e

(* read-metadata — EDN map or Nil on any parse/read failure (cljs
   swallows all errors). *)
let read_metadata (metadata_path : string) : Datascript.value =
  try Edn_util.read_string (Fs.read_file_utf8 metadata_path)
  with _ -> Datascript.Nil

type backup_entry = {
  name : string;
  dir_path : string;
  path : string;
  created_at : float;
  size_bytes : float;
  metadata : Datascript.value;
}

let backup_entry (root_path : string) (dirent : Fs.dirent)
    : backup_entry option =
  let dir_name = Fs.dirent_name dirent in
  match Graph_dir.decode_graph_dir_name dir_name with
  | None -> None
  | Some backup_name ->
      let dir_path = Node.Path.join [| root_path; dir_name |] in
      let db_path = Node.Path.join [| dir_path; backup_db_file_name |] in
      (match stat_file db_path with
       | None -> None
       | Some stat ->
           Some
             { name = backup_name
             ; dir_path
             ; path = db_path
             ; created_at = Fs.stat_mtime_ms stat
             ; size_bytes = Fs.stat_size stat
             ; metadata =
                 read_metadata
                   (Node.Path.join [| dir_path; backup_metadata_file_name |])
             })

let backup_entries ~(graphs_dir : string) ~(repo : string)
    : backup_entry list =
  let root_path = backup_root_path ~graphs_dir ~repo in
  if Fs.exists_sync root_path then
    Fs.readdir_dirents root_path [%mel.obj { withFileTypes = true }]
    |> Array.to_list
    |> List.filter Fs.dirent_is_directory
    |> List.filter_map (backup_entry root_path)
    |> List.sort (fun a b -> compare (a.name, a.created_at) (b.name, b.created_at))
  else []

let metadata_source (metadata : Datascript.value) : string option =
  match Clj_value.map_get metadata "source" with
  | Datascript.Keyword s | Datascript.String s -> Some s
  | _ -> None

let metadata_created_at_ms (metadata : Datascript.value) : float option =
  match Clj_value.map_get metadata "created-at-ms" with
  | Datascript.Int64 n -> Some (Int64.to_float n)
  | Datascript.Float f -> Some f
  | _ -> None

type list_entry = {
  name : string;
  created_at : float;
  size_bytes : float;
  source : string option;
}

let list_backups ~(graphs_dir : string) ~(repo : string) : list_entry list =
  List.map
    (fun (e : backup_entry) ->
      { name = e.name
      ; created_at = e.created_at
      ; size_bytes = e.size_bytes
      ; source = metadata_source e.metadata
      })
    (backup_entries ~graphs_dir ~repo)

let latest_backup_info ~(graphs_dir : string) ~(repo : string)
    ~(source : string) : backup_entry option =
  backup_entries ~graphs_dir ~repo
  |> List.filter (fun e -> metadata_source e.metadata = Some source)
  |> List.sort (fun a b ->
         compare
           (Option.value (metadata_created_at_ms b.metadata)
              ~default:Float.neg_infinity)
           (Option.value (metadata_created_at_ms a.metadata)
              ~default:Float.neg_infinity))
  |> function
  | e :: _ -> Some e
  | [] -> None

(* prune-backups! *)
let prune_backups ~(graphs_dir : string) ~(repo : string)
    ~(source : string) ~(keep_versions : int) : backup_entry list =
  required_string graphs_dir "graphs-dir";
  required_string repo "repo";
  required_string source "source";
  if keep_versions < 0 then
    raise (Failure "keep-versions must be a non-negative integer");
  let to_remove =
    backup_entries ~graphs_dir ~repo
    |> List.filter (fun e -> metadata_source e.metadata = Some source)
    |> List.sort (fun a b ->
           compare
             (Option.value (metadata_created_at_ms b.metadata)
                ~default:Float.neg_infinity)
             (Option.value (metadata_created_at_ms a.metadata)
                ~default:Float.neg_infinity))
    |> fun l ->
    let rec drop n l = if n <= 0 then l else match l with [] -> [] | _ :: tl -> drop (n - 1) tl in
    drop keep_versions l
  in
  List.iter
    (fun (e : backup_entry) ->
      Fs.rm_sync e.dir_path [%mel.obj { recursive = true; force = true }])
    to_remove;
  to_remove

let reserve_next_backup_target ~(graphs_dir : string) ~(repo : string)
    ~(base_name : string) : backup_target =
  Fs.mkdir_sync_opts
    (backup_root_path ~graphs_dir ~repo)
    [%mel.obj { recursive = true }];
  let rec loop suffix =
    let backup_name =
      if suffix = 0 then base_name else base_name ^ "-" ^ string_of_int suffix
    in
    let dir_path = backup_dir_path ~graphs_dir ~repo ~backup_name in
    match (try Ok (Fs.mkdir_sync dir_path) with e -> Error e) with
    | Ok () ->
        { backup_name
        ; dir_path
        ; db_path = Node.Path.join [| dir_path; backup_db_file_name |]
        }
    | Error e ->
        if exn_code e = Some "EEXIST" then loop (suffix + 1) else raise e
  in
  loop 0

let cleanup_reserved_target ~(dir_path : string) ~(tmp_db_path : string)
    ~(db_path : string) : unit =
  if
    (not (String.equal tmp_db_path ""))
    && Fs.exists_sync tmp_db_path
  then Fs.rm_sync tmp_db_path [%mel.obj { recursive = false; force = true }];
  if not (Fs.exists_sync db_path) then
    Fs.rm_sync dir_path [%mel.obj { recursive = true; force = true }]

let edn_ms (ms : float) : Datascript.value =
  if Float.is_integer ms then
    Datascript.Int64 (Int64.of_float ms)
  else Datascript.Float ms

let write_metadata ~(graphs_dir : string) ~(repo : string)
    ~(backup_name : string) ~(source : string) ~(created_at_ms : float)
    ~(db_path : string) : unit =
  Fs.write_file_utf8
    (backup_metadata_path ~graphs_dir ~repo ~backup_name)
    (Edn_util.pr_str
       (Datascript.Map
          [ (Datascript.Keyword "schema-version"
            , Datascript.Int64 (Int64.of_int metadata_schema_version))
          ; (Datascript.Keyword "name", Datascript.String backup_name)
          ; (Datascript.Keyword "repo", Datascript.String repo)
          ; (Datascript.Keyword "source", Datascript.Keyword source)
          ; (Datascript.Keyword "created-at-ms", edn_ms created_at_ms)
          ; (Datascript.Keyword "db-path", Datascript.String db_path)
          ]))

let throttled ~(graphs_dir : string) ~(repo : string) ~(source : string)
    ~(throttle_ms : int option) ~(now_ms : float) : bool =
  match throttle_ms with
  | Some throttle_ms when throttle_ms > 0 ->
      (match latest_backup_info ~graphs_dir ~repo ~source with
       | Some latest ->
           (match metadata_created_at_ms latest.metadata with
            | Some created_at_ms -> now_ms -. created_at_ms < float_of_int throttle_ms
            | None -> false)
       | None -> false)
  | _ -> false

type create_opts = {
  graphs_dir : string;
  repo : string;
  backup_name : string;
  source : string;
  snapshot : string -> unit Js.Promise.t;
  now_ms : float option;
  keep_versions : int option;
  throttle_ms : int option;
}

type backup_result = {
  backup_name : string option;
  path : string option;
  created : bool;
  reason : string option;
}

let create_backup (opts : create_opts) : backup_result Js.Promise.t =
  try
    required_string opts.graphs_dir "graphs-dir";
    required_string opts.repo "repo";
    required_string opts.backup_name "backup-name";
    required_string opts.source "source";
    let created_at_ms =
      Option.value opts.now_ms ~default:(Js.Date.now ())
    in
    if
      throttled ~graphs_dir:opts.graphs_dir ~repo:opts.repo
        ~source:opts.source ~throttle_ms:opts.throttle_ms
        ~now_ms:created_at_ms
    then
      Js.Promise.resolve
        { backup_name = None
        ; path = None
        ; created = false
        ; reason = Some "too-soon"
        }
    else
      let target =
        reserve_next_backup_target ~graphs_dir:opts.graphs_dir
          ~repo:opts.repo ~base_name:opts.backup_name
      in
      let tmp_db_path =
        Node.Path.join
          [| target.dir_path
           ; Printf.sprintf "db.%d.%s.tmp.sqlite" process_pid
               (Uuid_gen.uuid ()) |]
      in
      opts.snapshot tmp_db_path
      |> Js.Promise.then_ (fun () ->
             (match stat_file tmp_db_path with
              | None ->
                  raise
                    (exn_info ~code:"missing-snapshot"
                       "snapshot did not create sqlite backup"
                       [ ("path", tmp_db_path) ])
              | Some _ -> ());
             Fs.rename_sync tmp_db_path target.db_path;
             write_metadata ~graphs_dir:opts.graphs_dir ~repo:opts.repo
               ~backup_name:target.backup_name ~source:opts.source
               ~created_at_ms ~db_path:target.db_path;
             (match opts.keep_versions with
              | Some keep_versions ->
                  ignore
                    (prune_backups ~graphs_dir:opts.graphs_dir
                       ~repo:opts.repo ~source:opts.source ~keep_versions)
              | None -> ());
             Js.Promise.resolve
               { backup_name = Some target.backup_name
               ; path = Some target.db_path
               ; created = true
               ; reason = None
               })
      |> Js.Promise.catch (fun e ->
             cleanup_reserved_target ~dir_path:target.dir_path
               ~tmp_db_path ~db_path:target.db_path;
             Js.Promise.reject (promise_error_as_exn e))
  with e -> Js.Promise.reject e

let backup_result_to_js (r : backup_result) : Js.Json.t =
  let d = Js.Dict.empty () in
  Js.Dict.set d "backup-name"
    (match r.backup_name with Some s -> Js.Json.string s | None -> Js.Json.null);
  Js.Dict.set d "path"
    (match r.path with Some s -> Js.Json.string s | None -> Js.Json.null);
  Js.Dict.set d "created?" (Js.Json.boolean r.created);
  Js.Dict.set d "reason"
    (match r.reason with Some s -> Js.Json.string s | None -> Js.Json.null);
  Js.Json.object_ d
