(* Per-graph runtime state: datascript conn, sqlite conn, and
   worker-level state. Mirrors frontend.worker.state. *)
val datascript_conn : string -> Datascript.conn option
val set_datascript_conn : string -> Datascript.conn -> unit
val drop_datascript_conn : string -> unit

val sqlite_conn : string -> Sqlite.db option
val set_sqlite_conn : string -> Sqlite.db -> unit
val drop_sqlite_conn : string -> unit

(* cljs worker-state/*sqlite-conns* — repo -> {:db :search
   :client-ops}. `sqlite_conn` is `sqlite_conn_of` Db. *)
type db_kind =
  | Db
  | Search
  | Client_ops

val sqlite_conn_of : string -> db_kind -> Sqlite.db option
val set_sqlite_conn_of : string -> db_kind -> Sqlite.db -> unit
val drop_sqlite_conn_of : string -> db_kind -> unit

(* cljs worker-state/*vector-indexes* — repo -> platform vector
   index handle. *)
val vector_index : string -> Vector_index.index option
val set_vector_index : string -> Vector_index.index -> unit
val drop_vector_index : string -> unit

(* cljs worker-state/*search-index-build-ids* and
   *vector-index-rebuild-ids* — repo -> build-id string. *)
val search_index_build_id : string -> string option
val set_search_index_build_id : string -> string -> unit
val clear_search_index_build_id : string -> unit
val vector_index_rebuild_id : string -> string option
val set_vector_index_rebuild_id : string -> string -> unit
val clear_vector_index_rebuild_id : string -> unit

(* cljs worker-state/*publishing? *)
val publishing : unit -> bool
val set_publishing : bool -> unit

val repos : unit -> string list
val close_other_sqlite_conns : string -> unit

(* Hook installed by the lifecycle layer (which knows how to fully close a
   graph's resources) so close_other_sqlite_conns can drop all per-repo
   state without a module dependency cycle. *)
val close_graph_resources_fn : (string -> unit) ref

(* :worker/context — Wire.Map of context keys consumed by pipeline
   and transact options (:dev? :node-test? :importing? ...). *)
val context : unit -> Wire.t
val merge_context : Wire.t -> unit
val set_context : Wire.t -> unit

(* worker-state/*state — repo-less app state keyed by qualified
   keyword name ("git/current-repo", auth tokens, :config, ...).
   `app_state` exposes the table itself for test snapshot/restore. *)
val app_state : (string, Wire.t) Hashtbl.t
val state_get : string -> Wire.t option
val merge_state : Wire.t -> unit

(* cljs state/set-state! — path is a keyword (or string/symbol key) or a
   vector path assoc'd-in under the first key. *)
val set_state_at_path : Wire.t -> Wire.t -> unit

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
val ui_request_put : string -> (Wire.t, Wire.t) result Db_worker_effect.resolver -> Wire.t -> unit
val ui_request_take : string -> ((Wire.t, Wire.t) result Db_worker_effect.resolver * Wire.t) option
val ui_request_ids : unit -> string list

(* uuid -> db-id of blocks deleted while a graph is open; reset on
   graph switch (worker-state/*deleted-block-uuid->db-id). *)
val deleted_block_uuid_to_db_id : unit -> (string, int) Hashtbl.t
val reset_deleted_blocks : unit -> unit

(* client-op/*repo->pending-local-tx-count *)
val pending_local_tx_count : string -> int option
val set_pending_local_tx_count : string -> int -> unit
val drop_pending_local_tx_count : string -> unit

(* :db/latest-transact-time per repo — updated by transact + the
   db-listener pipeline on every committed tx *)
val set_db_latest_tx_time : string -> unit
val db_latest_tx_time_get : string -> float option
