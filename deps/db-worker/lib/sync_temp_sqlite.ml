(* Temporary snapshot databases use an OPFS pool in browsers and a
   file under the worker db directory in filesystem runtimes. *)

open Db_worker_effect.Infix

let upload_temp_dir () =
  Filename.concat (Sync_state.db_dir ()) "upload-temp"

let upload_temp_path () =
  Filename.concat (upload_temp_dir ()) "upload.sqlite"

(* <create-temp-sqlite-db! *)
let create_temp_sqlite_db () : Sqlite.db Db_worker_effect.t =
  let path = upload_temp_path () in
  (if Sqlite.pooled_runtime () then Sqlite.remove_vfs ~repo:"upload-temp"
   else
     File_sys.mkdir_p (upload_temp_dir ()) >>= fun () ->
     File_sys.exists path >>= fun exists ->
     if exists then File_sys.remove path else Db_worker_effect.pure ())
  >>= fun () ->
  Sqlite.prepare_pool ~name:(Graph_dir.pool_name "upload-temp")
  >>= fun () ->
  let db =
    Sqlite.open_db_pool ~name:(Graph_dir.pool_name "upload-temp")
      ~path:(if Sqlite.pooled_runtime () then "/upload.sqlite" else path)
  in
  Graph_store.create_kvs_table db;
  Db_worker_effect.pure db

(* <create-temp-sqlite-conn *)
let create_temp_sqlite_conn (schema : Datascript.schema)
    (datoms : Datascript.datom list)
    : (Sqlite.db * Datascript.conn) Db_worker_effect.t =
  create_temp_sqlite_db () >>= fun db ->
  let storage = Graph_store.storage db in
  let conn = Datascript.conn_from_datoms datoms ~schema ~storage in
  Db_worker_effect.pure (db, conn)

let cleanup_temp_sqlite db : unit Db_worker_effect.t =
  Sqlite.close db;
  if Sqlite.pooled_runtime () then Sqlite.remove_vfs ~repo:"upload-temp"
  else
    let path = upload_temp_path () in
    File_sys.exists path >>= fun exists ->
    if exists then File_sys.remove path else Db_worker_effect.pure ()
