(* frontend.worker.sync.temp-sqlite — temp sqlite db + conn for
   graph uploads. The cljs platform pool machinery collapses to a file
   under the worker db dir. *)

open Db_worker_effect.Infix

let upload_temp_dir () =
  Filename.concat (Sync_state.db_dir ()) "upload-temp"

let upload_temp_path () =
  Filename.concat (upload_temp_dir ()) "upload.sqlite"

(* <create-temp-sqlite-db! *)
let create_temp_sqlite_db () : Sqlite.db Db_worker_effect.t =
  File_sys.mkdir_p (upload_temp_dir ()) >>= fun () ->
  let path = upload_temp_path () in
  File_sys.exists path >>= fun exists ->
  (if exists then File_sys.remove path else Db_worker_effect.pure ())
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
  let path = upload_temp_path () in
  File_sys.exists path >>= fun exists ->
  if exists then File_sys.remove path else Db_worker_effect.pure ()
