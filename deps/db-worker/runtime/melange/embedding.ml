(* cljs frontend.worker.platform/node.cljs embedding capability —
   <embed-texts POSTs {model,input} to the configured endpoint with
   retry-until-deadline fetch; platform opts become env vars here. *)

let default_embedding_model = "all-MiniLM-L6-v2"
let embedding_fetch_timeout_ms = 120000.
let embedding_fetch_retry_ms = 250.

let embedding_model_dimensions =
  [ ("all-MiniLM-L6-v2", 384); ("BAAI/bge-m3", 1024); ("Qwen/Qwen3-Embedding-4B", 1024) ]

let endpoint () = Runtime_env.env "LOGSEQ_EMBEDDINGS_URL"

let macos_arm64 () =
  Node.Process.process##platform = "darwin" && Node.Process.process##arch = "arm64"

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

let json_string s =
  let buf = Buffer.create (String.length s + 2) in
  Buffer.add_char buf '"';
  String.iter
    (fun c ->
       match c with
       | '"' -> Buffer.add_string buf "\\\""
       | '\\' -> Buffer.add_string buf "\\\\"
       | '\n' -> Buffer.add_string buf "\\n"
       | c -> Buffer.add_char buf c)
    s;
  Buffer.add_char buf '"';
  Buffer.contents buf

(* cljs <fetch-embedding-response — retry on fetch rejection until
   the deadline; an HTTP response (even an error status) does not
   retry. *)
let rec fetch_embedding_response endpoint model request start () =
  Db_worker_effect.catch
    (Http.send request)
    (fun exn ->
       if
         Time.diff_monotonic_ms start (Time.monotonic_now ())
         < embedding_fetch_timeout_ms
       then
         Db_worker_effect.bind (Db_worker_effect.sleep embedding_fetch_retry_ms)
           (fetch_embedding_response endpoint model request start)
       else
         Db_worker_effect.error
           (Failure
              (Printf.sprintf "embedding server fetch failed {:endpoint %s, :model-id %s} %s"
                 endpoint model (Printexc.to_string exn))))

(* cljs embedding-response->vectors — body.data sorted by :index,
   mapped to :embedding float vectors. *)
let vectors_of_body body =
  let json = Js.Json.parseExn body in
  match Js.Json.decodeObject json with
  | None -> []
  | Some obj ->
      (match Js.Dict.get obj "data" with
       | None -> []
       | Some data ->
           (match Js.Json.decodeArray data with
            | None -> []
            | Some items ->
                let indexed =
                  items |> Array.to_list
                  |> List.map (fun item ->
                         match Js.Json.decodeObject item with
                         | None -> (0., [||])
                         | Some entry ->
                             let idx =
                               match Js.Dict.get entry "index" with
                               | Some v ->
                                   (match Js.Json.decodeNumber v with
                                    | Some n -> n
                                    | None -> 0.)
                               | None -> 0.
                             in
                             let emb =
                               match Js.Dict.get entry "embedding" with
                               | Some v ->
                                   (match Js.Json.decodeArray v with
                                    | Some arr ->
                                        Array.map
                                          (fun x ->
                                             Option.value
                                               (Js.Json.decodeNumber x)
                                               ~default:0.)
                                          arr
                                    | None -> [||])
                               | None -> [||]
                             in
                             (idx, emb))
                in
                indexed
                |> List.sort (fun (a, _) (b, _) -> compare a b)
                |> List.map snd))

let embed_texts texts =
  let open Db_worker_effect.Infix in
  if texts = [] then Db_worker_effect.pure []
  else
    match endpoint (), model_id () with
    | Some url, Some model ->
        let body =
          "{\"model\":" ^ json_string model ^ ",\"input\":["
          ^ String.concat "," (List.map json_string texts) ^ "]}"
        in
        let request =
          { Http.url = url
          ; method_ = "POST"
          ; headers = [ ("Content-Type", "application/json") ]
          ; body = Some body
          }
        in
        let start = Time.monotonic_now () in
        fetch_embedding_response url model request start () >>= fun resp ->
        if resp.Http.status < 200 || resp.Http.status >= 300 then
          Db_worker_effect.error
            (Failure
               (Printf.sprintf "embedding server request failed {:endpoint %s, :status %d, :model-id %s}"
                  url resp.Http.status model))
        else Db_worker_effect.pure (vectors_of_body resp.Http.body)
    | _ ->
        Db_worker_effect.error
          (Failure "platform embedding/embed-texts missing")
