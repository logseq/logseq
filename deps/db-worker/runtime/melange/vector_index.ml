(* cljs frontend.worker.platform/node.cljs zvec vector index.

   Lazy `js/require` of @zvec/zvec (cljs zvec-module) so runtimes
   without a zvec build still load. open_index returns None unless
   vector-embedding-enabled? (darwin+arm64 with an embedding endpoint),
   mirroring platform [:vector :open-index] being absent. Enum values
   and query params are passed through as opaque Js.t handles read off
   the module — no casts. *)

type jsv = < > Js.t
type zvec_module = jsv
type zvec_collection = jsv
type zvec_schema = jsv
type doc_js = jsv

type index =
  { path : string
  ; dimension : int
  ; mutable collection : zvec_collection
  }

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

(* --- zvec externals --------------------------------------------- *)

external require_ : string -> zvec_module = "require"

(* gobj/get *)
external get : jsv -> string -> jsv = "" [@@mel.get_index]

external zvec_initialize : zvec_module -> jsv -> unit = "ZVecInitialize"
  [@@mel.send]

external zvec_open : zvec_module -> string -> jsv -> zvec_collection
  = "ZVecOpen" [@@mel.send]

external zvec_create_and_open
  :  zvec_module
  -> string
  -> zvec_schema
  -> jsv
  -> zvec_collection = "ZVecCreateAndOpen" [@@mel.send]

external schema_new : zvec_module -> jsv -> zvec_schema
  = "ZVecCollectionSchema" [@@mel.send] [@@mel.new]

external log_opts : logLevel:jsv -> jsv = "" [@@mel.obj]
external open_opts : enableMMAP:bool -> jsv = "" [@@mel.obj]

external index_params_plain : indexType:jsv -> jsv = "" [@@mel.obj]
external index_params_vec : indexType:jsv -> metricType:jsv -> jsv = ""
  [@@mel.obj]

external vec_field_cfg
  :  name:string
  -> dataType:jsv
  -> dimension:int
  -> indexParams:jsv
  -> jsv = "" [@@mel.obj]

external str_field_idx_cfg : name:string -> dataType:jsv -> indexParams:jsv -> jsv
  = "" [@@mel.obj]

external str_field_cfg : name:string -> dataType:jsv -> jsv = "" [@@mel.obj]

external schema_cfg : name:string -> vectors:jsv array -> fields:jsv array -> jsv
  = "" [@@mel.obj]

external query_params : indexType:jsv -> ef:int -> jsv = "" [@@mel.obj]

external query_cfg
  :  fieldName:string
  -> topk:int
  -> vector:float array
  -> outputFields:string array
  -> params:jsv
  -> jsv = "" [@@mel.obj]

external doc_vectors : embedding:float array -> jsv = "" [@@mel.obj]
external doc_fields : page:string -> title:string -> jsv = "" [@@mel.obj]

external doc_cfg : id:string -> vectors:jsv -> fields:jsv -> doc_js = ""
  [@@mel.obj]

external query_sync : zvec_collection -> jsv -> jsv array = "querySync"
  [@@mel.send]

external upsert_sync : zvec_collection -> doc_js array -> unit = "upsertSync"
  [@@mel.send]

external delete_sync : zvec_collection -> string array -> unit = "deleteSync"
  [@@mel.send]

external destroy_sync : zvec_collection -> unit = "destroySync" [@@mel.send]

(* querySync result doc fields *)
external doc_id : jsv -> string = "id" [@@mel.get]
external doc_score : jsv -> float option = "score"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

external doc_result_fields : jsv -> jsv = "fields" [@@mel.get]
external field_string : jsv -> string -> string option = ""
  [@@mel.get_index] [@@mel.return { undefined_to_opt }]

(* --- module state (cljs *zvec-module / *zvec-initialized?) -------- *)

let zvec_module_ref : zvec_module option ref = ref None
let zvec_initialized = ref false

let zvec_module () =
  match !zvec_module_ref with
  | Some m -> m
  | None ->
      let m = require_ "@zvec/zvec" in
      zvec_module_ref := Some m;
      m

let zvec_enum_value m enum_name value_name = get (get m enum_name) value_name

let initialize_zvec () =
  let m = zvec_module () in
  if not !zvec_initialized then begin
    zvec_initialized := true;
    zvec_initialize m (log_opts ~logLevel:(zvec_enum_value m "ZVecLogLevel" "WARN"))
  end

let zvec_vector_field = "embedding"
let zvec_page_field = "page"
let zvec_title_field = "title"

let zvec_schema m dimension =
  let vectors =
    [| vec_field_cfg ~name:zvec_vector_field
         ~dataType:(zvec_enum_value m "ZVecDataType" "VECTOR_FP32")
         ~dimension
         ~indexParams:
           (index_params_vec
              ~indexType:(zvec_enum_value m "ZVecIndexType" "HNSW")
              ~metricType:(zvec_enum_value m "ZVecMetricType" "COSINE"))
    |]
  in
  let fields =
    [| str_field_idx_cfg ~name:zvec_page_field
         ~dataType:(zvec_enum_value m "ZVecDataType" "STRING")
         ~indexParams:
           (index_params_plain ~indexType:(zvec_enum_value m "ZVecIndexType" "INVERT"))
     ; str_field_cfg ~name:zvec_title_field
         ~dataType:(zvec_enum_value m "ZVecDataType" "STRING")
    |]
  in
  schema_new m (schema_cfg ~name:"blocks" ~vectors ~fields)

let create_zvec_collection m path dimension =
  zvec_create_and_open m path (zvec_schema m dimension)
    (open_opts ~enableMMAP:true)

