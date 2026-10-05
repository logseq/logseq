(* ported from deps/ui/src/sdk/sdk_write.ml — see apple/NOTES.md *)
(* Write-side logseq.api methods — implemented on apply-outliner-ops. *)

open Promise_ext
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
  let* w =
    Runtime.invoke3 "thread-api/get-block-sibling"
      (Wire.String repo)
      (Wire.Array [ Wire.kw "block/uuid"; Wire.Uuid uuid ])
      (Wire.Keyword dir)
  in
  Js.Promise.resolve (block_uuid_of w)

let parent_of repo uuid =
  let* w =
    Runtime.invoke2 "thread-api/get-block-parent"
      (Wire.String repo)
      (Wire.Uuid uuid)
  in
  Js.Promise.resolve (block_uuid_of w)

let children_of repo uuid =
  let* w =
    Runtime.invoke2 "thread-api/get-block-immediate-children"
      (Wire.String repo)
      (Wire.Uuid uuid)
  in
  Js.Promise.resolve (list_items w)

let resolve_target repo block_uuid opts =
  let sibling = opt_bool "sibling" opts in
  let before = opt_bool "before" opts in
  let start = opt_bool "start" opts in
  if before then
    let* left = sibling_of repo block_uuid "left" in
    match left with
    | Some u -> Js.Promise.resolve (u, true)
    | None ->
        let* p = parent_of repo block_uuid in
        Js.Promise.resolve
          (Option.value p ~default:block_uuid, p = None)
  else if sibling then Js.Promise.resolve (block_uuid, true)
  else if start then
    let* cs = children_of repo block_uuid in
    match List.filter_map block_uuid_of cs with
    | first :: _ -> Js.Promise.resolve (first, true)
    | [] -> Js.Promise.resolve (block_uuid, false)
  else
    let* cs = children_of repo block_uuid in
    match List.rev (List.filter_map block_uuid_of cs) with
    | last :: _ -> Js.Promise.resolve (last, true)
    | [] -> Js.Promise.resolve (block_uuid, false)

(* properties arg {name: value} -> list of (raw-key, ident, wire value) *)
let properties_of (props : Wire.t) =
  map_entries props
  |> List.filter_map (fun (k, v) ->
         match k with
         | Wire.String s -> Some (s, property_ident s, v)
         | Wire.Keyword s -> Some (s, property_ident s, v)

         | _ -> None)

(* ---------- cljs api/block.cljs set-block-properties! ----------


   per key: ident via plugin ns; type = existing | schema.type | infer;
   cardinality = existing | (schema.cardinality == "many" || sequential
   value) && schema.cardinality <> "one" -> many; new prop -> upsert;
   json+non-string -> JSON.stringify; string+non-string -> str; seq ->
   one set-block-property per element. *)

(* db-property-type/url? — scheme:`...` per js/URL (any protocol) *)
let url_like s =
  match String.index_opt s ':' with
  | Some i when i > 0 ->
      String.for_all
        (fun c ->
          (c >= 'a' && c <= 'z')
          || (c >= 'A' && c <= 'Z')
          || (c >= '0' && c <= '9')
          || c = '+' || c = '-' || c = '.')
        (String.sub s 0 i)
      && (s.[0] >= 'a' && s.[0] <= 'z' || s.[0] >= 'A' && s.[0] <= 'Z')
  | _ -> false

let is_num = function
  | Wire.Int _ | Wire.Int64 _ | Wire.Float _ -> true
  | _ -> false

let is_url_wire = function Wire.String s -> url_like s | _ -> false

let infer_property_type (v : Wire.t) =
  match v with
  | Wire.Bool _ -> "checkbox"
  | _ when is_num v -> "number"
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      if List.for_all is_num xs then "number"
      else if List.for_all is_url_wire xs then "url"
      else "default"
  | Wire.String s -> if url_like s then "url" else "default"
  | Wire.Map _ -> "json"
  | _ -> "default"

(* per-key schema hint: {type, cardinality} map; a bare string schema
   (cljs (:type "page") = nil) carries no hints *)
