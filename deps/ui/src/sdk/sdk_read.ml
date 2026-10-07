(* Read-side logseq.api methods — queries against db-worker. *)

open Promise_ext
open Sdk_util

(* cljs get_block uses compact-normalized-refs + normalize (no ref->id
   reduction) — callers access .id on property refs *)
let get_block a _b _c _d =
  let* w = get_entity_json a in
  resolved_wire w

(* cljs get_page uses result->js (refs under kept-json keys -> ids) *)
let get_page a _b _c _d =
  let* w = get_entity_json a in
  resolved_result w

let page_ref_of id =
  if Wire.is_uuid_string id then
    Wire.Array [ Wire.kw "block/uuid"; Wire.Uuid id ]
  else Wire.String id

let get_page_blocks_tree a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some id ->
      let* w =
        Runtime.invoke3 "thread-api/get-page-blocks-tree"
          (Wire.String (repo ()))
          (page_ref_of id)
          (Wire.Map [])
      in
      resolved_wire w

let json_of_model_page (p : Model.page) =
  let o = Js.Dict.empty () in
  Js.Dict.set o "title" (Js.Json.string p.page_title);
  Js.Dict.set o "name" (Js.Json.string p.page_title);
  (match p.page_uuid with
   | Some u -> Js.Dict.set o "uuid" (Js.Json.string u)
   | None -> ());
  Js.Json.object_ o

let get_current_page _a _b _c _d =
  match (Runtime.model ()).Model.route_page with
  | Some p -> (
      (* cljs get-current-page -> <get-block + result->js: the full
         page entity, not just the route summary *)
      match p.Model.page_uuid with
      | Some u ->
          let* w = get_by_id (Wire.Uuid u) in
          resolved_result w
      | None -> resolved (json_of_model_page p))
  | None -> resolved_nil

(* cljs resolve-tag-eid: number -> db/id; "/"-qualified string or
   ":ns/name" -> that ident; uuid -> uuid; otherwise the name prefixed
   with the plugin class namespace *)
