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
  (if Sqlite.pooled_runtime () then
     (* browser: the upload-temp pool owns its OPFS dir — no real fs ops.
        Delete rows left by an interrupted upload instead of recreating
        the file *)
     Db_worker_effect.pure ()
   else
     File_sys.mkdir_p (upload_temp_dir ()) >>= fun () ->
     let path = upload_temp_path () in
     File_sys.exists path >>= fun exists ->
     if exists then File_sys.remove path else Db_worker_effect.pure ())
  >>= fun () ->
  Sqlite.prepare_pool ~name:(Graph_dir.pool_name "upload-temp")
  >>= fun () ->
  let db =
    Sqlite.open_db_pool ~name:(Graph_dir.pool_name "upload-temp")
      ~path:(if Sqlite.pooled_runtime () then "/upload.sqlite" else upload_temp_path ())
  in
  Graph_store.create_kvs_table db;
  if Sqlite.pooled_runtime () then
    Sqlite.exec db ~sql:"delete from kvs" ~bind:[||];
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
  if Sqlite.pooled_runtime () then
    (* free the whole temp pool — the snapshot copy can be large *)
    Sqlite.remove_vfs ~repo:"upload-temp"
  else begin
    let path = upload_temp_path () in
    File_sys.exists path >>= fun exists ->
    if exists then File_sys.remove path else Db_worker_effect.pure ()
  end
