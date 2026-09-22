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

  external init_module : unit -> sqlite3 Js.Promise.t = "sqlite3InitModule"

  external install_pool
    :  sqlite3
    -> < name : string ; initialCapacity : int ; directory : string > Js.t
    -> pool Js.Promise.t = "installOpfsSAHPoolVfs" [@@mel.send]

  type ctor

  external pool_db_class : pool -> ctor = "OpfsSAHPoolDb" [@@mel.get]
  (* Reflect.construct(ctor, args) == new ctor(...args) *)
  external create_db : ctor -> string array -> handle = "construct"
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
end

type handle =
  | Node_db of Database.t
  | Opfs_db of Opfs.handle

type db =
  { handle : handle
  ; filename : string
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

let open_db ~path =
  try { handle = Node_db (Database.create path); filename = path }
  with Js.Exn.Error e -> raise (Sqlite_error (js_error_message e))

(* --- OPFS pool lifecycle --- *)

let pools : (string, Opfs.pool) Hashtbl.t = Hashtbl.create 8
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
      Db_worker_effect.bind (task_of_promise (Opfs.init_module ()))
        (fun sqlite3 ->
          sqlite3_ref := Some sqlite3;
          Db_worker_effect.pure sqlite3)

let prepare_pool ~name =
  if is_node () || Hashtbl.mem pools name then Db_worker_effect.pure ()
  else
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
            Hashtbl.replace pools name pool;
            Db_worker_effect.pure ()))

(* Browser worker dbs live inside the per-graph pool under the cljs
   repo-path "/db.sqlite"; node paths pass through unchanged. *)
let open_db_pool ~name ~path =
  if is_node () then open_db ~path
  else
    match Hashtbl.find_opt pools name with
    | Some pool ->
        (try { handle =
               Opfs_db
                 (Opfs.create_db (Opfs.pool_db_class pool) [| path |])
             ; filename = path
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

let transaction t f =
  exec t ~sql:"begin" ~bind:[||];
  match f () with
  | result ->
      exec t ~sql:"commit" ~bind:[||];
      result
  | exception exn ->
      exec t ~sql:"rollback" ~bind:[||];
      raise exn

let checkpoint t = exec t ~sql:"pragma wal_checkpoint(TRUNCATE)" ~bind:[||]

let backup t ~dst_path =
  let escaped = String.concat "''" (String.split_on_char '\'' dst_path) in
  exec t ~sql:(Printf.sprintf "vacuum into '%s'" escaped) ~bind:[||]

let filename t = t.filename

let pooled_runtime () = not (is_node ())
