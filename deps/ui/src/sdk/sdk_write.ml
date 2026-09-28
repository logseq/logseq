(* Write-side logseq.api methods — implemented on apply-outliner-ops. *)

open Sdk_util

let opt_bool name (opts : Wire.t) =
  match Wire.get opts name with
  | Some (Wire.Bool b) -> b
  | _ -> false

let opt_string name (opts : Wire.t) = Wire.map_get_string opts name

let map_entries = function
  | Wire.Map kvs -> kvs
  | _ -> []

let list_items = function
  | Wire.Array xs | Wire.List xs | Wire.Set xs -> xs
  | _ -> []

(* cljs insert_block target resolution:
   before -> left sibling (sibling insert), else parent
   sibling -> block itself
   start -> first child as sibling, else as first child of block
   default/end -> last child as sibling, else as child of block *)
let sibling_of repo uuid dir =
  Runtime.invoke3 "thread-api/get-block-sibling"
    (Wire.String repo)
    (Wire.Uuid uuid)
    (Wire.Keyword dir)
  |> Js.Promise.then_ (fun w -> Js.Promise.resolve (block_uuid_of w))

let parent_of repo uuid =
  Runtime.invoke2 "thread-api/get-block-parent"
    (Wire.String repo)
    (Wire.Uuid uuid)
  |> Js.Promise.then_ (fun w -> Js.Promise.resolve (block_uuid_of w))

let children_of repo uuid =
  Runtime.invoke2 "thread-api/get-block-immediate-children"
    (Wire.String repo)
    (Wire.Uuid uuid)
  |> Js.Promise.then_ (fun w -> Js.Promise.resolve (list_items w))

let resolve_target repo block_uuid opts =
  let sibling = opt_bool "sibling" opts in
  let before = opt_bool "before" opts in
  let start = opt_bool "start" opts in
  if before then
    sibling_of repo block_uuid "left"
    |> Js.Promise.then_ (fun left ->
           match left with
           | Some u -> Js.Promise.resolve (u, true)
           | None ->
               parent_of repo block_uuid
               |> Js.Promise.then_ (fun p ->
                      Js.Promise.resolve
                        (Option.value p ~default:block_uuid, p = None)))
  else if sibling then Js.Promise.resolve (block_uuid, true)
  else if start then
    children_of repo block_uuid
    |> Js.Promise.then_ (fun cs ->
           match List.filter_map block_uuid_of cs with
           | first :: _ -> Js.Promise.resolve (first, true)
           | [] -> Js.Promise.resolve (block_uuid, false))
  else
    children_of repo block_uuid
    |> Js.Promise.then_ (fun cs ->
           match List.rev (List.filter_map block_uuid_of cs) with
           | last :: _ -> Js.Promise.resolve (last, true)
           | [] -> Js.Promise.resolve (block_uuid, false))

(* properties arg {name: value} -> list of (ident, wire value) *)
let properties_of (props : Wire.t) =
  map_entries props
  |> List.filter_map (fun (k, v) ->
         match k with
         | Wire.String s -> Some (property_ident s, v)
         | Wire.Keyword s -> Some (property_ident s, v)
         | _ -> None)

let set_properties_op block_uuid props =
  props
  |> List.map (fun (ident, v) ->
         Wire.Array
           [ Wire.Keyword "set-block-property"
           ; Wire.Array
               [ Wire.Uuid block_uuid; Wire.Keyword ident; v ]
           ])

let ensure_property_ops props =
  List.map
    (fun (ident, _) ->
      Wire.Array
        [ Wire.Keyword "upsert-property"
        ; Wire.Array
            [ Wire.Keyword ident
            ; Wire.Map
                [ (Wire.kw "logseq.property/type", Wire.kw "default")
                ; (Wire.kw "db/cardinality", Wire.kw "db.cardinality/one")
                ]
            ; Wire.Map
                [ (Wire.kw "property-name"
                  , Wire.String
                      (match String.rindex_opt ident '/' with
                       | Some i ->
                           String.sub ident (i + 1)
                             (String.length ident - i - 1)
                       | None -> ident))
                ]
            ]
        ])
    props

