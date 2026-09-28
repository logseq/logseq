(* Dual backend: node:sqlite DatabaseSync (Node >= 22) and browser
   OPFS via @sqlite.org/sqlite-wasm oo1 OpfsSAHPoolDb. *)
module Database = struct
  type t
  type stmt

  external create : string -> t = "DatabaseSync" [@@mel.new] [@@mel.module "node:sqlite"]
  external exec : t -> string -> unit = "exec" [@@mel.send]
  external close : t -> unit = "close" [@@mel.send]
  external prepare : t -> string -> stmt = "prepare" [@@mel.send]
  external stmt_run : stmt -> Js.Json.t array -> unit = "run" [@@mel.send] [@@mel.variadic]
  external stmt_all : stmt -> Js.Json.t array -> Js.Json.t Js.Dict.t array = "all"
    [@@mel.send] [@@mel.variadic]
end

(* sqlite-wasm oo1 handles. *)
module Opfs = struct
  type sqlite3
  type pool
  type handle
  type oo1

  (* @sqlite.org/sqlite-wasm's bundler-friendly default export
     (sqlite3InitModule). Imported as a module so the bundle is
     self-contained — vite inlines it; locateFile keeps sqlite3.wasm
     resolving relative to the worker script (static/js/). *)
  external init_module
    :  < print : string -> unit
       ; printErr : string -> unit
       ; locateFile : string -> string -> string [@u]
       > Js.t
    -> sqlite3 Js.Promise.t = "default"
    [@@mel.module "@sqlite.org/sqlite-wasm"]

  external install_pool
    :  sqlite3
    -> < name : string ; initialCapacity : int ; directory : string > Js.t
    -> pool Js.Promise.t = "installOpfsSAHPoolVfs" [@@mel.send]

  type ctor

  external oo1 : sqlite3 -> oo1 = "oo1" [@@mel.get]
  external db_class : oo1 -> ctor = "DB" [@@mel.get]
  external pool_db_class : pool -> ctor = "OpfsSAHPoolDb" [@@mel.get]
  (* Reflect.construct(ctor, args) == new ctor(...args) *)
  external create_db : ctor -> Js.Json.t array -> handle = "construct"
    [@@mel.scope "Reflect"]
  external exec : handle -> string -> unit = "exec" [@@mel.send]

  external exec_query
    :  handle
    -> < sql : string
       ; bind : Js.Json.t array
       ; rowMode : string
       ; returnValue : string >
         Js.t
    -> Js.Json.t array array = "exec" [@@mel.send]

  external close : handle -> unit = "close" [@@mel.send]

  (* PoolUtil methods — exportFile is sync (throws when the name is not in
     the pool), importDb resolves a promise. *)
  external export_file : pool -> string -> Js.Typed_array.Uint8Array.t = "exportFile"
    [@@mel.send]

  external import_db : pool -> string -> Js.Typed_array.Uint8Array.t -> unit Js.Promise.t = "importDb"
    [@@mel.send]

  (* pool-level storage ops — absent on the node fake pool, hence
     undefined-able getters. The getters only test presence: calling
     the extracted function would drop `this` (OpfsSAHPoolUtil methods
     read this.#e), so invocation goes through the _send bindings. *)
  external has_pause_vfs : pool -> (unit -> unit) Js.Undefined.t = "pauseVfs" [@@mel.get]
  external has_unpause_vfs : pool -> (unit -> unit) Js.Undefined.t = "unpauseVfs" [@@mel.get]
  external has_get_capacity : pool -> (unit -> int) Js.Undefined.t = "getCapacity" [@@mel.get]

  external pause_vfs : pool -> pool = "pauseVfs" [@@mel.send]
  external unpause_vfs : pool -> pool Js.Promise.t = "unpauseVfs" [@@mel.send]
  external get_capacity : pool -> int = "getCapacity" [@@mel.send]
  external remove_vfs : pool -> unit Js.Promise.t = "removeVfs" [@@mel.send]
end

(* OPFS root directory handles — navigator.storage.getDirectory plus
   the FileSystemDirectoryHandle surface used by list-graphs /
   db-exists?. *)
module Opfs_nav = struct
  type dir_handle
  type entry
  type iter
  type next_result

  external get_directory : unit -> dir_handle Js.Promise.t = "getDirectory"
    [@@mel.scope "navigator.storage"]

  external get_directory_handle : dir_handle -> string -> dir_handle Js.Promise.t
    = "getDirectoryHandle" [@@mel.send]

  external values : dir_handle -> iter = "values" [@@mel.send]
  external next : iter -> next_result Js.Promise.t = "next" [@@mel.send]
  external next_done : next_result -> bool = "done" [@@mel.get]
  external next_value : next_result -> entry Js.Undefined.t = "value" [@@mel.get]
  external kind : entry -> string = "kind" [@@mel.get]
  external name : entry -> string = "name" [@@mel.get]
end

type handle =
  | Node_db of Database.t
  | Opfs_db of Opfs.handle

type db =
  { handle : handle
  ; filename : string
  ; mutable tx_depth : int
  ; mutable savepoint_seq : int
  }

type bind =
  | Null
  | Integer of int64
  | Float of float
  | Text of string
  | Blob of string

type row = bind array

exception Sqlite_error of string

let json_of_bind = function
  | Null -> Js.Json.null
  | Integer n -> Js.Json.number (Int64.to_float n)
  | Float f -> Js.Json.number f
  | Text s -> Js.Json.string s
  | Blob s -> Js.Json.string s

let bind_of_json j =
  match Js.Json.classify j with
  | Js.Json.JSONNull -> Null
  | Js.Json.JSONFalse -> Integer 0L
  | Js.Json.JSONTrue -> Integer 1L
  | Js.Json.JSONNumber f ->
      if Float.of_int (int_of_float f) = f then Integer (Int64.of_float f) else Float f
  | Js.Json.JSONString s -> Text s
  | _ -> Text (Js.Json.stringify j)

let js_error_message e =
  match Js.Exn.message e with Some m -> m | None -> "sqlite error"

(* node:sqlite exists iff we run under Node. *)
external global_process : Js.Json.t Js.Undefined.t = "process"
  [@@mel.scope "globalThis"]

let is_node () =
  match Js.Undefined.toOption global_process with
  | None -> false
  | Some _ -> true

(* --- OPFS pool lifecycle --- *)

let pools : (string, Opfs.pool) Hashtbl.t = Hashtbl.create 8

(* cljs unsafe-unlink-db captures the pool object before close-db!
   drops it from the registry; drop_pool stashes it here so a later
   remove_vfs can still call pool.removeVfs(). *)
let dropped_pools : (string, Opfs.pool) Hashtbl.t = Hashtbl.create 4
let sqlite3_ref : Opfs.sqlite3 option ref = ref None

external promise_error_message : Js.Promise.error -> string option = "message"

let task_of_promise promise =
  let task, resolver = Db_worker_effect.wait () in
  let finish result =
    if Db_worker_effect.is_pending task then Db_worker_effect.wakeup resolver result
  in
  let on_ok value = finish (Ok value); Js.Promise.resolve () in
  let on_error error =
    let message =
      Option.value (promise_error_message error)
        ~default:"JavaScript promise rejected"
    in
    finish (Error message);
    Js.Promise.resolve ()
  in
  ignore
    (promise |> Js.Promise.then_ on_ok |> Js.Promise.catch on_error
      : unit Js.Promise.t);
  Db_worker_effect.bind task (function
    | Ok value -> Db_worker_effect.pure value
    | Error message -> Db_worker_effect.error (Failure message))

let ensure_sqlite3 () =
  match !sqlite3_ref with
  | Some sqlite3 -> Db_worker_effect.pure sqlite3
  | None ->
      (* cljs sqlite-init! taps module stdout/stderr into the log. *)
      Db_worker_effect.bind
        (task_of_promise
           (Opfs.init_module
              [%obj
                { print = (fun s -> Worker_log.info "sqlite-wasm" [ "stdout", s ])
                ; printErr = (fun s -> Worker_log.error "sqlite-wasm" [ "stderr", s ])
                ; locateFile = (fun [@u] path _script_dir -> path)
                }]))
        (fun sqlite3 ->
          sqlite3_ref := Some sqlite3;
          Db_worker_effect.pure sqlite3)

let init () =
  if is_node () then Db_worker_effect.pure ()
  else Db_worker_effect.map (fun _ -> ()) (ensure_sqlite3 ())

let open_db ~path =
  if is_node () then
    try
      { handle = Node_db (Database.create path)
      ; filename = path
      ; tx_depth = 0
      ; savepoint_seq = 0
      }
    with Js.Exn.Error e -> raise (Sqlite_error (js_error_message e))
  else
    (* cljs browser non-pool open: new oo1.DB(path, "c") — publishing
       graphs only; requires init to have loaded sqlite-wasm. *)
    match !sqlite3_ref with
    | Some s3 ->
        (try
           { handle =
               Opfs_db
                 (Opfs.create_db (Opfs.db_class (Opfs.oo1 s3))
                    [| Js.Json.string path; Js.Json.string "c" |])
           ; filename = path
           ; tx_depth = 0
           ; savepoint_seq = 0
           }
         with Js.Exn.Error e -> raise (Sqlite_error (js_error_message e)))
    | None -> raise (Sqlite_error "sqlite-wasm module not initialized")

(* cljs <open-dbs: unpauseVfs when the pool's capacity hit 0 (post
   release-access-handles). The promise is awaited before any db open
   proceeds — racing OpfsSAHPoolDb against acquireAccessHandles throws
   NoModificationAllowedError. *)
let unpause_when_empty pool =
  match
    Js.Undefined.toOption (Opfs.has_get_capacity pool),
    Js.Undefined.toOption (Opfs.has_unpause_vfs pool)
  with
  | Some _, Some _ when Opfs.get_capacity pool = 0 ->
      Db_worker_effect.map
        (fun _ -> ())
        (task_of_promise (Opfs.unpause_vfs pool))
  | _ -> Db_worker_effect.pure ()

let prepare_pool ~name =
  if is_node () then Db_worker_effect.pure ()
  else
    match Hashtbl.find_opt pools name with
    | Some pool ->
        Hashtbl.remove dropped_pools name;
        unpause_when_empty pool
    | None ->
        Db_worker_effect.bind (ensure_sqlite3 ()) (fun sqlite3 ->
            Db_worker_effect.bind
              (task_of_promise
                 (Opfs.install_pool sqlite3
                    [%obj
                      { name
                      ; initialCapacity = 20
                      ; directory = "." ^ name
                      }]))
              (fun pool ->
                Hashtbl.remove dropped_pools name;
                Hashtbl.replace pools name pool;
                unpause_when_empty pool))

(* Browser worker dbs live inside the per-graph pool under the cljs
   repo-path "/db.sqlite"; node paths pass through unchanged. *)
let open_db_pool ~name ~path =
  if is_node () then open_db ~path
  else
    match Hashtbl.find_opt pools name with
    | Some pool ->
        (try
           { handle =
               Opfs_db
                 (Opfs.create_db (Opfs.pool_db_class pool)
                    [| Js.Json.string path |])
           ; filename = path
           ; tx_depth = 0
           ; savepoint_seq = 0
           }
         with Js.Exn.Error e -> raise (Sqlite_error (js_error_message e)))
    | None -> raise (Sqlite_error ("opfs pool not prepared: " ^ name))

let close t =
  match t.handle with
  | Node_db d -> Database.close d
  | Opfs_db d -> Opfs.close d

let bind_args bind = Array.map json_of_bind bind

let exec t ~sql ~bind =
  try
    match t.handle with
    | Node_db d ->
        if Array.length bind = 0 then Database.exec d sql
        else Database.stmt_run (Database.prepare d sql) (bind_args bind)
    | Opfs_db d ->
        if Array.length bind = 0 then Opfs.exec d sql
        else
          ignore
            (Opfs.exec_query d
               [%obj
                 { sql
                 ; bind = bind_args bind
                 ; rowMode = "array"
                 ; returnValue = "resultRows"
                 }])
  with Js.Exn.Error e -> raise (Sqlite_error (js_error_message e))

let query t ~sql ~bind =
  try
    match t.handle with
    | Node_db d ->
        let stmt = Database.prepare d sql in
        let rows = Database.stmt_all stmt (bind_args bind) in
        Array.map
          (fun row ->
             let fields = Js.Dict.entries row in
             Array.map (fun (_k, v) -> bind_of_json v) fields)
          rows
        |> Array.to_list
    | Opfs_db d ->
        let rows =
          Opfs.exec_query d
            [%obj
              { sql
              ; bind = bind_args bind
              ; rowMode = "array"
              ; returnValue = "resultRows"
              }]
        in
        rows |> Array.to_list
        |> List.map (fun row -> Array.map bind_of_json row)
  with Js.Exn.Error e -> raise (Sqlite_error (js_error_message e))

(* cljs platform/node.cljs with-transaction: BEGIN at depth 0,
   SAVEPOINT __logseq_tx_N when nested. *)
let transaction t f =
  let outermost = t.tx_depth = 0 in
  let savepoint =
    if outermost then ""
    else begin
      t.savepoint_seq <- t.savepoint_seq + 1;
      Printf.sprintf "__logseq_tx_%d" t.savepoint_seq
    end
  in
  exec t ~sql:(if outermost then "begin" else "SAVEPOINT " ^ savepoint)
    ~bind:[||];
  t.tx_depth <- t.tx_depth + 1;
  (* Fun.protect uses caml_raise_if_exception / backtrace helpers that are
     not polyfilled under Melange; decrement tx_depth explicitly instead. *)
  let run_finally (work : unit -> 'a) : 'a =
    match work () with
    | result ->
        t.tx_depth <- t.tx_depth - 1;
        result
    | exception e ->
        t.tx_depth <- t.tx_depth - 1;
        raise e
  in
  run_finally
    (fun () ->
      match f () with
      | result ->
          exec t
            ~sql:
              (if outermost then "commit"
               else "RELEASE SAVEPOINT " ^ savepoint)
            ~bind:[||];
          result
      | exception exn ->
          (if outermost then
             (try exec t ~sql:"rollback" ~bind:[||] with _ -> ())
           else begin
             (try
                exec t ~sql:("ROLLBACK TO SAVEPOINT " ^ savepoint) ~bind:[||]
              with _ -> ());
             (try exec t ~sql:("RELEASE SAVEPOINT " ^ savepoint) ~bind:[||]
              with _ -> ())
           end);
          raise exn)

let checkpoint t = exec t ~sql:"pragma wal_checkpoint(TRUNCATE)" ~bind:[||]

let backup t ~dst_path =
  let escaped = String.concat "''" (String.split_on_char '\'' dst_path) in
  exec t ~sql:(Printf.sprintf "vacuum into '%s'" escaped) ~bind:[||]

let filename t = t.filename

let pooled_runtime () = not (is_node ())

(* --- raw db-file ops (cljs storage :export-file/:import-db) --- *)

module U8 = Js.Typed_array.Uint8Array

external u8a_get : U8.t -> int -> int = "" [@@mel.get_index]
external u8a_set : U8.t -> int -> int -> unit = "" [@@mel.set_index]
external u8a_length : U8.t -> int = "length" [@@mel.get]
external new_u8a : int -> U8.t = "Uint8Array" [@@mel.new]

let string_of_u8a a = String.init (u8a_length a) (fun i -> Char.chr (u8a_get a i))

let u8a_of_string s =
  let a = new_u8a (String.length s) in
  String.iteri (fun i c -> u8a_set a i (Char.code c)) s;
  a

(* node fs binary helpers — latin1 encoding keeps the byte string 1:1
   (Buffer.from/toString default to utf8, which would corrupt bytes). *)
external readFileSync : string -> Node.Buffer.t = "readFileSync" [@@mel.module "fs"]

external writeFileSync : string -> Node.Buffer.t -> unit = "writeFileSync"
  [@@mel.module "fs"]

external mkdirSync : string -> < recursive : bool > Js.t -> unit = "mkdirSync"
  [@@mel.module "fs"]

external dirname : string -> string = "dirname" [@@mel.module "path"]

let node_pool_path dir path =
  let stripped =
    if String.length path > 0 && path.[0] = '/'
    then String.sub path 1 (String.length path - 1)
    else path
  in
  Filename.concat dir stripped

let export_file ~name ~dir ~path =
  if is_node () then
    try
      let b = readFileSync (node_pool_path dir path) in
      Db_worker_effect.pure (Node.Buffer.toString ~encoding:`latin1 b)
    with Js.Exn.Error e ->
      Db_worker_effect.error (Failure (js_error_message e))
  else
    match Hashtbl.find_opt pools name with
    | Some pool ->
        (try Db_worker_effect.pure (string_of_u8a (Opfs.export_file pool path))
         with Js.Exn.Error e ->
           Db_worker_effect.error (Failure (js_error_message e)))
    | None ->
        Db_worker_effect.error
          (Failure ("opfs pool not prepared: " ^ name))

let import_db ~name ~dir ~path contents =
  if is_node () then
    try
      let full = node_pool_path dir path in
      mkdirSync (dirname full) [%obj { recursive = true }];
      writeFileSync full (Node.Buffer.fromStringWithEncoding ~encoding:`latin1 contents);
      Db_worker_effect.pure ()
    with Js.Exn.Error e ->
      Db_worker_effect.error (Failure (js_error_message e))
  else
    match Hashtbl.find_opt pools name with
    | Some pool ->
        task_of_promise (Opfs.import_db pool path (u8a_of_string contents))
    | None ->
        Db_worker_effect.error
          (Failure ("opfs pool not prepared: " ^ name))

(* ---------- storage-level graph ops (cljs platform/browser.cljs +
   platform/node.cljs :storage map) ---------- *)

let data_dir () =
  match Runtime_env.env "LOGSEQ_WORKER_DB_DIR" with
  | Some dir -> dir
  | None -> "."

let repo_dir repo =
  match Graph_dir.repo_to_encoded_graph_dir_name repo with
  | Some dir -> Filename.concat (data_dir ()) dir
  | None -> raise (Sqlite_error ("cannot encode graph name: " ^ repo))

(* node fs.statSync().isDirectory() — keeps graph-dir filtering
   faithful to node.cljs's withFileTypes readdir. *)
module Fs_stat = struct
  type stat

  external statSync : string -> stat = "statSync" [@@mel.module "fs"]
  external is_directory : stat -> bool = "isDirectory" [@@mel.send]
end

let is_directory path =
  try Fs_stat.is_directory (Fs_stat.statSync path)
  with Js.Exn.Error _ -> false

let pool_for repo = Hashtbl.find_opt pools (Graph_dir.pool_name repo)

let list_graphs () =
  if is_node () then
    Db_worker_effect.bind (File_sys.readdir (data_dir ()))
      (fun entries ->
        let names =
          List.filter_map
            (fun entry ->
              let dir = Filename.concat (data_dir ()) entry in
              if is_directory dir then
                match Graph_dir.decode_canonical_graph_dir_key entry with
                | Some name
                  when not
                         (String.equal name "Unlinked graphs"
                          || String.equal name "backup") ->
                    Some name
                | _ -> None
              else None)
            entries
        in
        Db_worker_effect.pure names)
  else
    (* browser: OPFS root ".logseq-pool-*" dirs — decode strips the
       prefix then +3A+ -> : and ++ -> / (legacy pool-name encoding). *)
    Db_worker_effect.bind
      (task_of_promise (Opfs_nav.get_directory ()))
      (fun root ->
        let iter = Opfs_nav.values root in
        let rec collect acc =
          Db_worker_effect.bind
            (task_of_promise (Opfs_nav.next iter))
            (fun res ->
              if Opfs_nav.next_done res then Db_worker_effect.pure (List.rev acc)
              else
                match Js.Undefined.toOption (Opfs_nav.next_value res) with
                | Some entry
                  when String.equal (Opfs_nav.kind entry) "directory" ->
                    let name = Opfs_nav.name entry in
                    if
                      String.length name > 13
                      && String.sub name 0 13 = ".logseq-pool-"
                    then
                      let graph =
                        Graph_dir.str_replace_all
                          (Graph_dir.str_replace_all
                             (String.sub name 13 (String.length name - 13))
                             "+3A+" ":")
                          "++" "/"
                      in
                      collect (graph :: acc)
                    else collect acc
                | _ -> collect acc)
        in
        collect [])

let db_exists ~repo =
  if is_node () then
    File_sys.exists (Filename.concat (repo_dir repo) "db.sqlite")
  else
    let name = "." ^ Graph_dir.pool_name repo in
    Db_worker_effect.catch
      (Db_worker_effect.bind
         (task_of_promise (Opfs_nav.get_directory ()))
         (fun root ->
           Db_worker_effect.map (fun _ -> true)
             (task_of_promise (Opfs_nav.get_directory_handle root name))))
      (fun _ -> Db_worker_effect.pure false)

let remove_vfs ~repo =
  if is_node () then
    let dir = repo_dir repo in
    Db_worker_effect.bind (File_sys.readdir dir)
      (fun entries ->
        Db_worker_effect.all
          (List.map
             (fun entry -> File_sys.remove (Filename.concat dir entry))
             entries)
        |> Db_worker_effect.map (fun _ -> ()))
  else
    let name = Graph_dir.pool_name repo in
    match Hashtbl.find_opt pools name with
    | Some pool ->
        Hashtbl.remove pools name;
        task_of_promise (Opfs.remove_vfs pool)
    | None ->
        (match Hashtbl.find_opt dropped_pools name with
         | Some pool ->
             Hashtbl.remove dropped_pools name;
             task_of_promise (Opfs.remove_vfs pool)
         | None -> Db_worker_effect.pure ())

let pause_vfs ~repo =
  match pool_for repo with
  | Some pool ->
      (match Js.Undefined.toOption (Opfs.has_pause_vfs pool) with
       | Some _ -> ignore (Opfs.pause_vfs pool)
       | None -> ())
  | None -> ()

let unpause_vfs ~repo =
  match pool_for repo with
  | Some pool ->
      (match Js.Undefined.toOption (Opfs.has_unpause_vfs pool) with
       | Some _ -> ignore (Opfs.unpause_vfs pool)
       | None -> ())
  | None -> ()

let pool_capacity ~repo =
  match pool_for repo with
  | Some pool ->
      (match Js.Undefined.toOption (Opfs.has_get_capacity pool) with
       | Some _ -> Opfs.get_capacity pool
       | None -> 0)
  | None -> 0

let drop_pool ~repo =
  let name = Graph_dir.pool_name repo in
  match Hashtbl.find_opt pools name with
  | Some pool ->
      Hashtbl.remove pools name;
      Hashtbl.replace dropped_pools name pool
  | None -> ()
