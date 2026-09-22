(* Platform text-embedding capability — cljs platform
   [:embedding :embed-texts :model-id :dimension] and
   :vector-embedding-enabled?. cljs resolves configuration from
   platform opts; here it comes from env vars
   (LOGSEQ_EMBEDDINGS_URL / LOGSEQ_EMBEDDING_MODEL). *)

val enabled : unit -> bool

(* nil when disabled (cljs [:embedding :model-id] absent). *)
val model_id : unit -> string option

(* throws like cljs platform/embedding-dimension when disabled. *)
val dimension : unit -> int

(* POST {model, input: texts} to the embedding endpoint, sorted by
   :index like cljs embedding-response->vectors. Errors when the
   capability is absent or the server fails. *)
val embed_texts : string list -> float array list Db_worker_effect.t
