(* node:sqlite DatabaseSync backend (Node >= 22). Browser OPFS
   sqlite-wasm adapter lands with the worker bundle milestone. *)
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

type db =
  { db : Database.t
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

let open_db ~path =
  try { db = Database.create path; filename = path }
  with Js.Exn.Error e ->
    let msg = match Js.Exn.message e with Some m -> m | None -> "sqlite open failed" in
    raise (Sqlite_error msg)

let close t = Database.close t.db

let bind_args bind = Array.map json_of_bind bind

let exec t ~sql ~bind =
  try
    if Array.length bind = 0 then Database.exec t.db sql
    else Database.stmt_run (Database.prepare t.db sql) (bind_args bind)
  with Js.Exn.Error e ->
    let msg = match Js.Exn.message e with Some m -> m | None -> sql in
    raise (Sqlite_error msg)

let query t ~sql ~bind =
  let stmt = Database.prepare t.db sql in
  let rows = Database.stmt_all stmt (bind_args bind) in
  Array.map
    (fun row ->
       let fields = Js.Dict.entries row in
       Array.map (fun (_k, v) -> bind_of_json v) fields)
    rows
  |> Array.to_list

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