let new_block_map content custom_uuid =
  Wire.Map
    (( Wire.String "block/uuid"
     , Wire.Uuid
         (match custom_uuid with
          | Some u -> u
          | None -> Platform.random_uuid ()))
    :: List.map
         (fun (k, v) -> (Wire.String k, v))
         (Block_parse.title_fields content))

let insert_block a b c _d =
  match arg_string a, arg_string b with
  | Some id, Some content -> (
      let opts = arg_map c in
      let custom_uuid =
        match opt_string "customUUID" opts with
        | Some u -> Some u
        | None -> (
            match Wire.get (arg_map c) "properties" with
            | Some p -> (
                match Wire.get p "id" with
                | Some (Wire.String u) when is_uuid_string u -> Some u
                | _ -> None)
            | None -> None)
      in
      let props =
        match Wire.get opts "properties" with
        | Some p -> properties_of p
        | None -> []
      in
      get_entity id
      |> Js.Promise.then_ (fun block ->
             match block_uuid_of block with
             | None -> resolved_nil
             | Some uuid ->
                 resolve_target (repo ()) uuid opts
                 |> Js.Promise.then_ (fun (target, sibling) ->
                        let new_block =
                          new_block_map content custom_uuid
                        in
                        let insert_opts =
                          Wire.Map
                            [ (Wire.kw "sibling?", Wire.Bool sibling)
                            ; (Wire.kw "keep-uuid?", Wire.Bool true)
                            ; ( Wire.kw "ordered-list?"
                              , Wire.Bool (opt_bool "autoOrderedList" opts))
                            ; ( Wire.kw "outliner-op"
                              , Wire.Keyword "insert-blocks" )
                            ]
                        in
                        apply_ops
                          ([ Wire.Array
                               [ Wire.Keyword "insert-blocks"
                               ; Wire.Array
                                   [ Wire.Array [ new_block ]
                                   ; Wire.Uuid target
                                   ; insert_opts
                                   ]
                               ]
                           ]
                          @ ensure_property_ops props
                          @
                          match block_uuid_of new_block with
                          | Some u -> set_properties_op u props
                          | None -> [])
                          (Wire.Map [])
                        |> Js.Promise.then_ (fun _ ->
                               get_entity
                                 (match custom_uuid with
                                  | Some u -> u
                                  | None -> (
                                      match block_uuid_of new_block with
                                      | Some u -> u
                                      | None -> ""))
                               |> Js.Promise.then_ (fun w ->
                                      resolved_wire w)))))
  | _ -> resolved_nil

(* batch blocks [{content, uuid?, properties?, children?}] -> flat
   (uuid, block-map, props) list in pre-order — cljs tree-vec-flatten plus
   the :uuid prewalk in insert-batch-blocks; each node becomes
   {block/title, block/uuid, block/level} and its properties are applied
   afterwards via set-block-property ops (as cljs does) *)
let rec flatten_batch level parent_uuid acc (w : Wire.t) =
  match w with
  | Wire.Map _ ->
      let content =
        match Wire.get w "content" with
        | Some (Wire.String s) -> s
        | _ -> ""
      in
      let uuid =
        match Wire.get w "uuid" with
        | Some (Wire.Uuid u) | Some (Wire.String u) -> u
        | _ -> Platform.random_uuid ()
      in
      let props =
        match Wire.get w "properties" with
        | Some p -> properties_of p
        | None -> []
      in
      (* cljs with-parent-and-order: children carry :block/parent as a
         [:block/uuid u] lookup-ref — the worker re-derives level from it *)
      let parent_kv =
        match parent_uuid with
        | Some p ->
            [ ( Wire.String "block/parent"
              , Wire.Array [ Wire.kw "block/uuid"; Wire.Uuid p ] ) ]
        | None -> []
      in
      let flat =
        Wire.Map
          ((Wire.String "block/uuid", Wire.Uuid uuid)
           :: List.map
                (fun (k, v) -> (Wire.String k, v))
                (Block_parse.title_fields content)
          @ [ (Wire.String "block/level", Wire.Int level) ]
          @ parent_kv)
      in
      let acc = (uuid, flat, props) :: acc in
      (match Wire.get w "children" with
       | Some c ->
           List.fold_left
             (flatten_batch (level + 1) (Some uuid))
             acc (list_items c)
       | None -> acc)
  | _ -> acc