let resolve_tag_eid j =
  match eid_wire_of_json j with
  | Some (Wire.String s) -> (
      let s' = trim_leading s in
      if String.contains s' '/' then Wire.Keyword s'
      else if Wire.is_uuid_string s' then Wire.Uuid s'
      else Wire.Keyword ("plugin.class._test_plugin/" ^ s'))
  | Some w -> w
  | None -> Wire.Nil

let get_tags_by_name_raw name =
  Runtime.invoke "thread-api/get-tags-by-name"
    [ Wire.String (repo ()); Wire.String name ]

let get_tag a _b _c _d =
  let raw_name = arg_string a in
  let* tag = get_by_id (resolve_tag_eid a) in
  let* tag =
    (match tag, raw_name with
     | Wire.Nil, Some name ->
         let* tags = get_tags_by_name_raw name in
         Js.Promise.resolve
           (match Wire.elems tags with
            | t :: _ -> t
            | [] -> Wire.Nil)
     | _ -> Js.Promise.resolve tag)
  in
  (* cljs get-tag only returns class entities *)
  if is_class_entity tag then resolved_result tag
  else resolved_nil

let get_tags_by_name a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some name ->
      let* w = get_tags_by_name_raw name in
      resolved_result w

let get_tag_objects a _b _c _d =
  (* cljs: uuid/qualified-ident via <get-block; anything else via
     <get-case-page. entity/class? check throws "Not a tag" — the
     "Tag not exists" branch is unreachable there (nil is already not
     a class) *)
  let* tag =
    match arg_string a with
    | Some s when not (Wire.is_uuid_string s) && not (String.contains s '/') ->
        let* w =
          Runtime.invoke2 "thread-api/get-case-page" (Wire.String (repo ()))
            (Wire.String s)
        in
        Js.Promise.resolve w
    | _ -> get_by_id (resolve_tag_eid a)
  in
  if not (is_class_entity tag) then Js.Promise.reject (Failure "Not a tag")
  else
    match Wire.map_get_int tag "db/id" with
    | Some cid ->
        call "thread-api/get-class-objects"
          [ Wire.String (repo ()); Wire.Int cid ]
    | None -> resolved_nil

let get_all_tags _a _b _c _d =
  call "thread-api/get-all-classes"
    [ Wire.String (repo ())
    ; Wire.Map [ (Wire.kw "except-root-class?", Wire.Bool true) ]
    ]

let get_all_properties _a _b _c _d =
  call "thread-api/get-all-properties" [ Wire.String (repo ()); Wire.Map [] ]

(* cljs get-property returns the entity + :type = :logseq.property/type *)
let get_property a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some name ->
      (let* w = get_entity_ident (property_ident name) in
      match w with
      | Wire.Map kvs ->
          let w' =
            match Wire.get w "logseq.property/type" with
            | Some t -> Wire.Map ((Wire.kw "type", t) :: kvs)
            | None -> w
          in
          resolved_result w'
      | _ -> resolved_nil)

(* db-property/property-value-content: (or :block/title
   :logseq.property/value) — ref-value content for readable maps *)
let property_value_content (v : Wire.t) =
  match Wire.get v "block/title" with
  | Some t -> t
  | None -> (
      match Wire.get v "logseq.property/value" with
      | Some x -> x
      | None -> v)

(* db-property-util/get-property-value: numbers stay raw; entity maps
   deref to their content *)
let get_property_value (v : Wire.t) =
  match v with
  | Wire.Int _ | Wire.Int64 _ | Wire.Float _ -> v
  | other -> property_value_content other

(* readable-properties: keys -> ":" prefixed ident strings; values —
   set -> set of contents; sequential -> map get-property-value;
   map -> property-value-content; scalar -> raw *)
let readable_properties (props : (Wire.t * Wire.t) list) : Wire.t =
  Wire.Map
    (List.map
       (fun (k, v) ->
         let ks =
           match k with
           | Wire.Keyword s -> ":" ^ s
           | Wire.String s -> s
           | other -> (
               match other with
               | _ -> Js.Json.stringify (Sdk_convert.json_of_wire other))
         in
         let v' =
           match v with
           | Wire.Set xs -> Wire.Set (List.map property_value_content xs)
           | Wire.Array xs -> Wire.Array (List.map get_property_value xs)
           | Wire.List xs -> Wire.List (List.map get_property_value xs)
           | Wire.Map _ -> get_property_value v
           | _ -> v
         in
         (Wire.String ks, v'))
       props)

(* get-all-block-properties: own block/properties merged over class
   default properties (own keys win) *)
let all_block_properties db_id props =
  match db_id with
  | None -> Js.Promise.resolve props
  | Some id ->
      let* defaults =
        Runtime.invoke2 "thread-api/get-block-class-default-properties"
          (Wire.String (repo ()))
          (Wire.Int id)
      in
      let merged =
        match defaults, props with
        | Wire.Map dvs, Wire.Map kvs ->
            let own_keys =
              List.filter_map
                (fun (k, _) ->
                  match k with
                  | Wire.Keyword s | Wire.String s -> Some s
                  | _ -> None)
                kvs
            in
            Wire.Map
              (List.filter
                 (fun (k, _) ->
                   match k with
                   | Wire.Keyword s | Wire.String s ->
                       not (List.mem s own_keys)
                   | _ -> true)
                 dvs
              @ kvs)
        | _ -> props
      in
      Js.Promise.resolve merged

let get_block_properties a _b _c _d =
  let* block = get_entity_json a in
  match Wire.get block "block/properties" with
  | Some (Wire.Map kvs) ->
      (let* merged =
        all_block_properties (Wire.map_get_int block "db/id")
          (Wire.Map kvs)
      in
      match merged with
      | Wire.Map kvs -> resolved_result (readable_properties kvs)
      | _ -> resolved_nil)
  | _ -> resolved_nil

let get_page_properties = get_block_properties

(* lookup: property name -> sanitized, ident, or raw key *)
let property_lookup (props : Wire.t) key =
  let ident = property_ident key in
  let sanitized = sanitize_property_name key in
  match
    ( Wire.get props key
    , Wire.get props sanitized
    , Wire.get props ident )
  with
  | Some v, _, _ | _, Some v, _ | _, _, Some v -> Some v
  | _ -> None

(* cljs get-block-property: map value -> assoc block/value + db/ident;
   set -> result->js; scalar -> JSON.parse when plugin-ns prop has
   json type *)
let get_block_property a b _c _d =
  match arg_string b with
  | Some key ->
      (let* block = get_entity_json a in
      let props =
        match Wire.get block "block/properties" with
        | Some p -> p
        | None -> Wire.Map []
      in
      let db_id = Wire.map_get_int block "db/id" in
      let* merged = all_block_properties db_id props in
      match property_lookup merged key with
      | Some (Wire.Map _ as v) ->
          let ident = property_ident key in
          let block_value =
            match
              ( Wire.get v "logseq.property/value"
              , Wire.get v "block/title" )
            with
            | Some x, _ | _, Some x -> x
            | _ -> Wire.Nil
          in
          let v' =
            match v with
            | Wire.Map kvs ->
                Wire.Map
                  (kvs
                  @ [ (Wire.kw "block/value", block_value)
                    ; (Wire.kw "db/ident", Wire.kw ident)
                    ])
            | other -> other
          in
          resolved_result v'
      | Some (Wire.String s as v) ->
          (* parse-property-json-value-if-need: string
             value under a plugin-ns prop with json type
             gets JSON.parse'd *)
          let ident = property_ident key in
          if
            String.length ident > 7
            && String.sub ident 0 7 = "plugin."
          then
            (let* prop = get_entity_ident ident in
            match
              Wire.get prop "logseq.property/type"
            with
            | Some (Wire.Keyword "json")
            | Some (Wire.String "json") -> (
                try
                  resolved
                    (Js.Json.parseExn s)
                with _ -> resolved_result v)
            | _ -> resolved_result v)
          else resolved_result v
      | Some v -> resolved_result v
      | None -> resolved_nil)
  | None -> resolved_nil

(* cljs datascript_query: resolve :current-page/:today style inputs via
   resolve-query-inputs, then thread-api/q with the resolved args *)
let datascript_query a b c d =
  match arg_string a with
  | None -> resolved_nil
  | Some query ->
      let inputs =
        List.filter_map
          (fun j -> if arg_is_nil j then None else Some (arg_wire j))
          [ b; c; d ]
        |> List.filter (fun w -> w <> Wire.Nil)
      in
      let opts =
        Wire.Map
          (List.filter_map Fun.id
             [ Option.map
                 (fun u -> (Wire.kw "current-page", Wire.String u))
                 (Option.bind (Runtime.model ()).Model.route_page
                    (fun (p : Model.page) -> p.page_uuid))
             ; Some
                 (Wire.kw "today-title", Wire.String (Dates.today ())) ])
      in
      let* resolved_inputs =
        Runtime.invoke3 "thread-api/resolve-query-inputs"
          (Wire.String (repo ()))
          (Wire.Array inputs)
          opts
      in
      let args =
        match resolved_inputs with
        | Wire.Array xs | Wire.List xs -> xs
        | _ -> inputs
      in
      let* w =
        Runtime.invoke2 "thread-api/q" (Wire.String (repo ()))
          (Wire.Array (Wire.String query :: args))
      in
      (* cljs passes camel-case?=nil: plugin-facing keys keep
                hyphens (journal-day) *)
      resolved (Sdk_convert.json_of_wire ~camel:false w)

(* cljs flatten — recursive seq flattening over query rows *)
let rec flatten_wire (w : Wire.t) : Wire.t list =
  match w with
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      List.concat_map flatten_wire xs
  | other -> [ other ]

(* cljs q -> query-dsl/query [repo query-string {:block-attrs ...}] *)
let dsl_query a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some s ->
      let opts =
        Wire.Map
          [ ( Wire.kw "block-attrs"
            , Wire.Array
                [ Wire.kw "db/id"; Wire.kw "block/uuid"
                ; Wire.kw "block/title"; Wire.kw "block/raw-title" ] )
          ]
      in
      let* w =
        Runtime.invoke3 "thread-api/query-dsl-query"
          (Wire.String (repo ()))
          (Wire.String s)
          opts
      in
      (* cljs: (flatten query-result) under normalize camel *)
      resolved (Sdk_convert.json_of_wire (Wire.List (flatten_wire w)))

(* cljs get_today_page: today's journal title -> get-block entity *)
let get_today_page _a _b _c _d =
  let* w = get_entity (Dates.today ()) in
  resolved_result w

(* cljs get_all_pages: pull all non-hidden pages, sort by block/title *)
let get_all_pages _a _b _c _d =
  let* w =
    Runtime.invoke2 "thread-api/q"
      (Wire.String (repo ()))
      (Wire.Array
         [ Wire.String
             "[:find [(pull ?page [:db/id :block/uuid :block/name \
              :block/title :block/created-at :block/updated-at]) ...] \
              :where [?page :block/name] \
              [(get-else $ ?page :logseq.property/hide? false) ?hide] \
              [(false? ?hide)]]"
         ])
  in
  let rows = Wire.elems w in
  let sorted =
    List.sort
      (fun a b ->
        String.compare
          (Option.value ~default:"" (Wire.map_get_string a "block/title"))
          (Option.value ~default:"" (Wire.map_get_string b "block/title")))
      rows
  in
  resolved_result (Wire.List sorted)

(* cljs get_current_block: the editing block, else the first selected
   block *)
let get_current_block _a _b _c _d =
  let uuid =
    match Editor_state.editing_uuid () with
    | Some u -> Some u
    | None -> List.nth_opt (Editor_actions.selected_uuids ()) 0
  in
  match uuid with
  | Some u -> (
      let* w = get_by_id (Wire.Uuid u) in
      match w with
      | Wire.Nil -> resolved_nil
      | _ -> resolved_wire w)
  | None -> resolved_nil

(* cljs get_current_page_blocks_tree — (seq blocks): empty -> nil *)
let get_current_page_blocks_tree _a _b _c _d =
  match Option.bind (Runtime.model ()).Model.route_page (fun p -> p.Model.page_uuid) with
  | Some uuid ->
      let* w =
        Runtime.invoke3 "thread-api/get-page-blocks-tree"
          (Wire.String (repo ()))
          (Wire.Array [ Wire.kw "block/uuid"; Wire.Uuid uuid ])
          (Wire.Map [])
      in
      (match w with
       | Wire.Array [] | Wire.List [] | Wire.Nil -> resolved_nil
       | _ -> resolved_wire w)
  | None -> resolved_nil

(* cljs <get-block-sibling, direction :left/:right *)
let sibling_of a dir =
  let* block = get_entity_json a in
  match Wire.map_get_int block "db/id" with
  | Some id ->
      let* w =
        Runtime.invoke3 "thread-api/get-block-sibling"
          (Wire.String (repo ()))
          (Wire.Int id)
          (Wire.Keyword dir)
      in
      resolved_wire w
  | None -> resolved_nil

let get_previous_sibling_block a _b _c _d = sibling_of a "left"

let get_next_sibling_block a _b _c _d = sibling_of a "right"

(* cljs get_page_linked_references: <get-block-refs grouped by
   :block/page when present *)
let get_page_linked_references a _b _c _d =
  let* block = get_entity_json a in
  match Wire.map_get_int block "db/id" with
  | Some id -> (
      let* w =
        Runtime.invoke2 "thread-api/get-block-refs"
          (Wire.String (repo ()))
          (Wire.Int id)
      in
      let blocks = Wire.elems w in
      let page_id_of blk =
        match Wire.get blk "block/page" with
        | Some (Wire.Map _ as p) -> Wire.map_get_int p "db/id"
        | Some (Wire.Int n) -> Some n
        | _ -> None
      in
      match blocks with
      | b :: _ when Wire.get b "block/page" <> None ->
          let groups =
            List.fold_left
              (fun acc blk ->
                match page_id_of blk with
                | Some pid -> (
                    match List.assoc_opt pid acc with
                    | Some xs ->
                        (pid, blk :: xs) :: List.remove_assoc pid acc
                    | None -> (pid, [ blk ]) :: acc)
                | None -> acc)
              [] blocks
          in
          resolved_wire
            (Wire.Map
               (List.map
                  (fun (pid, xs) -> (Wire.Int pid, Wire.List (List.rev xs)))
                  groups))
      | _ -> resolved_wire w)
  | None -> resolved_nil

(* cljs api.db-based.cli/list-*: options keywordized, clj->js result
   (kebab keys kept — camel=false) *)
let list_cli endpoint a =
  let* w =
    Runtime.invoke2 endpoint (Wire.String (repo ())) (keywordize_keys (arg_map a))
  in
  resolved (Sdk_convert.json_of_wire ~camel:false w)

let list_tags a _b _c _d = list_cli "thread-api/api-list-tags" a

let list_properties a _b _c _d = list_cli "thread-api/api-list-properties" a

let list_pages a _b _c _d = list_cli "thread-api/api-list-pages" a

let get_page_data a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some title ->
      let* w =
        Runtime.invoke2 "thread-api/api-get-page-data"
          (Wire.String (repo ()))
          (Wire.String title)
      in
      (match w with
       | Wire.Nil ->
           (* cljs: (str "Page " (pr-str page-title) " not found") *)
           resolved
             (Js.Json.object_
                (Js.Dict.fromList
                   [ ( "error"
                     , Js.Json.string ("Page \"" ^ title ^ "\" not found") )
                   ]))
       | _ -> resolved (Sdk_convert.json_of_wire ~camel:false w))

(* cljs app/get_current_graph_favorites -> page-handler/<get-favorites *)
let get_current_graph_favorites _a _b _c _d =
  let* w =
    Runtime.invoke1 "thread-api/get-favorite-pages" (Wire.String (repo ()))
  in
  resolved_result w

(* cljs app/get_current_graph_recent -> recent-handler/get-recent-pages
   over the ids in localStorage "recent-pages" *)
let get_current_graph_recent _a _b _c _d =
  let ids = Sidebar_state.recent_ids_of_storage (repo ()) in
  let* w =
    Runtime.invoke2 "thread-api/get-recent-pages"
      (Wire.String (repo ()))
      (Wire.Array (List.map (fun i -> Wire.Int i) ids))
  in
  resolved_wire w

(* cljs api export_edn: kw options, :export-type defaults :graph; result
   ships as {:export-body transit-str, :graph repo-without-prefix} *)
let export_edn a _b _c _d =
  let opts =
    match keywordize_keys (arg_map a) with
    | Wire.Map kvs ->
        let has_type =
          List.exists (fun (k, _) -> k = Wire.kw "export-type") kvs
        in
        let kvs' =
          if has_type then
            List.map
              (fun (k, v) ->
                match k, v with
                | Wire.Keyword "export-type", Wire.String s ->
                    (k, Wire.Keyword s)
                | _ -> (k, v))
              kvs
          else (Wire.kw "export-type", Wire.Keyword "graph") :: kvs
        in
        Wire.Map kvs'
    | w -> w
  in
  let* w =
    Runtime.invoke2 "thread-api/export-edn" (Wire.String (repo ())) opts
  in
  (match Wire.get w "export-edn-error" with
   | Some (Wire.String e) ->
       Js.Promise.reject (Failure ("Export EDN Error: " ^ e))
   | _ ->
       let prefix = "logseq_db_" in
       let r = repo () in
       let graph =
         if String.length r > String.length prefix
            && String.sub r 0 (String.length prefix) = prefix
         then
           String.sub r (String.length prefix)
             (String.length r - String.length prefix)
         else r
       in
       resolved
         (Js.Json.object_
            (Js.Dict.fromList
               [ ("export-body", Js.Json.string (Transit.to_string w))
               ; ("graph", Js.Json.string graph) ])))

(* cljs db/get_file_content: file entity's :file/content *)
let get_file_content a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some path ->
      let* w =
        Runtime.invoke2 "thread-api/get-file-content"
          (Wire.String (repo ()))
          (Wire.String path)
      in
      resolved (Sdk_convert.json_of_wire w)

(* cljs api search: block search result -> {blocks, has-more?};
   file-level search results don't exist for db graphs *)
let search a b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some "" -> resolved_nil
  | Some q ->
      let opts = arg_map b in
      let limit =
        match Wire.get opts "limit" with
        | Some (Wire.Int n) -> n
        | Some (Wire.Int64 n) -> Int64.to_int n
        | Some (Wire.Float f) -> int_of_float f
        | _ -> 10
      in
      let params =
        let base = [ (Wire.kw "limit", Wire.Int limit) ] in
        (* cljs assoc :page (str page-db-id) when options carries one *)
        match Wire.get opts "page-db-id", Wire.get opts "pageDbId" with
        | Some (Wire.Int n), _ | _, Some (Wire.Int n) ->
            (Wire.kw "page", Wire.String (string_of_int n)) :: base
        | Some (Wire.String s), _ | _, Some (Wire.String s) ->
            (Wire.kw "page", Wire.String s) :: base
        | _ -> base
      in
      let* w =
        Runtime.invoke3 "thread-api/search-blocks" (Wire.String (repo ()))
          (Wire.String q)
          (Wire.Map params)
      in
      let blocks =
        match w with
        | Wire.Array xs | Wire.List xs -> Wire.List xs
        | Wire.Map _ ->
            (* include-matched-count? shape: {items, matched-count} *)
            Option.value ~default:(Wire.List [])
              (Option.map Wire.elems (Wire.get w "items")
               |> Option.map (fun xs -> Wire.List xs))
        | _ -> Wire.List []
      in
      let has_page =
        match Wire.get opts "page-db-id", Wire.get opts "pageDbId" with
        | None, None -> false
        | _ -> true
      in
      resolved
        (Sdk_convert.json_of_wire
           (Wire.Map
              (List.filter_map Fun.id
                 [ Some (Wire.kw "blocks", blocks)
                 ; Some
                     ( Wire.kw "has-more?"
                     , Wire.Bool (List.length (Wire.elems blocks) = limit) )
                 ; (* cljs merges :files (file-graph hits — always empty
                      for db graphs) when no page-db-id is given *)
                   (if has_page then None
                    else Some (Wire.kw "files", Wire.List [])) ])))

(* cljs api-db/custom_query: read-string the source, then
   query-custom/custom-query {:query query} — an edn list or a query
   not starting with :find routes to the dsl endpoint, a [:find ...]
   vector to the datalog one; the result is flattened *)
let custom_query a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some s -> (
      let parsed =
        try Edn.parse s
        with _ ->
          raise (Failure "Invalid custom query")
      in
      let query_m = Wire.Map [ (Wire.kw "query", parsed) ] in
      let datalog =
        match parsed with
        | Wire.Array (Wire.Keyword "find" :: _) -> true
        | _ -> false
      in
      let* w =
        match parsed, datalog with
        | Wire.List _, _ | _, false ->
            (* dsl custom queries pull the default block attrs *)
            Runtime.invoke3 "thread-api/query-dsl-custom-query"
              (Wire.String (repo ()))
              query_m
              (Wire.Map
                 [ ( Wire.kw "block-attrs"
                   , Wire.Array
                       [ Wire.kw "db/id"; Wire.kw "block/uuid"
                       ; Wire.kw "block/title"; Wire.kw "block/raw-title"
                       ] )
                 ])
        | _, true ->
            let context =
              match (Runtime.model ()).Model.route_page with
              | Some p -> (
                  match p.Model.page_uuid with
                  | Some u ->
                      Wire.Map [ (Wire.kw "current-page", Wire.Uuid u) ]
                  | None -> Wire.Map [])
              | None -> Wire.Map []
            in
            Runtime.invoke3 "thread-api/query-custom"
              (Wire.String (repo ()))
              query_m context
      in
      (* cljs: (flatten query-result) under normalize camel *)
      resolved (Sdk_convert.json_of_wire (Wire.List (flatten_wire w))))