let schema_for schema key =
  match Wire.get schema key with
  | Some (Wire.Map _ as m) -> m
  | _ -> Wire.Map []

let schema_str name (s : Wire.t) = Wire.map_get_string s name

let kw_of v =
  match v with Wire.Keyword s -> Some s | _ -> None

let existing_type p =
  Option.bind (Wire.get p "logseq.property/type") kw_of

let existing_card p = Option.bind (Wire.get p "db/cardinality") kw_of

let is_seq_wire = function
  | Wire.Array _ | Wire.List _ | Wire.Set _ -> true
  | _ -> false

let stringify_wire (v : Wire.t) =
  Wire.String (Js.Json.stringify (Sdk_convert.json_of_wire v))

let str_wire (v : Wire.t) =
  Wire.String
    (match v with
     | Wire.String s -> s
     | Wire.Bool b -> if b then "true" else "false"
     | Wire.Int n -> string_of_int n
     | Wire.Int64 n -> Int64.to_string n
     | Wire.Float f -> string_of_float f
     | other -> Js.Json.stringify (Sdk_convert.json_of_wire other))

let property_name_of_ident ident =
  match String.rindex_opt ident '/' with
  | Some i -> String.sub ident (i + 1) (String.length ident - i - 1)
  | None -> ident

(* ops for one (key, ident, value, schema-entry, existing-prop) — cljs
   set-block-properties! per-entry logic *)
let entry_ops ~reset block_uuid (key, ident, v) schema_entry
    (prop : Wire.t option) =
  let existing_t, existing_c =
    match prop with
    | Some p -> (existing_type p, existing_card p)
    | None -> (None, None)
  in
  let schema_type = schema_str "type" schema_entry in
  let schema_card = schema_str "cardinality" schema_entry in
  let ptype =
    match existing_t, schema_type with
    | Some t, _ -> t
    | None, Some t -> t
    | None, None -> (
        match prop with
        | Some _ -> "default"
        | None -> infer_property_type v)
  in
  let many =
    match existing_c with
    | Some c -> c = "db.cardinality/many"
    | None ->
        (schema_card = Some "many" || is_seq_wire v)
        && schema_card <> Some "one"
  in
  if many && ptype = "json" then
    Js.Exn.raiseError "json type doesn't support multiple values";
  (match prop, Wire.get schema_entry "type", Wire.get schema_entry "cardinality" with
   | Some _, Some _, _ | Some _, _, Some _ ->
       Js.Exn.raiseError
         "Use `upsert_property` to modify existing property's schema"
   | _ -> ());
  let values =
    match v with
    | Wire.Array xs | Wire.List xs | Wire.Set xs -> xs
    | other -> [ other ]
  in
  let convert e =
    match ptype, e with
    | "json", Wire.String _ -> e
    | "json", _ -> stringify_wire e
    | "string", Wire.String _ -> e
    | "string", _ -> str_wire e
    | _ -> e
  in
  (match prop with
   | None ->
       [ Wire.Array
           [ Wire.Keyword "upsert-property"
           ; Wire.Array
               [ Wire.Keyword ident
               ; Wire.Map
                   [ (Wire.kw "logseq.property/type", Wire.kw ptype)
                   ; ( Wire.kw "db/cardinality"
                     , Wire.kw
                         (if many then "db.cardinality/many"
                          else "db.cardinality/one") )
                   ]
               ; Wire.Map
                   [ (Wire.kw "property-name", Wire.String key) ]
               ]
           ]
       ]
   | Some _ -> [])
  @ (match prop with
     | Some _ when (many && reset) || v = Wire.Nil ->
         [ Wire.Array
             [ Wire.Keyword "remove-block-property"
             ; Wire.Array [ Wire.Uuid block_uuid; Wire.Keyword ident ]
             ]
         ]
     | _ -> [])
  @ List.map
      (fun e ->
        Wire.Array
          [ Wire.Keyword "set-block-property"
          ; Wire.Array [ Wire.Uuid block_uuid; Wire.Keyword ident; convert e ]
          ])
      values

