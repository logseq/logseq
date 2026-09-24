(* Faithful port of src/main/frontend/worker/export.cljs — the worker-layer
   helpers behind the export thread-api endpoints.

   - get_all_page_content: cljs `common-file/get-all-page->content` re-export.
   - get_blocks_export_data: cljs `get-blocks-export-data` (coll-or-single uuid
     args, all-pages / single-page / root-blocks branches).
   - get_debug_datoms: cljs `get-debug-datoms` — datoms with url values and
     sensitive title/name values scrubbed.
   - export_blocks_as_format: cljs `export-blocks-as-format` — ->db-edn via
     Gp_mldoc.to_db_edn, then the handler.export text pipeline
     (Export_common_impl / Export_text_impl) for :markdown; other formats
     raise (cljs unsupported-format throw).

   init() wiring: none — called by Endpoint_export. *)

open Datascript

module BM = Block_map

(* cljs context map keys -> Export_file.context. Callers pass a plain options
   map (e.g. frontend.handler.export.common/get-content-config or
   {:export-bullet-indentation ...}); absent keys keep cljs behavior where
   (or (:export-bullet-indentation context) "  ") and nil flags are false. *)
let context_of_value (v : value) : Export_file.context =
  let m = Sqlite_build.bm_of_value v in
  let s k =
    match Sqlite_build.bm_get_opt m k with
    | Some (String x) -> Some x
    | _ -> None
  in
  let b k =
    match Sqlite_build.bm_get_opt m k with
    | Some (Bool x) -> x
    | _ -> false
  in
  { export_bullet_indentation =
      Option.value ~default:"  " (s "export-bullet-indentation")
  ; excluded_properties =
      (match Sqlite_build.bm_get_opt m "excluded-properties" with
       | Some c ->
           List.filter_map
             (function
               | Keyword x -> Some x
               | String x -> Some x
               | _ -> None)
             (Sqlite_build.coll_items c)
       | None -> [])
  ; export_properties_as_list_items = b "export-properties-as-list-items?"
  ; export_node_property_values_as_page_refs =
      b "export-node-property-values-as-page-refs?"
  ; export_default_property_values_as_blocks =
      b "export-default-property-values-as-blocks?"
  ; preserve_block_refs = b "preserve-block-refs?"
  ; date_formatter = s "date-formatter"
  ; encode_highlight_as_mark = b "encode-highlight-as-mark?" }

