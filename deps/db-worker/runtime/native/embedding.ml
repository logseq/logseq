(* Native vector indexing and embedding generation are unavailable. *)
let enabled () = false
let model_id () = None
let dimension () = failwith "Native vector embeddings are unavailable"
let embed_texts _ = Db_worker_effect.error (Failure "Native vector embeddings are unavailable")
