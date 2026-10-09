(* The native embedding capability is absent in browser runtimes. *)

let enabled () = false
let model_id () = None
let dimension () = failwith "platform embedding/dimension missing"
let embed_texts _ =
  Db_worker_effect.error (Failure "platform embedding/embed-texts missing")