(* fetch existing property entities for the given idents, then build
   the outliner ops (upsert + remove + set) in order *)
let block_property_ops ?(reset = false) block_uuid props schema =
  let idents = List.map (fun (_, i, _) -> Wire.Keyword i) props in
  let* existing = get_many idents in
  let schema = match schema with Wire.Map _ -> schema | _ -> Wire.Map [] in
  let ops =
    List.concat_map
      (fun ((key, ident, v), prop) ->
        entry_ops ~reset block_uuid (key, ident, v)
          (schema_for schema key) prop)
      (List.combine props existing)
  in
  Js.Promise.resolve ops

(* apply block properties for a known block uuid *)
let save_block_properties ?(reset = false) block_uuid props schema =
  match props with
  | [] -> Js.Promise.resolve ()
  | _ ->
      let* ops = block_property_ops ~reset block_uuid props schema in
      let* _ = apply_ops ops (Wire.Map []) in
      Js.Promise.resolve ()

(* cljs wrap-parse-block: extract refs/tags from the title before
   insert — see Title_refs *)
let parsed_block_map content custom_uuid =
  let* p = Title_refs.parse content in
  Js.Promise.resolve
    (Wire.Map
       ([ ( Wire.String "block/title"
          , Wire.String p.Title_refs.title )
        ; ( Wire.String "block/uuid"
          , Wire.Uuid
              (match custom_uuid with
               | Some u -> u
               | None -> Platform.random_uuid ()) )
        ]
       @ Title_refs.kvs_of_parsed p))

let insert_block a b c _d =
  match arg_string b with
  | Some content -> (
      let opts = arg_map c in
      let custom_uuid =
        match opt_string "customUUID" opts with
        | Some u -> Some u
        | None -> (
            match Wire.get opts "properties" with
            | Some p -> (
                match Wire.get p "id" with
                | Some (Wire.String u) when Wire.is_uuid_string u -> Some u
                | _ -> None)
            | None -> None)
      in
      let props =
        match Wire.get opts "properties" with
        | Some p -> properties_of p
        | None -> []
      in
      let schema =
        match Wire.get opts "schema" with
        | Some s -> s
        | None -> Wire.Map []
      in
      (let* block = get_entity_json a in
      match block_uuid_of block with
      | None -> resolved_nil
      | Some uuid ->
          let* (target, sibling) = resolve_target (repo ()) uuid opts in
          let* new_block = parsed_block_map content custom_uuid in
          let new_uuid =
            match custom_uuid with
            | Some u -> u
            | None ->
                Option.value
                  ~default:"" (block_uuid_of new_block)
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
          let* prop_ops = block_property_ops new_uuid props schema in
          let* _ =
            apply_ops
              (Wire.Array
                 [ Wire.Keyword "insert-blocks"
                 ; Wire.Array
                     [ Wire.Array [ new_block ]
                     ; Wire.Uuid target
                     ; insert_opts
                     ]
                 ]
              :: prop_ops)
              (Wire.Map [])
          in
          let* w = get_entity new_uuid in
          resolved_result w))
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
      (* title parsing is deferred — flats carry the raw content and
         parse_flats rewrites it to id-ref form + block/refs,block/tags *)
      let acc = (uuid, content, level, parent_uuid, props) :: acc in
      (match Wire.get w "children" with
       | Some c ->
           List.fold_left
             (flatten_batch (level + 1) (Some uuid))
             acc (list_items c)
       | None -> acc)
  | _ -> acc

(* cljs with-parent-and-order: children carry :block/parent as a
   [:block/uuid u] lookup-ref — the worker re-derives level from it *)
let flat_map_of uuid level parent_uuid (p : Title_refs.parsed) =
  let parent_kv =
    match parent_uuid with
    | Some pu ->
        [ ( Wire.String "block/parent"
          , Wire.Array [ Wire.kw "block/uuid"; Wire.Uuid pu ] ) ]
    | None -> []
  in
  Wire.Map
    ([ (Wire.String "block/title", Wire.String p.title)
     ; (Wire.String "block/uuid", Wire.Uuid uuid)
     ; (Wire.String "block/level", Wire.Int level) ]
    @ Title_refs.kvs_of_parsed p @ parent_kv)

