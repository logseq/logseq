(* Platform vector-search index — the cljs platform [:vector
   :open-index] handle. A runtime without a vector backend returns
   None from open_index (cljs platform/vector-open returns nil when
   the capability is absent). *)

type index

(* doc passed to :upsert! — :vector-title is indexed for context
   term-match boosts but does not affect vector distance. *)
type doc =
  { id : string
  ; page : string
  ; embedding : float array
  ; vector_title : string option
  }

type query_result =
  { id : string
  ; page : string option
  ; vector_score : float (* cljs 1/(1+score), 0 when absent *)
  ; vector_title : string option
  }

val open_index
  :  path:string
  -> dimension:int
  -> index option Db_worker_effect.t

val query
  :  index
  -> embedding:float array
  -> limit:int
  -> page:string option
  -> query_result list

val upsert : index -> doc list -> unit
val delete : index -> string list -> unit
val truncate : index -> unit

(* :set-metadata! — persists {:embedding-model-id :embedding-dimension
   :context-version} next to the on-disk index. *)
val set_metadata : index -> (string * Wire.t) list -> unit Db_worker_effect.t
