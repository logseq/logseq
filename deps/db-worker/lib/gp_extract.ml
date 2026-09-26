(* logseq.graph-parser.extract — file-graph extraction of pages, blocks
   and mldoc ast in preparation for db transaction. *)

open Datascript

let mldoc_support (format : string) : bool =
  List.mem format [ "org"; "markdown"; "md" ]

(* extract/path->file-name *)
let path_to_file_name (path : string) : string =
  if Common_util.str_includes path "/" then
    match Common_util.split_last "/" path with
    | Some (_, last) -> last
    | None -> path
  else path

(* extract/path->file-body *)
let path_to_file_body (path : string) : string =
  let file_name = path_to_file_name path in
  if Common_util.str_includes file_name "." then
    match Common_util.split_last "." file_name with
    | Some (body, _) -> body
    | None -> file_name
  else file_name

let safe_url_decode (s : string) : string =
  if Common_util.str_includes s "%" then Common_util.safe_decode_uri_component s
  else s

(* extract/decode-namespace-underlines *)
let decode_namespace_underlines (s : string) : string =
  Common_util.str_replace_all s "___" "/"

(* extract/make-valid-namespaces *)
let make_valid_namespaces (title : string) : string =
  title
  |> String.split_on_char '/'
  |> List.filter (fun s -> s <> "")
  |> String.concat "/"

let tri_lb_title_parsing (file_name : string) : string =
  file_name
  |> decode_namespace_underlines
  |> Regexp.replace_all Common_util.url_encoded_pattern
       ~f:(fun ~match_ ~groups:_ ~offset:_ ~input:_ -> safe_url_decode match_)
  |> make_valid_namespaces

let legacy_title_parsing (file_name_body : string) : string =
  let title = Common_util.str_replace_all file_name_body "." "/" in
  match Common_util.decode_uri_component title with
  | Some t -> t
  | None -> title

(* extract/title-parsing *)
let title_parsing (file_name_body : string) (filename_format : string) : string =
  match filename_format with
  | "triple-lowbar" -> tri_lb_title_parsing file_name_body
  | _ -> legacy_title_parsing file_name_body

(* extract/get-page-name *)
let get_page_name ~(file_path : string) ~(ast : value list) ~(uri_encoded : bool)
    ~(filename_format : string) : string =
  let ast_nodes =
    List.filter_map
      (fun pair ->
        match pair with
        | Vector (a :: _) -> Some a
        | List (a :: _) -> Some a
        | _ -> None)
      ast
  in
  let file = if uri_encoded then Common_util.safe_decode_uri_component file_path else file_path in
  if Common_util.str_starts_with file "pages/contents." then "Contents"
  else
    let first_block =
      List.find_opt
        (fun node -> Gp_block.heading_block node)
        ast_nodes
    in
    let property_name =
      List.find_map
        (fun node ->
          match node with
          | Vector (String ("Properties" | "Property_Drawer") :: rest)
          | List (String ("Properties" | "Property_Drawer") :: rest) ->
            (match rest with
             | props :: _ ->
               (* cljs (zipmap lower-cased-keys values) — last-wins on
                  duplicate keys. *)
               List.fold_left
                 (fun acc prop ->
                   match prop with
                   | Vector (k :: v :: _) | List (k :: v :: _) ->
                     (match k with
                      | String ks | Keyword ks
                        when Unicode.lowercase ks = "title" ->
                        (match v with String s -> Some s | _ -> acc)
                      | _ -> acc)
                   | _ -> acc)
                 None (Clj_value.coll_items props)
             | [] -> None)
          | _ -> None)
        ast_nodes
    in
    let first_block_name =
      match first_block with
      | Some fb ->
        (match Clj_value.coll_items (Clj_value.map_get fb "title") with
         | xs ->
           (match List.rev xs with
            | last :: _ -> Clj_value.string_of_kwish last
            | [] -> None))
      | None -> None
    in
    let file_name =
      let result = path_to_file_body file in
      if result <> "" then
        if mldoc_support (Option.value ~default:"" (Common_util.get_file_ext file)) then
          Some (title_parsing result filename_format)
        else Some result
      else None
    in
    match property_name, file_name, first_block_name with
    | Some p, _, _ -> p
    | None, Some f, _ -> f
    | None, None, Some f -> f
    | None, None, None -> ""