let parse_flats flats =
  let* a =
    flats
    |> List.map (fun (uuid, content, level, parent, props) ->
           let* p = Title_refs.parse content in
           Js.Promise.resolve
             (uuid, flat_map_of uuid level parent p, props))
    |> Array.of_list |> Js.Promise.all
  in
  Js.Promise.resolve (Array.to_list a)

let insert_batch_block a b c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some id ->
      let flats =
        List.rev
          (List.fold_left (flatten_batch 1 None) [] (list_items (arg_wire b)))
      in
      let opts = arg_map c in
      (let* target = get_entity id in
      match block_uuid_of target with
      | None -> resolved_nil
      | Some uuid ->
          let* flats = parse_flats flats in
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
          let schema =
            match Wire.get opts "schema" with
            | Some s -> s
            | None -> Wire.Map []
          in
          let all_idents =
            List.concat_map
              (fun (_, _, props) ->
                List.map (fun (_, i, _) -> Wire.Keyword i) props)
              flats
          in
          let* existing = get_many all_idents in
          (* existing aligns with all_idents order; carve it
                    back per node *)
          let pool = ref existing in
          let prop_ops =
            List.concat_map
              (fun (u, _, props) ->
                let n = List.length props in
                let mine = List.filteri (fun i _ -> i < n) !pool in
                pool := List.filteri (fun i _ -> i >= n) !pool;
                List.concat_map
                  (fun ((key, ident, v), prop) ->
                    entry_ops ~reset:false u (key, ident, v)
                      (schema_for schema key) prop)
                  (List.combine props mine))
              flats
          in
          let* _ =
            apply_ops
              (Wire.Array
                 [ Wire.Keyword "insert-blocks"
                 ; Wire.Array
                     [ Wire.Array
                         (List.map (fun (_, m, _) -> m) flats)
                     ; Wire.Uuid uuid
                     ; insert_opts
                     ]
                 ]
              :: prop_ops)
              (Wire.Map [])
          in
          let* w =
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
          in
          let blocks =
            List.filter_map
              Wire.block_of_pair
              (Wire.elems w)
          in
          resolved
            (Sdk_convert.json_arr
               (Array.of_list
                  (List.map Sdk_convert.json_of_wire
                     blocks))))

