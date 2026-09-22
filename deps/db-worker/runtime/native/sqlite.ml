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

let prepare_pool ~name:_ = Db_worker_effect.pure ()
let open_db_pool ~name:_ ~path = open_db ~path

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

let pooled_runtime () = false

(* --- raw db-file ops (cljs storage :export-file/:import-db) --- *)

let native_pool_path dir path =
  let stripped =
    if String.length path > 0 && path.[0] = '/'
    then String.sub path 1 (String.length path - 1)
    else path
  in
  Filename.concat dir stripped

let export_file ~name:_ ~dir ~path =
  let full = native_pool_path dir path in
  if Sys.file_exists full then
    let ic = open_in_bin full in
    Fun.protect
      ~finally:(fun () -> close_in_noerr ic)
      (fun () -> Db_worker_effect.pure (In_channel.input_all ic))
  else
    Db_worker_effect.error
      (Failure ("sqlite export_file: file not found: " ^ full))

let import_db ~name:_ ~dir ~path contents =
  let full = native_pool_path dir path in
  Db_worker_effect.bind
    (File_sys.mkdir_p (Filename.dirname full))
    (fun () ->
      let oc = open_out_bin full in
      Fun.protect
        ~finally:(fun () -> close_out_noerr oc)
        (fun () -> Out_channel.output_string oc contents);
      Db_worker_effect.pure ())
