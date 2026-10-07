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
  | Some p -> resolved (json_of_model_page p)
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
  let eid = resolve_tag_eid a in
  let* tag = get_by_id eid in
  let* tag =
    (match tag, arg_string a with
     | Wire.Nil, Some name ->
         Runtime.invoke "thread-api/get-case-page"
           [ Wire.String (repo ()); Wire.String name ]
     | _ -> Js.Promise.resolve tag)
  in
  (* cljs rejects non-class inputs — plugin callers key off the throw *)
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

(* cljs q -> query-dsl/query [repo query-string {:current-page-title :today-day}] *)
let dsl_query a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some s ->
      let opts =
        Wire.Map
          (List.filter_map Fun.id
             [ Option.map
                 (fun (p : Model.page) ->
                   (Wire.kw "current-page-title", Wire.String p.page_title))
                 (Runtime.model ()).Model.route_page
             ; Some
                 ( Wire.kw "today-day"
                 , Wire.Int (Dates.today_journal_day ()) ) ])
      in
      let* w =
        Runtime.invoke3 "thread-api/query-dsl-query"
          (Wire.String (repo ()))
          (Wire.String s)
          opts
      in
      resolved_wire w

