(* cljs platform embedding capability. Configuration (endpoint /
   model / dimension table) resolves the same on every runtime; the
   HTTP call itself goes through Http, which errors on native today —
   matching a platform where [:embedding :embed-texts] is absent. *)

let default_embedding_model = "all-MiniLM-L6-v2"

let embedding_model_dimensions =
  [ ("all-MiniLM-L6-v2", 384); ("BAAI/bge-m3", 1024); ("Qwen/Qwen3-Embedding-4B", 1024) ]

let endpoint () = Runtime_env.env "LOGSEQ_EMBEDDINGS_URL"

(* cljs vector-embedding-enabled? = macos-arm64? && endpoint seq.
   The zvec/embedding backend only ships for macOS arm64; native OCaml
   has no zvec binding, so the capability is absent. *)
let macos_arm64 () = false

let enabled () = macos_arm64 () && Option.is_some (endpoint ())

let model_id () =
  if not (enabled ()) then None
  else Some (Option.value (Runtime_env.env "LOGSEQ_EMBEDDING_MODEL") ~default:default_embedding_model)

let dimension () =
  match model_id () with
  | None -> failwith "platform embedding/dimension missing"
  | Some model ->
      (match List.assoc_opt model embedding_model_dimensions with
       | Some d -> d
       | None ->
           failwith
             (Printf.sprintf "Unsupported embedding model dimension {:model-id %s}" model))

let embed_texts _ =
  Db_worker_effect.error (Failure "platform embedding/embed-texts missing")