(* cljs opts map -> Export_file.tree_opts. cljs block-children-content only
   uses init-level/open-blocks-only?/include-properties? (the latter via
   transform-content's {:or {include-properties? true}}). *)
let tree_opts_of_value (v : value) : Export_file.tree_opts =
  let m = Sqlite_build.bm_of_value v in
  { Export_file.default_tree_opts with
    init_level =
      (match Sqlite_build.bm_get_opt m "init-level" with
       | Some (Int n) -> Some n
       | _ -> None)
  ; open_blocks_only =
      (match Sqlite_build.bm_get_opt m "open-blocks-only?" with
       | Some v -> Sqlite_build.truthy v
       | None -> false)
  ; include_properties =
      (match Sqlite_build.bm_get_opt m "include-properties?" with
       (* cljs {:or {include-properties? true}} — nil falls back to true *)
       | Some (Bool false) -> false
       | _ -> true)
  ; heading_to_list =
      (match Sqlite_build.bm_get_opt m "heading-to-list?" with
       | Some v -> Sqlite_build.truthy v
       | None -> false) }

(* cljs get-all-page->content — alias of common-file/get-all-page->content.
   cljs passes options through as the export context map. *)
let get_all_page_content (db : db) (options_v : value) :
    (string option * string) list =
  Export_file.get_all_page_content db ~ctx:(context_of_value options_v)

(* cljs string/trim-newline *)
let trim_newline (s : string) : string =
  let n = String.length s in
  let is_ws c = c = '\n' || c = '\r' in
  let i0 = ref 0 in
  while !i0 < n && is_ws s.[!i0] do
    incr i0
  done;
  let i1 = ref n in
  while !i1 > !i0 && is_ws s.[!i1 - 1] do
    decr i1
  done;
  String.sub s !i0 (!i1 - !i0)

let uuid_of_v = function
  | Uuid u -> Some u
  | String u -> Some u
  | _ -> None

(* cljs get-blocks-export-data *)
let get_blocks_export_data (db : db) (root_block_uuids_or_page_uuid : value)
    (opts_v : value) (content_config_v : value) : value =
  let ctx = context_of_value content_config_v in
  let opts = tree_opts_of_value opts_v in
  let root_block_uuids =
    match root_block_uuids_or_page_uuid with
    | Vector vs | List vs | Set vs -> vs
    | _ -> [ root_block_uuids_or_page_uuid ]
  in
  (* cljs (mapv #(d/entity db [:block/uuid %]) root-block-uuids) —
     unresolvable uuids stay in the vector as nil. *)
  let blocks : entity option list =
    List.map
      (fun v ->
        match uuid_of_v v with
        | Some u -> Datascript.entity db (Lookup_ref ("block/uuid", Uuid u))
        | None -> None)
      root_block_uuids
  in
  (* cljs (every? ldb/page? blocks) — nil entity => not a page; empty => true *)
  let all_pages =
    List.for_all (function Some e -> Ldb.is_page e | None -> false) blocks
  in
  let single_page = List.length blocks = 1 && all_pages in
  let content =
    if single_page then (
      (* single-page => export a page, including the page's title and properties *)
      match List.nth_opt root_block_uuids 0 with
      | Some v -> (
          match uuid_of_v v with
          | Some u -> Export_file.block_to_content db ~block_uuid:u ~opts ~ctx
          | None -> "")
      | None -> "")
    else if all_pages then
      (* all pages => just send page titles; cljs (str nil) => "" in the join *)
      String.concat "\n"
        (List.map
           (fun (e : entity option) ->
             match e with
             | Some e -> Option.value ~default:"" (Ldb.string_value e "block/title")
             | None -> "")
           blocks)
    else
      (* multiple root blocks => just the content of all the blocks *)
      List.map
        (fun v ->
          match uuid_of_v v with
          | Some u -> trim_newline (Export_file.block_to_content db ~block_uuid:u ~opts ~ctx)
          | None -> "")
        root_block_uuids
      |> String.concat "\n"
  in
  let first_block =
    match List.nth_opt blocks 0 with
    | Some e -> e
    | None -> None
  in
  let format =
    match first_block with
    | Some e -> Option.value ~default:(Keyword "markdown") (Ldb.value e "block/format")
    | None -> Keyword "markdown"
  in
  let title =
    match root_block_uuids_or_page_uuid, first_block with
    | Uuid _, Some e -> Option.value ~default:Nil (Ldb.value e "block/title")
    | _ -> String "untitled"
  in
  Map
    [ Keyword "content", String content
    ; Keyword "format", format
    ; Keyword "title", title ]


(* common-util/url? — protocol://-style (js/URL origin check) *)
let url_re = Regexp.compile "[a-zA-Z][a-zA-Z0-9+\\-.]*://"
let url_p (s : string) : bool = Regexp.test url_re s

(* cljs get-debug-datoms — returns the kept datoms with scrubbed values *)
let get_debug_datoms (conn : conn) : datom list =
  let db = Datascript.db conn in
  datoms db Eavt ()
  |> List.of_seq
  |> List.map (fun (d : datom) ->
       if
         d.a = "block/title"
         && (match d.v with String s -> url_p s | _ -> false)
       then { d with v = String "https://logseq.com/debug" }
       else if
         (d.a = "block/title" || d.a = "block/name")
         &&
         (* scrub unless entity is an ident, journal page, built-in page,
            or created-from :logseq.property/query — a missing entity
            still scrubs (cljs every check is true on nil) *)
         match Ldb.ent_of_id db d.e with
         | Some e ->
             Ldb.ident_of e = None
             && not (Ldb.is_journal e)
             && not (Ldb.built_in e)
             && (match
                    Ldb.ref_ent e "logseq.property/created-from-property"
                  with
                  | Some p -> Ldb.ident_of p <> Some "logseq.property/query"
                  | None -> true)
         | None -> true
       then (
         match d.v with
         | String s ->
             (* cljs (count v) — UTF-16 code units *)
             { d with
               v =
                 String
                   ("debug "
                    ^ string_of_int d.e
                    ^ " "
                    ^ String.make (Unicode.js_length s) 'x') }
         | _ -> d)
       else d)

(* cljs worker/export.cljs content->ast — ->db-edn output with pos
   stripped and Properties asts removed. *)
let content_to_ast ~(content : string) : Export_common_impl.block_ast list =
  if Unicode.trim content = "" then []
  else
    Gp_mldoc.to_db_edn ~content ~format:"markdown"
    |> Clj_value.coll_items
    |> List.map Export_common_impl.remove_block_ast_pos
    |> List.filter (fun a -> not (Export_common_impl.properties_block_ast a))

(* cljs block-ast — single block rendered at init-level 1 then parsed. *)
let block_ast_resolver db ~(ctx : Export_file.context) (block_uuid : string)
    : Export_common_impl.block_ast list =
  match List.nth_opt (Ldb.get_block_and_children db block_uuid) 0 with
  | None -> []
  | Some root ->
      let content =
        Export_file.tree_to_file_content db root
          ~opts:{ Export_file.default_tree_opts with init_level = Some 1 }
          ~ctx
      in
      content_to_ast ~content

(* cljs block-children-content — follows :block/link, renders the whole
   subtree (open-blocks-only drops collapsed descendants). *)
let block_children_ast_resolver db ~(ctx : Export_file.context)
    (block_uuid : string) : Export_common_impl.block_ast list =
  match List.nth_opt (Ldb.get_block_and_children db block_uuid) 0 with
  | None -> []
  | Some block ->
      let link = Ldb.ref_ent block "block/link" in
      let root = match link with Some l -> l | None -> block in
      (match Ldb.value root "block/uuid" with
       | Some (Uuid u) ->
           let content =
             Export_file.block_to_content db ~block_uuid:u
               ~opts:
                 { Export_file.default_tree_opts with
                   init_level = Some 1
                 ; link = link <> None }
               ~ctx
           in
           content_to_ast ~content
       | _ -> [])

(* cljs page-ast — page's children content. *)
let page_ast_resolver db ~(ctx : Export_file.context) (page_name : string)
    : Export_common_impl.block_ast list =
  match Ldb.get_page db (String page_name) with
  | None -> []
  | Some page ->
      (match Ldb.value page "block/uuid" with
       | Some (Uuid u) ->
           let content =
             Export_file.block_to_content db ~block_uuid:u
               ~opts:Export_file.default_tree_opts ~ctx
           in
           content_to_ast ~content
       | _ -> [])

(* cljs export-blocks-as-format — :markdown -> export-text/export-helper;
   anything else throws the same ex-info. *)
let export_blocks_as_format (db : db) (root_block_uuids_or_page_uuid : value)
    (format_type : value) (options_v : value) (content_config_v : value)
    : string =
  let remove_options =
    List.filter_map
      (function Keyword k -> Some k | String k -> Some k | _ -> None)
      (Clj_value.coll_items (Clj_value.map_get options_v "remove-options"))
  in
  let include_properties = not (List.mem "property" remove_options) in
  let open_blocks_only =
    Clj_value.truthy
      (Clj_value.get_in options_v [ "other-options"; "open-blocks-only" ])
  in
  let opts_v =
    Map
      [ Keyword "open-blocks-only?", Bool open_blocks_only
      ; Keyword "include-properties?", Bool include_properties ]
  in
  let export_data =
    get_blocks_export_data db root_block_uuids_or_page_uuid opts_v
      content_config_v
  in
  let content = Clj_value.map_get export_data "content" in
  let format_v = Clj_value.map_get export_data "format" in
  let ctx = context_of_value content_config_v in
  let resolvers : Export_common_impl.resolvers =
    { block_ast = block_ast_resolver db ~ctx
    ; block_children_ast = block_children_ast_resolver db ~ctx
    ; page_ast = page_ast_resolver db ~ctx }
  in
  (match format_type with
   | Keyword "markdown" ->
       Export_text_impl.export_helper ~resolvers
         ~content:(match content with String s -> s | _ -> "")
         ~format:
           (match format_v with
            | Keyword f -> f
            | String f -> f
            | _ -> "markdown")
         ~options:options_v
   | _ ->
       raise
         (Dispatcher.Exn_info
            ( "Unsupported worker export format"
            , [ ( Wire.Keyword "format-type"
                , Ds_wire.transit_of_value format_type )
              ; ( Wire.Keyword "message"
                , Wire.String
                    "Use :thread-api/export-get-blocks-data and format outside \
                     the DB worker." ) ] )))
