(* Port of logseq.db.sqlite.backup — shared SQLite backup utilities.
   The cljs node:sqlite backup()/DatabaseSync entry points map to the
   synchronous Sqlite platform surface (vacuum into). *)

open Db_worker_effect
open Db_worker_effect.Infix

(* remove-file-if-exists! — fs/rmSync {:force true} *)
let remove_file_if_exists (path : string) : unit Db_worker_effect.t =
  File_sys.remove path

(* backup-connection! — backup db to path; on any failure remove the
   destination file and rethrow. *)
let backup_connection (db : Sqlite.db) (path : string)
    : unit Db_worker_effect.t =
  match (try Ok (Sqlite.backup db ~dst_path:path) with e -> Error e) with
  | Ok () -> pure ()
  | Error e -> File_sys.remove path >>= fun () -> error e

let contains s sub = Graph_dir.contains_substring s sub

(* cljs (p/finally close): close errors containing "database is not
   open" are swallowed. *)
let close_ignore_not_open (db : Sqlite.db) : unit =
  try Sqlite.close db
  with e ->
    if not (contains (Printexc.to_string e) "database is not open") then raise e

(* backup-db-file! [src-path dst-path] — open src, backup to dst,
   finally close. *)
let backup_db_file ~(src_path : string) ~(dst_path : string)
    : unit Db_worker_effect.t =
  let db = Sqlite.open_db ~path:src_path in
  finally
    (backup_connection db dst_path)
    (fun () -> pure (close_ignore_not_open db))

(* backup-db-file! [db _src-path dst-path] — the cljs 3-arity on an
   already-open db. *)
let backup_db_file_conn (db : Sqlite.db) ~(dst_path : string)
    : unit Db_worker_effect.t =
  backup_connection db dst_path
