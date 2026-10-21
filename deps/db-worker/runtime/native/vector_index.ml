type handle
external open_collection : string -> string -> int -> bool -> handle = "logseq_zvec_open"
external close_collection : handle -> unit = "logseq_zvec_close"
external destroy_collection : handle -> unit = "logseq_zvec_destroy"

type index = { path : string; dimension : int; mutable collection : handle }

type doc =
  { id : string
  ; page : string
  ; embedding : float array
  ; vector_title : string option
  }

type query_result =
  { id : string
  ; page : string option
  ; vector_score : float
  ; vector_title : string option
  }


external upsert_docs : handle -> doc array -> unit = "logseq_zvec_upsert"
external delete_ids : handle -> string array -> unit = "logseq_zvec_delete"
external query_docs : handle -> float array -> int -> (string * string * float * string) array = "logseq_zvec_query"

(* Test executables can load the SDK staged by scripts/build-native.sh without
   copying the 40 MB library into every test directory. *)
let library_path () =
  match Sys.getenv_opt "LOGSEQ_ZVEC_LIBRARY_PATH" with
  | Some path -> path
  | None -> Filename.concat (Filename.dirname Sys.executable_name) "libzvec_c_api.dylib"

let open_index ~path ~dimension =
  if not (Embedding.enabled ()) then Db_worker_effect.pure None
  else if dimension <= 0 then Db_worker_effect.error (Invalid_argument "Vector dimension must be positive")
  else
    Db_worker_effect.bind (File_sys.mkdir_p (Filename.dirname path)) (fun () ->
      let collection = open_collection (library_path ()) path dimension (not (Sys.file_exists path)) in
      Db_worker_effect.pure (Some { path; dimension; collection }))

let validate index embedding =
  if Array.length embedding <> index.dimension then invalid_arg "Vector dimension mismatch";
  if Array.exists (fun value -> not (Float.is_finite value) || abs_float value > 3.402823466e38) embedding then
    invalid_arg "Invalid FP32 vector coordinate"

let close index = close_collection index.collection

let upsert index documents =
  List.iter (fun (doc : doc) -> validate index doc.embedding) documents;
  if documents <> [] then upsert_docs index.collection (Array.of_list documents)

let delete index ids =
  if ids <> [] then delete_ids index.collection (Array.of_list ids)

let truncate index =
  destroy_collection index.collection;
  index.collection <- open_collection (library_path ()) index.path index.dimension true

let vector_page_filter_topk_multipliers = [4; 16; 64]

let vector_query_topks limit page =
  match page with
  | Some _ -> List.map (fun multiplier -> limit * multiplier) vector_page_filter_topk_multipliers
  | None -> [limit]

let query index ~embedding ~limit ~page =
  validate index embedding;
  if limit < 0 then invalid_arg "Vector query limit must be nonnegative";
  if limit = 0 then []
  else
    let rec search = function
      | [] -> []
      | topk :: remaining ->
          let results = query_docs index.collection embedding topk |> Array.to_list
            |> List.filter_map (fun (id, result_page, distance, title) ->
              if Option.is_some page && page <> Some result_page then None
              else Some { id; page = Some result_page; vector_score = 1. /. (1. +. distance);
                vector_title = Some title })
            |> List.filteri (fun position _ -> position < limit) in
          if List.length results >= limit || remaining = [] then results else search remaining in
    search (vector_query_topks limit page)

let set_metadata index entries =
  File_sys.write_text_atomic (Filename.concat index.path "metadata.json")
    (Json.stringify (Wire.Map (List.map (fun (key, value) -> Wire.String key, value) entries)))
