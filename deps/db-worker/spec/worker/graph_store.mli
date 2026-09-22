(* kvs-format storage for a graph, byte-compatible with
   frontend.worker.db-core/new-sqlite-storage:
   table kvs (addr INTEGER PK, content TEXT transit, addresses JSON). *)
val kvs_table_sql : string
val create_kvs_table : Sqlite.db -> unit
val storage : Sqlite.db -> Datascript.storage
val restore : Sqlite.db -> string -> Datascript.storage_payload option
val delete : Sqlite.db -> string list -> unit