let insert_batch_block a b c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some id ->
      let flats =
        List.rev
          (List.fold_left (flatten_batch 1 None) [] (list_items (arg_wire b)))
      in
      let opts = arg_map c in
      get_entity id
      |> Js.Promise.then_ (fun target ->
             match block_uuid_of target with
             | None -> resolved_nil
             | Some uuid ->
                 (* cljs insert-batch-blocks: a page target forces sibling?
                    false — children of the page *)
                 let is_page = Wire.get target "block/name" <> None in
                 let insert_opts =
                   Wire.Map
                     [ ( Wire.kw "sibling?"
                       , Wire.Bool (opt_bool "sibling" opts && not is_page) )
                     ; (Wire.kw "keep-uuid?", Wire.Bool true)
                     ; (Wire.kw "outliner-op", Wire.Keyword "paste")
                     ; (Wire.kw "replace-empty-target?", Wire.Bool false)
                     ]
                 in
                 let prop_ops =
                   List.concat_map
                     (fun (_, _, props) -> ensure_property_ops props)
                     flats
                   @ List.concat_map
                       (fun (u, _, props) -> set_properties_op u props)
                       flats
                 in
                 apply_ops
                   (Wire.Array
                      [ Wire.Keyword "insert-blocks"
                      ; Wire.Array
                          [ Wire.Array (List.map (fun (_, m, _) -> m) flats)
                          ; Wire.Uuid uuid
                          ; insert_opts
                          ]
                      ]
                   :: prop_ops)
                   (Wire.Map [])
                 |> Js.Promise.then_ (fun _ ->
                        Runtime.invoke2 "thread-api/get-blocks"
                          (Wire.String (repo ()))
                          (Wire.Array
                             (List.map
                                (fun (u, _, _) ->
                                  Wire.Map
                                    [ (Wire.String "id", Wire.String u)
                                    ; (Wire.String "opts", Wire.Map [])
                                    ])
                                flats))
                        |> Js.Promise.then_ (fun w ->
                               let blocks =
                                 List.filter_map
                                   (fun pair ->
                                     match Wire.get pair "block" with
                                     | Some b -> Some b
                                     | None -> (
                                         match wire_elems pair with
                                         | [ _; b ] -> Some b
                                         | _ -> None))
                                   (wire_elems w)
                               in
                               resolved
                                 (Sdk_convert.json_arr
                                    (Array.of_list
                                       (List.map Sdk_convert.json_of_wire
                                          blocks))))))

