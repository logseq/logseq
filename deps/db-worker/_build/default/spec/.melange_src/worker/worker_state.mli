# 1 "spec/worker/worker_state.mli"
(* Per-graph runtime state: datascript conn, sqlite conn, and
   worker-level state. Mirrors frontend.worker.state. *)
val datascript_conn : string -> Datascript.conn option
val set_datascript_conn : string -> Datascript.conn -> unit
val drop_datascript_conn : string -> unit

val sqlite_conn : string -> Sqlite.db option
val set_sqlite_conn : string -> Sqlite.db -> unit
val drop_sqlite_conn : string -> unit

val repos : unit -> string list
val close_other_sqlite_conns : string -> unit

(* :worker/context — Wire.Map of context keys consumed by pipeline
   and transact options (:dev? :node-test? :importing? ...). *)
val context : unit -> Wire.t
val merge_context : Wire.t -> unit
val set_context : Wire.t -> unit

(* worker-state/*state — repo-less app state keyed by qualified
   keyword name ("git/current-repo", auth tokens, :config, ...). *)
val state_get : string -> Wire.t option
val merge_state : Wire.t -> unit

(* thread atoms — *state[:thread-atom/*] cells updated through
   :thread-api/update-thread-atom. *)
val thread_atom_names : string list
val update_thread_atom : string -> Wire.t -> unit
val thread_atom : string -> Wire.t option

(* db-sync config (sanitized, non-auth keys only). *)
val set_db_sync_config : Wire.t -> unit
val db_sync_config : unit -> Wire.t

(* In-flight ui-request deferreds, keyed by transit-encoded
   request-id. Resolves Ok result or Error normalized error map. *)
val ui_request_put : string -> (Wire.t, Wire.t) result Db_worker_effect.resolver -> unit
val ui_request_take : string -> (Wire.t, Wire.t) result Db_worker_effect.resolver option
val ui_request_ids : unit -> string list

(* uuid -> db-id of blocks deleted while a graph is open; reset on
   graph switch (worker-state/*deleted-block-uuid->db-id). *)
val deleted_block_uuid_to_db_id : unit -> (string, int) Hashtbl.t
val reset_deleted_blocks : unit -> unit

(* client-op/*repo->pending-local-tx-count *)
val pending_local_tx_count : string -> int
val set_pending_local_tx_count : string -> int -> unit
val drop_pending_local_tx_count : string -> unit
