let default_embedding_model = "all-MiniLM-L6-v2"

let embedding_model_dimensions =
  [ ("all-MiniLM-L6-v2", 384); ("BAAI/bge-m3", 1024); ("Qwen/Qwen3-Embedding-4B", 1024) ]

let endpoint () = Runtime_env.env "LOGSEQ_EMBEDDINGS_URL"

external macos_arm64 : unit -> bool = "logseq_macos_arm64"

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

let vectors_of_body body =
  let open Yojson.Basic.Util in
  body |> Yojson.Basic.from_string |> member "data" |> to_list
  |> List.map (fun item ->
    let index = item |> member "index" |> to_int in
    let vector = item |> member "embedding" |> to_list
      |> List.map (function `Int n -> float_of_int n | `Float n -> n
        | _ -> failwith "Invalid embedding coordinate") |> Array.of_list in
    if Array.exists (fun n -> not (Float.is_finite n)) vector then
      failwith "Non-finite embedding coordinate";
    index, vector)
  |> List.sort (fun (left, _) (right, _) -> Int.compare left right)
  |> List.mapi (fun expected (index, vector) ->
    if index <> expected then failwith "Embedding response has missing or duplicate indexes";
    vector)

let embed_texts texts =
  let open Db_worker_effect.Infix in
  if texts = [] then Db_worker_effect.pure []
  else match endpoint (), model_id () with
  | Some url, Some model ->
      let body = Yojson.Basic.to_string (`Assoc ["model", `String model;
        "input", `List (List.map (fun text -> `String text) texts)]) in
      let request = { Http.url; method_ = "POST";
        headers = ["Content-Type", "application/json"]; body = Some body } in
      let started = Time.monotonic_now () in
      let rec fetch () =
        Db_worker_effect.catch (Http.send request) (fun error ->
          if Time.diff_monotonic_ms started (Time.monotonic_now ()) < 120000. then
            Db_worker_effect.sleep 250. >>= fetch
          else Db_worker_effect.error error) in
      fetch () >>= fun response ->
      if response.Http.status < 200 || response.status >= 300 then
        Db_worker_effect.error (Failure (Printf.sprintf "Embedding request failed: HTTP %d" response.status))
      else
        let vectors = vectors_of_body response.body in
        if List.length vectors <> List.length texts then
          Db_worker_effect.error (Failure "Embedding response count differs from input count")
        else Db_worker_effect.pure vectors
  | _ -> Db_worker_effect.error (Failure "platform embedding/embed-texts missing")