let append_block_in_page a b c _d =
  (* overloads: (content) | (page, content) | (page, content, opts) *)
  let page_arg, content, opts =
    match arg_string b with
    | Some content -> (arg_string a, content, arg_map c)
    | None ->
        (None, Option.value ~default:"" (arg_string a), arg_map b)
  in
  let target_id =
    match page_arg with
    | Some p -> p
    | None -> (
        match !Runtime.current_page with
        | Some p -> Option.value ~default:"" p.Model.page_uuid
        | None -> "")
  in
  let opts' =
    match opts with
    | Wire.Map kvs -> Wire.Map ((Wire.String "sibling", Wire.Bool false) :: kvs)
    | _ -> opts
  in
  insert_block (Js.Json.string target_id) (Js.Json.string content)
    (Sdk_convert.json_of_wire opts')
    Js.Json.null

let update_block a b _c _d =
  match arg_string a, arg_string b with
  | Some id, Some content ->
      get_entity id
      |> Js.Promise.then_ (fun block ->
             match block_uuid_of block with
             | None -> resolved_nil
             | Some uuid ->
                 apply_op "save-block"
                   [ Wire.Map
                       ((Wire.String "block/uuid", Wire.Uuid uuid)
                        :: List.map
                             (fun (k, v) -> (Wire.String k, v))
                             (Block_parse.title_fields content))
                   ; Wire.Map []
                   ]
                 |> Js.Promise.then_ (fun _ -> resolved_nil))
  | _ -> resolved_nil

let remove_block a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some id ->
      get_entity id
      |> Js.Promise.then_ (fun block ->
             match block_uuid_of block with
             | None -> resolved_nil
             | Some uuid ->
                 apply_op "delete-blocks"
                   [ Wire.Array [ Wire.Uuid uuid ]; Wire.Map [] ]
                 |> Js.Promise.then_ (fun _ -> resolved_nil))

let create_page_with_flags name journal uuid custom_uuid props =
  let opts =
    [ (Wire.kw "journal?", Wire.Bool journal)
    ; ( Wire.kw "uuid"
      , match custom_uuid with Some u -> Wire.Uuid u | None -> Wire.Nil )
    ]
    @ (match props with
       | [] -> []
       | ps ->
           [ ( Wire.kw "properties"
             , Wire.Map
                 (List.map
                    (fun (ident, v) -> (Wire.Keyword ident, v))
                    ps) )
           ])
  in
  apply_op "create-page" [ Wire.String name; Wire.Map opts ]
  |> Js.Promise.then_ (fun r ->
         Js.Promise.resolve
           (match wire_elems r with
            | [ _; Wire.Uuid u ] -> u
            | [ _; Wire.String u ] -> u
            | _ -> uuid))
  |> Js.Promise.then_ (fun u -> get_entity u)
  |> Js.Promise.then_ (fun w -> resolved_wire w)

let create_page a _b c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some name ->
      let opts = arg_map c in
      let uuid =
        match opt_string "customUUID" opts with
        | Some u -> u
        | None -> Platform.random_uuid ()
      in
      create_page_with_flags name (opt_bool "journal" opts) uuid
        (opt_string "customUUID" opts)
        (match Wire.get opts "properties" with
         | Some p -> properties_of p
         | None -> [])

external date_of_epoch : float -> Js.Date.t = "Date" [@@mel.new]

external date_get_time : Js.Date.t -> float = "getTime" [@@mel.send]

let create_journal_page a _b _c _d =
  (* cljs (js/Date. date): accepts ms numbers AND ISO date strings;
     invalid dates get isNaN-checked on getTime. *)
  let date_opt =
    match Js.Json.classify a with
    | Js.Json.JSONNumber ms -> Some (date_of_epoch ms)
    | Js.Json.JSONString s -> (
        match float_of_string_opt s with
        | Some ms -> Some (date_of_epoch ms)
        | None -> Some (Js.Date.fromString s))
    | _ -> None
  in
  let day_int =
    match date_opt with
    | Some d when not (Float.is_nan (date_get_time d)) ->
        Some (Dates.journal_day_of d)
    | _ -> None
  in
  match day_int with
  | None -> resolved_nil
  | Some day ->
      let y, m, d = day / 10000, day mod 10000 / 100, day mod 100 in
      create_page_with_flags
        (Printf.sprintf "%04d-%02d-%02d" y m d)
        true
        (Platform.random_uuid ())
        None []

let create_tag a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some title ->
      let uuid = Platform.random_uuid () in
      apply_op "create-page"
        [ Wire.String title
        ; Wire.Map
            [ (Wire.kw "class?", Wire.Bool true)
            ; (Wire.kw "uuid", Wire.Uuid uuid)
            ]
        ]
      |> Js.Promise.then_ (fun _ ->
             get_entity uuid
             |> Js.Promise.then_ (fun w -> resolved_wire w))

let delete_page a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some name ->
      get_entity name
      |> Js.Promise.then_ (fun page ->
             match block_uuid_of page with
             | None -> resolved_nil
             | Some uuid ->
                 apply_op "delete-page" [ Wire.Uuid uuid; Wire.Map [] ]
                 |> Js.Promise.then_ (fun _ -> resolved_nil))

let ensure_property ident name =
  get_entity_ident ident
  |> Js.Promise.then_ (fun p ->
         match p with
         | Wire.Map _ -> Js.Promise.resolve ()
         | _ ->
             apply_op "upsert-property"
               [ Wire.Keyword ident
               ; Wire.Map
                   [ (Wire.kw "logseq.property/type", Wire.kw "default") ]
               ; Wire.Map [ (Wire.kw "property-name", Wire.String name) ]
               ]
             |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ()))

