(* ocaml-sqlite3 backend. *)
type db =
  { handle : Sqlite3.db
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

let data_of_bind = function
  | Null -> Sqlite3.Data.NULL
  | Integer n -> Sqlite3.Data.INT n
  | Float f -> Sqlite3.Data.FLOAT f
  | Text s -> Sqlite3.Data.TEXT s
  | Blob s -> Sqlite3.Data.BLOB s

let bind_of_data = function
  | Sqlite3.Data.NONE | Sqlite3.Data.NULL -> Null
  | Sqlite3.Data.INT n -> Integer n
  | Sqlite3.Data.FLOAT f -> Float f
  | Sqlite3.Data.TEXT s -> Text s
  | Sqlite3.Data.BLOB s -> Blob s

let check rc context =
  match rc with
  | Sqlite3.Rc.OK | Sqlite3.Rc.DONE | Sqlite3.Rc.ROW -> ()
  | rc -> raise (Sqlite_error (context ^ ": " ^ Sqlite3.Rc.to_string rc))

let open_db ~path =
  let handle = Sqlite3.db_open path in
  { handle; filename = path }

let close t = ignore (Sqlite3.db_close t.handle)

let exec t ~sql ~bind =
  if Array.length bind = 0 then begin
    check (Sqlite3.exec t.handle sql) sql
  end else begin
    let stmt = Sqlite3.prepare t.handle sql in
    (try
       Array.iteri (fun i b -> check (Sqlite3.bind stmt (i + 1) (data_of_bind b)) sql) bind;
       let rec loop () =
         match Sqlite3.step stmt with
         | Sqlite3.Rc.DONE -> ()
         | Sqlite3.Rc.ROW -> loop ()
         | rc -> raise (Sqlite_error (sql ^ ": " ^ Sqlite3.Rc.to_string rc))
       in
       loop ()
     with exn ->
       ignore (Sqlite3.finalize stmt);
       raise exn);
    ignore (Sqlite3.finalize stmt)
  end

let query t ~sql ~bind =
  let stmt = Sqlite3.prepare t.handle sql in
  let rows = ref [] in
  (try
     Array.iteri (fun i b -> check (Sqlite3.bind stmt (i + 1) (data_of_bind b)) sql) bind;
     let ncols = Sqlite3.column_count stmt in
     let rec loop () =
       match Sqlite3.step stmt with
       | Sqlite3.Rc.DONE -> ()
       | Sqlite3.Rc.ROW ->
           let row = Array.init ncols (fun i -> bind_of_data (Sqlite3.column stmt i)) in
           rows := row :: !rows;
           loop ()
       | rc -> raise (Sqlite_error (sql ^ ": " ^ Sqlite3.Rc.to_string rc))
     in
     loop ()
   with exn ->
     ignore (Sqlite3.finalize stmt);
     raise exn);
  ignore (Sqlite3.finalize stmt);
  List.rev !rows

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
