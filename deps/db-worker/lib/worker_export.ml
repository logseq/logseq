(* Faithful port of src/main/frontend/worker/export.cljs — the worker-layer
   helpers behind the export thread-api endpoints.

   - get_all_page_content: cljs `common-file/get-all-page->content` re-export.
   - get_blocks_export_data: cljs `get-blocks-export-data` (coll-or-single uuid
     args, all-pages / single-page / root-blocks branches).
   - get_debug_datoms: cljs `get-debug-datoms` — datoms with url values and
     sensitive title/name values scrubbed.
   - export-blocks-as-format is NOT ported: its :markdown path depends on the
     npm mldoc lib (gp-mldoc/->db-edn), which only exists for JS targets.
     Endpoint_export registers a fail-fast handler for it.

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
       | Some Nil | Some (Bool false) -> false
       | _ -> true)
  ; heading_to_list =
      (match Sqlite_build.bm_get_opt m "heading-to-list?" with
       | Some v -> Sqlite_build.truthy v
       | None -> false) }

(* cljs get-all-page->content — alias of common-file/get-all-page->content.
   cljs passes options through as the export context map. *)
let get_all_page_content (db : db) (options_v : value) : (string * string) list
    =
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
  let blocks =
    List.filter_map
      (fun v ->
        match uuid_of_v v with
        | Some u -> Datascript.entity db (Lookup_ref ("block/uuid", Uuid u))
        | None -> None)
      root_block_uuids
  in
  let all_pages = blocks <> [] && List.for_all Ldb.is_page blocks in
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
      (* all pages => just send page titles *)
      String.concat "\n"
        (List.filter_map
           (fun (e : entity) -> Ldb.string_value e "block/title")
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
  let first_block = List.nth_opt blocks 0 in
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
  |> List.filter_map (fun (d : datom) ->
       (* url-valued attrs get replaced *)
       match d.v with
       | String s when url_p s ->
           Some { d with v = String "https://logseq.com/debug" }
       | _ -> (
           match d.a with
           | "block/title" | "block/name" -> (
               (* keep if entity is an ident, journal page, built-in page,
                  or created-from :logseq.property/query *)
               match Ldb.ent_of_id db d.e with
               | Some e ->
                   let ident = Ldb.ident_of e <> None in
                   let query_created_from =
                     match Ldb.ref_ent e "logseq.property/created-from-property" with
                     | Some p -> Ldb.ident_of p = Some "logseq.property/query"
                     | None -> false
                   in
                   if
                     not ident
                     && not (Ldb.is_journal e)
                     && not (Ldb.built_in e)
                     && not query_created_from
                   then (
                     match d.v with
                     | String s ->
                         Some
                           { d with
                             v =
                               String
                                 ("debug "
                                  ^ string_of_int d.e
                                  ^ " "
                                  ^ String.make (String.length s) 'x') }
                     | _ -> Some d)
                   else Some d
               | None -> Some d)
           | _ -> Some d))