(* schema remap — cljs upsert-property-aux: type→logseq.property/type
   keyword, cardinality→db/cardinality kw, hide→logseq.property/hide?,
   public→public?; type restricted to the known set *)
let valid_property_types =
  [ "default"; "number"; "date"; "datetime"; "checkbox"; "url"; "node"
  ; "asset"; "json"; "string" ]

let schema_entry (k, v) =
  let ks = match k with Wire.String s | Wire.Keyword s -> s | _ -> "" in
  match ks with
  | "type" -> (
      match v with
      | Wire.String s when List.mem s valid_property_types ->
          Some (Wire.kw "logseq.property/type", Wire.kw s)
      | Wire.Keyword s when List.mem s valid_property_types ->
          Some (Wire.kw "logseq.property/type", Wire.kw s)
      | _ -> Some (Wire.kw "logseq.property/type", Wire.kw "default"))
  | "cardinality" -> (
      match v with
      | Wire.String "many" | Wire.Keyword "many" | Wire.Keyword "db.cardinality/many"
      | Wire.String "db.cardinality/many" ->
          Some (Wire.kw "db/cardinality", Wire.kw "db.cardinality/many")
      | _ -> Some (Wire.kw "db/cardinality", Wire.kw "db.cardinality/one"))
  | "hide" -> Some (Wire.kw "logseq.property/hide?", v)
  | "public" -> Some (Wire.kw "public?", v)
  | _ -> Some (Wire.Keyword ks, v)

(* ensure the property exists, honoring a caller-provided schema;
   resolves the effective property type *)
let ensure_property_typed ident key schema =
  get_entity_ident ident
  |> Js.Promise.then_ (fun p ->
         match p with
         | Wire.Map _ ->
             Js.Promise.resolve
               (Option.value
                  (Wire.map_get_string p "logseq.property/type")
                  ~default:"default")
         | _ ->
             let schema' =
               Wire.Map
                 ((match Wire.map_get_string schema "type" with
                   | Some t when List.mem t valid_property_types ->
                       [ (Wire.kw "logseq.property/type", Wire.Keyword t) ]
                   | _ ->
                       [ (Wire.kw "logseq.property/type", Wire.kw "default")
                       ])
                  @ List.filter_map schema_entry
                      (List.filter
                         (fun (k, _) -> k <> Wire.String "type")
                         (map_entries schema)))
             in
             apply_op "upsert-property"
               [ Wire.Keyword ident
               ; schema'
               ; Wire.Map
                   [ ( Wire.kw "property-name"
                     , Wire.String (sanitize_property_name key)) ]
               ]
             |> Js.Promise.then_ (fun _ ->
                    Js.Promise.resolve
                      (Option.value
                         (Wire.map_get_string schema "type")
                         ~default:"default")))

(* property types whose string values name an entity — a uuid string
   resolves to that entity instead of creating a new value block *)
let entity_ref_property_types =
  [ "node"; "page"; "entity"; "class"; "asset"; "property" ]

let resolve_property_value ptype (v : Wire.t) =
  match v with
  | Wire.String s
    when List.mem ptype entity_ref_property_types && is_uuid_string s ->
      get_entity s
      |> Js.Promise.then_ (fun e ->
             Js.Promise.resolve
               (match Wire.map_get_int e "id" with
                | Some i -> Wire.Int i
                | None -> v))
  | _ -> Js.Promise.resolve v

