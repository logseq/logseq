# 1 "spec/worker/graph_store.mli"
(* kvs-format storage for a graph, byte-compatible with
   frontend.worker.db-core/new-sqlite-storage:
   table kvs (addr INTEGER PK, content TEXT transit, addresses JSON). *)
val kvs_table_sql : string
val create_kvs_table : Sqlite.db -> unit
val storage : Sqlite.db -> Datascript.storage