external exn_code : Js.Exn.t -> string option = "code"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

(* cljs zvec-collection-missing-error? *)
let zvec_collection_missing_error (e : Js.Exn.t) =
  match exn_code e with
  | Some "ZVEC_NOT_FOUND" -> true
  | Some "ZVEC_INVALID_ARGUMENT" ->
      (match Js.Exn.message e with
       | Some msg ->
           let pat = " not exist" in
           let rec find i =
             i + String.length pat <= String.length msg
             && (String.sub msg i (String.length pat) = pat || find (i + 1))
           in
           find 0
       | None -> false)
  | Some _ | None -> false

let open_zvec_collection m path dimension =
  initialize_zvec ();
  try zvec_open m path (open_opts ~enableMMAP:true)
  with
  | Js.Exn.Error e as exn ->
      if zvec_collection_missing_error e then
        create_zvec_collection m path dimension
      else raise exn
  | exn -> raise exn

(* --- ops ---------------------------------------------------------- *)

let vector_page_filter_topk_multipliers = [ 4; 16; 64 ]

let vector_query_topks limit page =
  match page with
  | Some _ -> List.map (fun mul -> limit * mul) vector_page_filter_topk_multipliers
  | None -> [ limit ]

let zvec_doc (d : doc) =
  doc_cfg ~id:d.id ~vectors:(doc_vectors ~embedding:d.embedding)
    ~fields:(doc_fields ~page:d.page
               ~title:(Option.value d.vector_title ~default:""))

let zvec_result_of_doc d =
  let fields = doc_result_fields d in
  { id = doc_id d
  ; page = field_string fields zvec_page_field
  ; vector_score =
      (match doc_score d with
       | Some distance -> 1.0 /. (1.0 +. distance)
       | None -> 0.0)
  ; vector_title = field_string fields zvec_title_field
  }

let query_zvec m collection (embedding : float array) topk =
  query_sync collection
    (query_cfg ~fieldName:zvec_vector_field ~topk ~vector:embedding
       ~outputFields:[| zvec_page_field; zvec_title_field |]
       ~params:
         (query_params ~indexType:(zvec_enum_value m "ZVecIndexType" "HNSW") ~ef:300))

let rec query_loop m collection embedding topks limit page acc =
  match topks with
  | [] -> acc
  | topk :: rest ->
      let docs = query_zvec m collection embedding topk in
      let results =
        docs |> Array.to_list |> List.map zvec_result_of_doc
        |> List.filter (fun r ->
               match page with
               | None -> true
               | Some p -> Option.equal String.equal r.page (Some p))
        |> List.filteri (fun i _ -> i < limit)
      in
      let enough =
        match page with
        | None -> true
        | Some _ -> List.length results >= limit
      in
      if enough || rest = [] then results
      else query_loop m collection embedding rest limit page results

let query index ~embedding ~limit ~page =
  let m = zvec_module () in
  query_loop m index.collection embedding (vector_query_topks limit page) limit page []

let upsert index docs =
  upsert_sync index.collection (Array.of_list (List.map zvec_doc docs))

let delete index ids = delete_sync index.collection (Array.of_list ids)

let truncate index =
  destroy_sync index.collection;
  let m = zvec_module () in
  index.collection <- open_zvec_collection m index.path index.dimension

(* --- open + metadata ----------------------------------------------- *)

let dirname path =
  match String.rindex_opt path '/' with
  | Some i when i > 0 -> String.sub path 0 i
  | Some _ -> "/"
  | None -> path

let metadata_path path = path ^ "/metadata.json"

(* cljs write-vector-metadata! — clj->js keyword keys stay hyphenated. *)
let json_quote s =
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

(* clj->js + JSON.stringify of the cljs metadata map. *)
let rec wire_json_str = function
  | Wire.String s -> json_quote s
  | Wire.Int n -> string_of_int n
  | Wire.Int64 n -> Int64.to_string n
  | Wire.Float f -> Printf.sprintf "%g" f
  | Wire.Bool b -> string_of_bool b
  | Wire.Nil -> "null"
  | Wire.Keyword s | Wire.Symbol s -> json_quote s
  | Wire.Uuid s | Wire.Uri s | Wire.Big_decimal s | Wire.Big_int s -> json_quote s
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      "[" ^ String.concat "," (List.map wire_json_str xs) ^ "]"
  | Wire.Map kvs ->
      "{"
      ^ String.concat ","
          (List.map
             (fun (k, v) -> Printf.sprintf "%s:%s" (wire_key_json k) (wire_json_str v))
             kvs)
      ^ "}"
  | Wire.Tagged (_, v) -> wire_json_str v
  | Wire.Binary _ | Wire.Date_ms _ ->
      failwith "vector_index metadata: unsupported wire value"

and wire_key_json = function
  | Wire.Keyword s | Wire.String s -> json_quote s
  | _ -> failwith "vector_index metadata: unsupported map key"

let set_metadata index entries =
  let open Db_worker_effect.Infix in
  File_sys.mkdir_p index.path >>= fun () ->
  File_sys.write_text (metadata_path index.path)
    ("{"
     ^ String.concat ","
         (List.map
            (fun (k, v) -> Printf.sprintf "%s:%s" (json_quote k) (wire_json_str v))
            entries)
     ^ "}")

let open_index ~path ~dimension =
  let open Db_worker_effect.Infix in
  if not (Embedding.enabled ()) then Db_worker_effect.pure None
  else
    File_sys.mkdir_p (dirname path) >>= fun () ->
    let m = zvec_module () in
    Db_worker_effect.pure
      (Some { path; dimension; collection = open_zvec_collection m path dimension })