let upsert_block_property a b c d =
  match arg_string a, arg_string b with
  | Some id, Some key -> (
      let ident = property_ident key in
      let opts = arg_map d in
      let schema =
        Option.value (Wire.get opts "schema") ~default:(Wire.Map [])
      in
      get_entity id
      |> Js.Promise.then_ (fun block ->
             match block_uuid_of block with
             | None -> resolved_nil
             | Some uuid ->
                 ensure_property_typed ident key schema
                 |> Js.Promise.then_ (fun ptype ->
                        resolve_property_value ptype (arg_wire c)
                        |> Js.Promise.then_ (fun v ->
                               apply_op "set-block-property"
                                 [ Wire.Uuid uuid; Wire.Keyword ident; v ]
                               |> Js.Promise.then_ (fun _ -> resolved_nil)))))
  | _ -> resolved_nil

let remove_block_property a b _c _d =
  match arg_string a, arg_string b with
  | Some id, Some key -> (
      let ident = property_ident key in
      get_entity id
      |> Js.Promise.then_ (fun block ->
             match block_uuid_of block with
             | None -> resolved_nil
             | Some uuid ->
                 apply_op "remove-block-property"
                   [ Wire.Uuid uuid; Wire.Keyword ident ]
                 |> Js.Promise.then_ (fun _ -> resolved_nil)))
  | _ -> resolved_nil

let upsert_property a b c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some name ->
      let ident = property_ident name in
      let entries = map_entries (arg_wire b) in
      let has_type =
        List.exists
          (fun (k, _) ->
            match k with
            | Wire.String "type" | Wire.Keyword "type" -> true
            | _ -> false)
          entries
      in
      let schema' =
        Wire.Map
          ((if has_type then []
            else [ (Wire.kw "logseq.property/type", Wire.kw "default") ])
           @ List.filter_map schema_entry entries)
      in
      let opts =
        Wire.Map
          ( (Wire.kw "property-name"
            , Wire.String (sanitize_property_name name))
          :: (match arg_map c with
              | Wire.Map kvs -> kvs
              | _ -> []) )
      in
      apply_op "upsert-property" [ Wire.Keyword ident; schema'; opts ]
      |> Js.Promise.then_ (fun w ->
             match w with
             | Wire.Map _ -> resolved_wire w
             | _ ->
                 get_entity_ident ident
                 |> Js.Promise.then_ (fun p -> resolved_wire p))

let remove_property a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some name ->
      get_entity_ident (property_ident name)
      |> Js.Promise.then_ (fun p ->
             match block_uuid_of p with
             | None -> resolved_nil
             | Some uuid ->
                 apply_op "delete-page" [ Wire.Uuid uuid; Wire.Map [] ]
                 |> Js.Promise.then_ (fun _ -> resolved_nil))

let add_tag_extends a b _c _d =
  match arg_string a, arg_string b with
  | Some tag_id, Some extend_id ->
      Js.Promise.all2
        (get_entity tag_id, get_entity extend_id)
      |> Js.Promise.then_ (fun (tag, ext) ->
             match block_uuid_of tag, block_uuid_of ext with
             | Some t, Some e ->
                 apply_op "set-block-property"
                   [ Wire.Uuid t
                   ; Wire.Keyword "logseq.property.class/extends"
                   ; Wire.Uuid e
                   ]
                 |> Js.Promise.then_ (fun _ -> resolved_nil)
             | _ -> resolved_nil)
  | _ -> resolved_nil

let set_property_node_tags a b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some id ->
      let ident = property_ident id in
      let tags =
        arg_wire b |> list_items
        |> List.filter_map (fun w ->
               match w with
               | Wire.String s -> Some (Wire.String s)
               | _ -> None)
      in
      get_entity_ident ident
      |> Js.Promise.then_ (fun p ->
             match block_uuid_of p with
             | None -> resolved_nil
             | Some uuid ->
                 apply_op "set-block-property"
                   [ Wire.Uuid uuid
                   ; Wire.Keyword "logseq.property.node/tags"
                   ; Wire.Array tags
                   ]
                 |> Js.Promise.then_ (fun _ -> resolved_nil))