let append_block_in_page a b c _d =
  (* overloads: (content) | (page, content) | (page, content, opts) *)
  let page_arg, content, opts =
    match arg_string b with
    | Some content -> (arg_string a, content, arg_map c)
    | None ->
        (None, Option.value ~default:"" (arg_string a), arg_map b)
  in
  (* cljs <get-current-page-or-today: current page, else today's journal *)
  let target_id =
    match page_arg with
    | Some p -> Js.Promise.resolve p
    | None -> (
        match !Runtime.current_page with
        | Some p ->
            Js.Promise.resolve
              (Option.value ~default:"" p.Model.page_uuid)
        | None ->
            let r = Option.value ~default:"" !Runtime.current_repo in
            let* page_w =
              Runtime.invoke2 "thread-api/get-journal-page-by-day"
                (Wire.String r)
                (Wire.Int (Dates.today_journal_day ()))
            in
            Js.Promise.resolve
              (Option.value ~default:""
                 (Wire.map_get_uuid page_w "block/uuid")))
  in
  let opts' =
    match opts with
    | Wire.Map kvs -> Wire.Map ((Wire.String "sibling", Wire.Bool false) :: kvs)
    | _ -> opts
  in
  let* target_id = target_id in
  (* cljs append-block-in-page creates a missing named page first *)
  let* e = get_entity target_id in
  let* () =
    match e, Wire.is_uuid_string target_id, target_id with
    | Wire.Nil, false, name when name <> "" ->
        let* _ =
          apply_op "create-page"
            [ Wire.String name; Wire.Map [] ]
        in
        Js.Promise.resolve ()
    | _ -> Js.Promise.resolve ()
  in
  insert_block (Js.Json.string target_id)
    (Js.Json.string content)
    (Sdk_convert.json_of_wire opts')
    Js.Json.null

let update_block a b c _d =
  match arg_string b with
  | Some content ->
      let opts = arg_map c in
      (let* block = get_entity_json a in
      match block_uuid_of block with
      | None -> resolved_nil
      | Some uuid ->
          let props =
            match Wire.get opts "properties" with
            | Some p -> properties_of p
            | None -> []
          in
          let schema =
            match Wire.get opts "schema" with
            | Some s -> s
            | None -> Wire.Map []
          in
          (* cljs update-block applies properties BEFORE save-block *)
          let* () =
            save_block_properties
              ~reset:(opt_bool "resetPropertyValues" opts
                      || opt_bool "reset-property-values" opts
                      || opt_bool "reset" opts)
              uuid props schema
          in
          (* cljs updateBlock -> save-block! -> wrap-parse-block *)
          let* p = Title_refs.parse content in
          let* _ =
            apply_op "save-block"
              [ Wire.Map
                  ([ ( Wire.String "block/uuid"
                     , Wire.Uuid uuid )
                   ; ( Wire.String "block/title"
                     , Wire.String p.Title_refs.title )
                   ]
                  @ Title_refs.kvs_of_parsed p)
              ; Wire.Map []
              ]
          in
          resolved_nil)
  | _ -> resolved_nil

let remove_block a _b _c _d =
  let* block = get_entity_json a in
  match block_uuid_of block with
  | None -> resolved_nil
  | Some uuid ->
      let* _ =
        apply_op "delete-blocks"
          [ Wire.Array [ Wire.Uuid uuid ]; Wire.Map [] ]
      in
      resolved_nil

(* cljs create-page: create (or reuse) the page, then run its
   properties through db-based-save-block-properties! with opts.schema *)
let create_page_with_flags name journal class_ uuid custom_uuid props schema =
  let opts =
    [ (Wire.kw "journal?", Wire.Bool journal)
    ; (Wire.kw "class?", Wire.Bool class_)
    ; ( Wire.kw "uuid"
      , Wire.Uuid (match custom_uuid with Some u -> u | None -> uuid) )
    ]

  in
  let* r = apply_op "create-page" [ Wire.String name; Wire.Map opts ] in
  let* u =
    Js.Promise.resolve
      (match Wire.elems r with
       | [ _; Wire.Uuid u ] -> u
       | [ _; Wire.String u ] -> u
       | _ -> uuid)
  in
  let* page = get_entity u in
  let* () =
    match block_uuid_of page with
    | Some puuid ->
        save_block_properties puuid props schema
    | None -> Js.Promise.resolve ()
  in
  (* journals get a worker-assigned day uuid — resolve the
            entity under u, not the caller's uuid *)
  let* w = get_entity u in
  resolved_result w


let create_page a b c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some name ->
      let opts = arg_map c in
      let uuid =
        match opt_string "customUUID" opts with
        | Some u -> u
        | None -> Platform.random_uuid ()
      in
      (* properties live in arg b — cljs create_page(name, properties, opts) *)
      let props = properties_of (arg_map b) in
      let schema =
        match Wire.get opts "schema" with
        | Some s -> s
        | None -> Wire.Map []
      in
      (let* existing = get_entity name in
      match existing with
      | Wire.Nil ->
          create_page_with_flags name (opt_bool "journal" opts)
            (opt_bool "class" opts) uuid
            (opt_string "customUUID" opts) props schema
      | _ -> resolved_result existing)

let date_of_epoch (ms : float) : Js.Date.t = Js.Date.fromFloat ms


let date_get_time (d : Js.Date.t) : float = Js.Date.getTime d

(* cljs create_journal_page: new Date(arg) — accepts epoch ms or an
   ISO date string; NaN → no page. journal pages get a day-derived
   uuid worker-side (Common_uuid/gen_journal_page_uuid), so resolve
   the entity by its formatted title, not a client-generated uuid *)
let create_journal_page a _b _c _d =
  let day_int =
    match Js.Json.classify a with
    | Js.Json.JSONNumber ms ->
        Some (Dates.journal_day_of (date_of_epoch ms))
    | Js.Json.JSONString s -> (
        match float_of_string_opt s with
        | Some ms -> Some (Dates.journal_day_of (date_of_epoch ms))
        | None -> (
            let d = Js.Date.fromString s in
            match classify_float (Js.Date.getTime d) with
            | FP_nan -> None
            | _ -> Some (Dates.journal_day_of d)))
    | _ -> None
  in
  match day_int with
  | None -> resolved_nil
  | Some day ->
      let y, m, d = day / 10000, day mod 10000 / 100, day mod 100 in
      create_page_with_flags
        (Printf.sprintf "%04d-%02d-%02d" y m d)
        true false
        (Platform.random_uuid ())
        None [] (Wire.Map [])

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

let upsert_property_op name ident schema_wire =
  (* upsert-property op for a tagProperty entry: schema has cljs keys
     (type/cardinality/hide/public) -> wire schema map *)
  let entries = map_entries schema_wire in
  let schema' =
    Wire.Map (List.filter_map schema_entry entries)
  in
  Wire.Array
    [ Wire.Keyword "upsert-property"
    ; Wire.Array
        [ Wire.Keyword ident
        ; schema'
        ; Wire.Map [ (Wire.kw "property-name", Wire.String name) ]
        ]
    ]

(* upsert each tagProperty unless it already exists *)
let upsert_tag_properties idents =
  let* existing = get_many (List.map (fun (_, i, _) -> Wire.Keyword i) idents) in
  let upserts =
    List.filter_map
      (fun ((name, ident, tp), ex) ->
        match ex with
        | Some _ -> None
        | None ->
            Some
              (upsert_property_op name ident
                 (match Wire.get tp "schema" with
                  | Some s -> s
                  | None -> Wire.Map [])))
      (List.combine idents existing)
  in
  match upserts with
  | [] -> Js.Promise.resolve ()
  | _ ->
      let* _ = apply_ops upserts (Wire.Map []) in
      Js.Promise.resolve ()

(* link tagProperties via :logseq.property.class/properties [db-ids] *)
let link_tag_properties uuid idents =
  let* ps = get_many (List.map (fun (_, i, _) -> Wire.Keyword i) idents) in
  let ids =
    List.filter_map
      (fun p ->
        match p with
        | Some p -> Wire.map_get_int p "db/id"
        | None -> None)
      ps
  in
  let* _ =
    apply_op "set-block-property"
      [ Wire.Uuid uuid
      ; Wire.Keyword "logseq.property.class/properties"
      ; Wire.Array (List.map (fun i -> Wire.Int i) ids)
      ]
  in
  Js.Promise.resolve ()

(* cljs create-tag: <create-class! title {:class-ident-namespace
   plugin-ns} then tagProperties each upsert-property-aux'd and linked
   via :logseq.property.class/properties [db-ids] *)
let create_tag a b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some title ->
      let uuid = Platform.random_uuid () in
      let opts = arg_map b in
      let idents =
        match Wire.get opts "tagProperties" with
        | Some (Wire.Array xs) | Some (Wire.List xs) ->
            List.filter_map
              (fun tp ->
                match Wire.map_get_string tp "name" with
                | Some n -> Some (n, property_ident n, tp)
                | None -> None)
              xs
        | _ -> []
      in
      let* _ =
        apply_op "create-page"
          [ Wire.String title
          ; Wire.Map
              [ (Wire.kw "class?", Wire.Bool true)
              ; (Wire.kw "uuid", Wire.Uuid uuid)
              ; ( Wire.kw "class-ident-namespace"
                , Wire.kw "plugin.class._test_plugin" )
              ]
          ]
      in
      let* () = upsert_tag_properties idents in
      let* () =
        match idents with
        | [] -> Js.Promise.resolve ()
        | _ -> link_tag_properties uuid idents
      in
      let* w = get_entity uuid in
      resolved_result w

let delete_page a _b _c _d =
  let* page = get_entity_json a in
  match block_uuid_of page with
  | None -> resolved_nil
  | Some uuid ->
      let* _ = apply_op "delete-page" [ Wire.Uuid uuid; Wire.Map [] ] in
      resolved_nil

let upsert_block_property a b c d =
  match arg_string b with
  | Some key -> (
      let opts = arg_map d in
      (let* block = get_entity_json a in
      match block_uuid_of block with
      | None -> resolved_nil
      | Some uuid ->
          (* cljs upsert-block-property → db-based-save-block-properties!
             with {key schema} *)
          let schema =
            match Wire.get opts "schema" with
            | Some s -> Wire.Map [ (Wire.String key, s) ]
            | None -> Wire.Map []
          in
          let* () =
            save_block_properties
              ~reset:(opt_bool "reset" opts
                      || opt_bool "resetPropertyValues" opts)
              uuid [ (key, property_ident key, arg_wire c) ] schema
          in
          resolved_nil))
  | _ -> resolved_nil

let remove_block_property a b _c _d =
  match arg_string b with
  | Some key -> (
      let ident = property_ident key in
      (let* block = get_entity_json a in
      match block_uuid_of block with
      | None -> resolved_nil
      | Some uuid ->
          let* _ =
            apply_op "remove-block-property"
              [ Wire.Uuid uuid; Wire.Keyword ident ]
          in
          let* prop = get_entity_ident ident in
          (* the broadcast refresh is debounced;
                    drop the rendered row so the DOM is
                    settled when this promise resolves *)
          (match
             Wire.map_get_string prop "block/title"
           with
           | Some t ->
               Properties_area.drop_row
                 ~owner_uuid:uuid ~title:t
           | None -> ());
          resolved_nil))
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
      (let* w = apply_op "upsert-property" [ Wire.Keyword ident; schema'; opts ] in
      match w with
      | Wire.Map _ -> resolved_result w
      | _ ->
          let* p = get_entity_ident ident in
          resolved_wire p)

let remove_property a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some name ->
      (let* p = get_entity_ident (property_ident name) in
      match block_uuid_of p with
      | None -> resolved_nil
      | Some uuid ->
          let* _ = apply_op "delete-page" [ Wire.Uuid uuid; Wire.Map [] ] in
          resolved_nil)

(* cljs add-tag-extends passes (:db/id tag) (:db/id extend); the
   set-block-property op's SBlockId arg accepts uuids only *)

let add_tag_extends a b _c _d =
  let* (tag, ext) = Js.Promise.all2 (get_entity_json a, get_entity_json b) in
  match block_uuid_of tag, Wire.map_get_int ext "db/id" with
  | Some t, Some e ->
      let* _ =
        apply_op "set-block-property"
          [ Wire.Uuid t
          ; Wire.Keyword "logseq.property.class/extends"
          ; Wire.Int e
          ]
      in
      resolved_nil
  | _ -> resolved_nil


(* cljs set-property-node-tags: set-block-property! (:db/id property)
   :logseq.property/classes [tag-db-ids...] *)
let set_property_node_tags a b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some id ->
      let ident = property_ident id in
      let tags =
        arg_wire b |> list_items
        |> List.filter_map (fun w ->
               match w with
               | Wire.Int n -> Some (Wire.Int n)
               | Wire.Int64 n -> Some (Wire.Int (Int64.to_int n))
               | Wire.Float f -> Some (Wire.Int (int_of_float f))
               | _ -> None)
      in
      (let* p = get_entity_ident ident in
      match block_uuid_of p with
      | None -> resolved_nil
      | Some puuid ->
          let* _ =
            apply_op "set-block-property"
              [ Wire.Uuid puuid
              ; Wire.Keyword "logseq.property/classes"
              ; Wire.Array tags
              ]
          in
          resolved_nil)