(* cljs (str v) — coercion applied to a lone (non-coll) :alias/:tags
   value and to raw elements before blank?/sanity-lc checks. *)
let cljs_str (v : value) : string =
  match v with
  | String s -> s
  | Nil -> ""
  | _ -> Edn_util.pr_str v

(* extract/extract-page-alias-and-tags *)
let extract_page_alias_and_tags (page_m : Block_map.t) (page_name : string)
    (properties : (attr * value) list) : Block_map.t =
  let alias_v = List.assoc_opt "alias" properties in
  let alias_items =
    match alias_v with
    | Some v ->
      (match v with
       | Set xs | Vector xs | List xs -> xs
       | Nil -> [ String "" ] (* cljs [(str nil)] — [""] filtered as blank *)
       | s -> [ String (cljs_str s) ])
    | None -> []
  in
  (* cljs (remove #(or (= page-name (sanity-lc %)) (blank? %)) aliases)
     then maps each kept element to {:block/name lc :block/title raw}. *)
  let aliases =
    List.filter_map
      (fun v ->
        let s = cljs_str v in
        if s = "" || Unicode.trim s = "" then None
        else
          let n = Ldb.page_name_sanity_lc s in
          if n = page_name then None else Some (v, n))
      alias_items
  in
  let aliases' =
    List.map
      (fun (v, n) ->
        Map
          [ Keyword "block/name", String n
          ; Keyword "block/title", v ])
      aliases
  in
  let page_m =
    if aliases' <> [] then
      Block_map.put page_m "block/alias" (List aliases')
    else page_m
  in
  let page_m =
    match List.assoc_opt "tags" properties with
    | Some tags_v ->
      let tags =
        (match Block_map.attr_value page_m "block/tags" with
         | Some v -> Clj_value.coll_items v
         | None -> [])
        @ (let tags_items =
             match tags_v with
             | Set xs | Vector xs | List xs -> xs
             | Nil -> [ String "" ]
             | s -> [ String (cljs_str s) ]
           in
           List.filter_map
             (fun v ->
               let s = cljs_str v in
               if Unicode.trim s = "" then None else Some (v, s))
             tags_items
           |> List.map
                (fun (v, s) ->
                  Map
                    [ Keyword "block/name",
                      String (Ldb.page_name_sanity_lc s)
                    ; Keyword "block/title", v ]))
      in
      Block_map.put page_m "block/tags" (List tags)
    | None -> page_m
  in
  (* (update result :block/properties #(apply dissoc % linkable-props)) *)
  match Block_map.attr_value page_m "block/properties" with
  | Some m ->
    Block_map.put page_m "block/properties"
      (Clj_value.map_dissoc m Gp_property.editable_linkable_built_in_properties)
  | None -> page_m

(* cljs (into {} pairs) — assoc semantics: first-inserted key position,
   last-written value. *)
let dedup_assoc_last (pairs : (attr * value) list) : (attr * value) list =
  List.fold_left
    (fun acc (k, v) ->
      if List.mem_assoc k acc then
        List.map (fun (k', v') -> if k' = k then (k', v) else (k', v')) acc
      else acc @ [ (k, v) ])
    [] pairs

(* extract/build-page-map *)
let build_page_map ~(properties : (attr * value) list)
    ~(invalid_properties : string list) ~(properties_text_values : (attr * value) list)
    ~(file : string) ~(page : string) ~(page_name : string)
    ~(date_formatter : string option) ~(db : db) ~(from_page : string)
    ~(skip_journal : bool) : Block_map.t * string list =
  (* cljs properties / properties-text-values arrive as maps (into {}),
     i.e. duplicate keys keep their first position but last value. *)
  let properties = dedup_assoc_last properties in
  let properties_text_values = dedup_assoc_last properties_text_values in
  let valid, invalid =
    List.partition
      (fun (k, _v) -> Gp_property.valid_property_name (":" ^ k))
      properties
  in
  let invalid_names = List.map fst invalid in
  (* cljs (set (concat invalid-properties invalid-names)) — a set, so
     duplicates across both sources collapse. *)
  let invalid_properties =
    Common_util.distinct_by Fun.id (invalid_properties @ invalid_names)
  in
  let page_m =
    match
      Gp_block.page_name_to_map page db true date_formatter
        ~opts:
          { Gp_block.default_page_map_opts with
            from_page = Some from_page
          ; skip_journal }
        ()
    with
    | Some m -> m
    | None -> []
  in
  let page_m =
    Block_map.put page_m "block/file"
      (Map [ Keyword "file/path", String (Common_util.path_normalize file) ])
  in
  let page_m = Common_util.remove_nils_non_nested page_m in
  let page_m = extract_page_alias_and_tags page_m page_name properties in
  let page_m =
    if valid <> [] then
      let page_m =
        Block_map.put page_m "block/properties"
          (Map (List.map (fun (k, v) -> (Keyword k, v)) valid))
      in
      Block_map.put page_m "block/properties-text-values"
        (Map
           (List.filter_map
              (fun (k, v) ->
                if List.mem_assoc k valid then Some (Keyword k, v) else None)
              properties_text_values))
    else page_m
  in
  let page_m =
    if invalid_properties <> [] then
      Block_map.put page_m "block/invalid-properties"
        (* cljs (set (concat invalid-properties (map name bad-props)))
           — a set of name strings, not keywords. *)
        (Set (List.map (fun s -> String s) invalid_properties))
    else page_m
  in
  (page_m, invalid_properties)

(* extract/attach-block-ids-if-match *)
let attach_block_ids_if_match (block_ids : string option list option)
    (blocks : Block_map.t list) : Block_map.t list =
  match block_ids with
  | None -> blocks
  | Some ids ->
    if List.length ids = List.length blocks then
      List.map2
        (fun block_id block ->
          match block_id with
          | Some id -> Block_map.put block "block/uuid" (Uuid id)
          | None -> block)
        ids blocks
    else begin
      Worker_log.error "gp-extract/attach-block-ids-not-match"
        [ "msg",
          "attach-block-ids-if-match: block-ids provided, but doesn't match the number of blocks, ignoring" ];
      blocks
    end

let bm_map_value (bm : Block_map.t) : value =
  Map (List.map (fun (a, v) -> (Keyword a, v)) bm)

(* extract/build-pages-aux *)
let build_pages_aux db (page_map : Block_map.t) (ref_pages : value list)
    (date_formatter : string option) (format : string) : Block_map.t list =
  let namespace_pages =
    let page_title =
      match Block_map.attr_value page_map "block/title" with
      | Some (String t) -> t
      | _ -> ""
    in
    if
      Block_map.attr_value page_map "block/journal-day" = None
      && Gp_text.namespace_page page_title
    then
      Common_util.split_namespace_pages page_title
      |> List.filter_map
           (fun p ->
             match Gp_block.page_name_to_map p db true date_formatter () with
             | Some m -> Some (Block_map.put m "block/format" (String format))
             | None -> None)
    else []
  in
  let pages =
    [ bm_map_value page_map ]
    @ ref_pages
    @ List.map bm_map_value namespace_pages
    |> List.filter (fun p -> match p with Vector _ -> false | _ -> true)
    |> List.filter (fun p -> p <> Nil)
    |> List.filter (fun p -> Clj_value.truthy (Clj_value.map_get p "block/name"))
    |> Common_util.distinct_by (fun p -> Clj_value.map_get p "block/name")
    |> List.filter (fun p -> p <> Nil)
  in
  List.map
    (fun page ->
      let bm = Clj_value.map_entries_named page in
      let page_id =
        match Block_map.attr_value bm "block/journal-day" with
        | Some (Int64 day) -> Common_uuid.gen_journal_page_uuid (Datascript.Util.int64_to_int_exn "journal-day" day)
        | _ ->
          (match
             (match Block_map.attr_value bm "block/name" with
              | Some (String n) ->
                (match Ldb.get_page db (String n) with
                 | Some e -> Ldb.value e "block/uuid"
                 | None -> None)
              | _ -> None)
           with
           | Some (Uuid u) -> u
           | _ -> Common_uuid.new_block_id ())
      in
      Block_map.put bm "block/uuid" (Uuid page_id))
    pages

(* extract/extract-pages-and-blocks *)
let extract_pages_and_blocks (format : string) (ast : value list)
    (properties : (attr * value) list) (file : string) (content : string)
    (opts : Gp_block.extract_options) : (Block_map.t list * Block_map.t list) option =
  try
    let page =
      get_page_name ~file_path:file ~ast ~uri_encoded:false
        ~filename_format:(Option.value ~default:"legacy" opts.filename_format)
    in
    let page', page_name, _journal_day =
      if opts.skip_journal then (page, Ldb.page_name_sanity_lc page, None)
      else
        (* cljs extract.cljc calls convert-page-if-journal without
           :export-to-db-graph?, so it tries the safe journal-title
           formatters (not only the configured one). *)
        Gp_block.convert_page_if_journal ~export_to_db_graph:false page
          opts.date_formatter
    in
    let opts' = { opts with page_name = Some page_name } in
    let override_uuids =
      match opts.resolve_uuid_fn format ast content opts' with
      | r -> r
    in
    let extracted_block_ids : (string, unit) Hashtbl.t = Hashtbl.create 127 in
    let blocks = Gp_block.extract_blocks ast content format opts' in
    let blocks = attach_block_ids_if_match override_uuids blocks in
    let blocks =
      List.map
        (fun b ->
          Gp_block.fix_block_id_if_duplicated opts'.db page_name
            extracted_block_ids b)
        blocks
    in
    let blocks =
      Gp_block.with_parent_and_order
        (Map [ Keyword "block/name", String page_name ]) blocks
    in
    let ref_pages = ref [] in
    let blocks =
      List.map
        (fun block ->
          match Block_map.attr_value block "block/type" with
          | Some (String "macro") -> block
          | _ ->
            let block_ref_pages =
              match Block_map.attr_value block "block/refs" with
              | Some v -> Clj_value.coll_items v
              | None -> []
            in
            if block_ref_pages <> [] then
              ref_pages := List.rev_append block_ref_pages !ref_pages;
            block
            |> List.filter (fun (k, _) -> k <> "ref-pages")
            |> fun b ->
            let b = Block_map.put b "block/page"
                (Vector [ Keyword "block/name"; String page_name ]) in
            let b =
              if block_ref_pages <> [] then
                Block_map.put b "block/refs" (List block_ref_pages)
              else Block_map.remove_attr b "block/refs"
            in
            Block_map.put b "block/format" (String format))
        blocks
    in
    let properties', invalid_properties, properties_text_values =
      match List.nth_opt blocks 0 with
      | Some b when Option.is_some (Block_map.attr_value b "block/pre-block?") ->
        let get_bm_map a =
          match Block_map.attr_value b a with
          | Some m -> Clj_value.map_entries_named m
          | None -> []
        in
        (get_bm_map "block/properties",
         (match Block_map.attr_value b "block/invalid-properties" with
          | Some v -> List.filter_map Clj_value.string_of_kwish (Clj_value.coll_items v)
          | None -> []),
         get_bm_map "block/properties-text-values")
      | _ -> (properties, [], [])
    in
    let page_map, _ =
      build_page_map ~properties:properties' ~invalid_properties
        ~properties_text_values ~file ~page:page' ~page_name
        ~date_formatter:opts'.date_formatter ~db:opts'.db ~from_page:page'
        ~skip_journal:opts'.skip_journal
    in
    let pages =
      build_pages_aux opts'.db page_map (List.rev !ref_pages)
        opts'.date_formatter format
    in
    let blocks =
      List.filter_map
        (fun b ->
          let b =
            List.filter
              (fun (k, _) ->
                k <> "block.temp/ast-title" && k <> "block.temp/ast-body"
                && k <> "block/level" && k <> "block/children" && k <> "block/meta")
              b
          in
          Some b)
        blocks
    in
    Some (pages, blocks)
  with e ->
    Worker_log.error "exception" [ "e", Printexc.to_string e ];
    None

(* extract/extract *)
let extract ~(file_path : string) ~(content : string)
    ~(user_config : (attr * value) list) ?(verbose = false)
    ?(parse_outline_only = false) (opts : Gp_block.extract_options) :
    Block_map.t list * Block_map.t list * value list =
  if Unicode.trim content = "" then ([], [], [])
  else
    let format = Common_util.get_format file_path in
    if verbose then
      Worker_log.info "Parsing start" [ "file", file_path ];
    let ast_v =
      Gp_mldoc.to_edn ~content:(String content)
        ~config:(Gp_mldoc.default_config format ~parse_outline_only:parse_outline_only)
    in
    if verbose then
      Worker_log.info "Parsing finished" [ "file", file_path ];
    let ast = Clj_value.coll_items ast_v in
    let first_block = List.nth_opt ast 0 in
    let properties =
      match first_block with
      | Some (Vector (first :: _)) | Some (List (first :: _)) ->
        (match first with
         | Vector (String ("Properties" | "Property_Drawer") :: _)
         | List (String ("Properties" | "Property_Drawer") :: _) ->
           (* cljs takes (last first-block) — the properties triples list *)
           let props_node =
             match first with
             | Vector items -> List.nth_opt (List.rev items) 0 |> Option.value ~default:(Vector [])
             | List items -> List.nth_opt (List.rev items) 0 |> Option.value ~default:(Vector [])
             | _ -> Vector []
           in
           List.filter_map
             (fun triple ->
               match triple with
               | Vector [ x; y; mldoc_ast ] | List [ x; y; mldoc_ast ] ->
                 let k =
                   match x with
                   | Keyword s | Symbol s -> s
                   | String s -> s
                   | _ -> Edn_util.pr_str x
                 in
                 let kl = Unicode.lowercase k in
                 Some
                   ( kl
                   , Gp_text.parse_property k
                       (match y with String s -> s | _ -> Edn_util.pr_str y)
                       (Clj_value.coll_items mldoc_ast)
                       (("format", String format) :: user_config) )
               | _ -> None)
             (Clj_value.coll_items props_node)
           |> fun props ->
           List.filter_map
             (fun (k, v) ->
               if k = "filters" then
                 (match v with
                  | String s ->
                    Some (k, String (Common_util.str_replace_all s "\\" ""))
                  | _ -> Some (k, v))
               else Some (k, v))
             props
         | _ -> [])
      | _ -> []
    in
    let pages, blocks =
      match
        extract_pages_and_blocks format ast properties file_path content opts
      with
      | Some r -> r
      | None -> ([], [])
    in
    (pages, blocks, ast)

(* extract/with-block-uuid *)
let with_block_uuid (pages : Block_map.t list) : Block_map.t list =
  pages
  |> Common_util.distinct_by (fun p -> Block_map.attr_value p "block/name")
  |> List.map
       (fun page ->
         match Block_map.attr_value page "block/journal-day" with
         | Some (Int64 day) ->
           Block_map.put page "block/uuid"
           (Uuid
              (Common_uuid.gen_journal_page_uuid
                 (Datascript.Util.int64_to_int_exn "journal-day" day)))
         | _ ->
           (match Block_map.attr_value page "block/uuid" with
            | Some _ -> page
            | None -> Block_map.put page "block/uuid" (Uuid (Common_uuid.new_block_id ()))))

(* extract/with-ref-pages *)
let with_ref_pages (pages : Block_map.t list) (blocks : Block_map.t list)
    : Block_map.t list =
  let ref_pages =
    blocks
    |> List.concat_map
         (fun b ->
           match Block_map.attr_value b "block/refs" with
           | Some v -> Clj_value.coll_items v
           | None -> [])
    |> List.filter (fun p -> Clj_value.truthy (Clj_value.map_get p "block/name"))
  in
  let merged =
    Hashtbl.create 127
  in
  let order = ref [] in
  List.iter
    (fun p ->
      let bm = Gp_block.bm_of_map (bm_map_value p) in
      match Block_map.attr_value bm "block/name" with
      | Some (String n) ->
        (match Hashtbl.find_opt merged n with
         | Some existing ->
           (* cljs (apply merge group): later maps win *)
           Hashtbl.replace merged n
             (List.filter (fun (k, _) -> not (List.mem_assoc k bm)) existing
              @ bm)
         | None ->
           Hashtbl.replace merged n bm;
           order := n :: !order)
      | _ -> ())
    (pages @ List.map (fun p -> Clj_value.map_entries_named p) ref_pages);
  List.rev_map
    (fun n -> Option.get (Hashtbl.find_opt merged n))
    !order
  |> with_block_uuid
