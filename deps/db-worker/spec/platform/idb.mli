(* Minimal string KV on top of whatever durable store the platform
   has: IndexedDB (localforage "localforage"/"keyvaluepairs" v2) in
   the browser worker, transit-encoded kv-store.json on node, a file
   kv natively. *)
val get : string -> string option Db_worker_effect.t
val set : string -> string -> unit Db_worker_effect.t
val delete : string -> unit Db_worker_effect.t
val keys : unit -> string list Db_worker_effect.t

(* cljs idb/init! — browser opens the "localforage" db (v2,
   "keyvaluepairs" store) up front; node/native are file stores and
   init is a no-op. *)
val init : unit -> unit Db_worker_effect.t

(* Binary values (cached AES keys etc). Browser stores Uint8Array
   (structured-clone), node the transit "uint8array" tag, native raw
   bytes. *)
val get_binary : string -> string option Db_worker_effect.t
val set_binary : string -> string -> unit Db_worker_effect.t
