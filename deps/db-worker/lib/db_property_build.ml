(* logseq.db.frontend.property.build + sqlite-util pieces —
   builds property value tx maps and closed-value blocks.
   Block/property maps are [Block_map.t] ((attr * value) alists, cljs map
   semantics); conversion to tx ops goes through Block_map.to_tx_op. *)
open Datascript

let name_of_ident (ident : string) : string =
  match String.rindex_opt ident '/' with
  | Some i -> String.sub ident (i + 1) (String.length ident - i - 1)
  | None -> ident

(* cljs str — used by pure? uuid seeds (str prefix "-" value).
   cljs str prints collections edn-style with unbracketed elements. *)
let rec str_of_value (v : value) : string =
  match v with
  | String s -> s
  | Uuid s -> s
  | Keyword s -> ":" ^ s
  | Symbol s -> s
  | Int n -> string_of_int n
  | Float f -> string_of_float f
  | Bool b -> if b then "true" else "false"
  | Nil -> "nil"
  | Vector vs | List vs | Set vs ->
    "[" ^ String.concat " " (List.map str_of_value vs) ^ "]"
  | Tuple vs ->
    "("
    ^ String.concat " "
        (List.map (function Some v -> str_of_value v | None -> "nil") vs)
    ^ ")"
  | Map kvs ->
    "{"
    ^ String.concat " "
        (List.map (fun (k, x) -> str_of_value k ^ " " ^ str_of_value x) kvs)
    ^ "}"
  | Ref n -> string_of_int n
  | Ref_to r -> str_of_entity_ref r
  | TxRef -> ":db/current-tx"
  | Instant ms -> Int64.to_string ms
  | Regex s -> "#\"" ^ s ^ "\""

and str_of_entity_ref (r : entity_ref) : string =
  match r with
  | Entity_id n -> string_of_int n
  | Temp_id s -> s
  | Ident s -> ":" ^ s
  | Lookup_ref (a, v) -> "[:" ^ a ^ " " ^ str_of_value v ^ "]"
  | CurrentTx -> ":db/current-tx"

(* db-property-type/original-value-ref-property-types *)
let original_value_ref_property_types = [ "number" ]

(* db-property-type/value-ref-property-types *)
let value_ref_property_types = [ "default"; "url"; "number" ]

(* db-property-type/all-ref-property-types *)
let all_ref_property_types =
  [ "entity"; "class"; "page"; "property"; "date"; "node"; "asset" ]
  @ value_ref_property_types

(* Built-in property idents whose :schema :type is a ref-value type
   (:default :url :number) — get-in built-in-properties [k :schema :type].
   Extracted from property.cljs; full table lands via builtin_data.ml. *)
let built_in_ref_value_idents =
  [ "logseq.property/description"; "logseq.property/query"
  ; "logseq.property/background-color"; "logseq.property.pdf/hl-color"
  ; "logseq.property/order-list-type"; "logseq.property/status"
  ; "logseq.property/priority"; "logseq.property.repeat/recur-unit"
  ; "logseq.property.repeat/repeat-type"
  ; "logseq.property.publish/published-url"; "logseq.property.view/type" ]

(* db-property/built-in-has-ref-value? *)
let built_in_has_ref_value (ident : attr) : bool =
  List.mem ident built_in_ref_value_idents

(* db-property-type/property-value-content?
   [block_type] is the property :type of the context (property's own type when
   called from closed-value-new-block, block's when from value-block). *)
(* cljs reads :logseq.property/type via keyword get; the value is a keyword
   on real entities but some intermediate maps carry it as a string *)
let property_type_attr (m : Block_map.t) : string option =
  match Block_map.attr_value m "logseq.property/type" with
  | Some (Keyword t) | Some (String t) -> Some t
  | _ -> None

let property_value_content (block_type : string option) (property : Block_map.t) : bool =
  let prop_type = property_type_attr property in
  (match prop_type with
   | Some t -> List.mem t original_value_ref_property_types
   | None -> false)
  || (Block_map.string_attr property "db/ident" = Some "logseq.property/default-value"
      && (match block_type with
          | Some t -> List.mem t original_value_ref_property_types
          | None -> false))

(* common-util/block-with-timestamps *)
let block_with_timestamps (m : Block_map.t) : Block_map.t =
  let now = Int (Int64.to_int (Date_time_util.time_ms ())) in
  let m = Block_map.put m "block/updated-at" now in
  if Block_map.mem m "block/created-at" then m
  else Block_map.put m "block/created-at" now

(* block map -> wire/tx value form: keyword keys -> attr string keys *)
let block_map_value (m : Block_map.t) : value =
  Map (List.map (fun (a, v) -> (Keyword a, v)) m)

(* property-build/closed-value-new-block *)
let closed_value_new_block (block_id : string) (block_type : string option)
    (v : value) (property : Block_map.t) : Block_map.t =
  let property_id = Block_map.string_attr property "db/ident" in
  let prop_ref : value =
    match property_id with Some i -> Ref_to (Ident i) | None -> Nil
  in
  [ "block/uuid", Uuid block_id
  ; "block/page", prop_ref
  ; "block/closed-value-property", prop_ref
  ; ( "logseq.property/created-from-property"
    , if property_id = Some "logseq.property/default-value"
      then Ref_to (Lookup_ref ("block/uuid", Uuid block_id))
      else prop_ref )
  ; "block/parent", prop_ref ]
  @ (if property_value_content block_type property
     then [ "logseq.property/value", v ]
     else [ "block/title", v ])

(* property-build/build-closed-value-block *)
let build_closed_value_block ?(db_ident : string option) ?(icon : value option)
    (block_uuid : string) (block_type : string option) (block_value : value)
    (property : Block_map.t) : Block_map.t =
  closed_value_new_block block_uuid block_type block_value property
  |> (fun m ->
      match db_ident with
      | Some ident -> Block_map.put m "db/ident" (Keyword ident)
      | None -> m)
  |> (fun m ->
      match icon with
      | Some v -> Block_map.put m "logseq.property/icon" v
      | None -> m)
  |> block_with_timestamps

(* property-build/closed-values->blocks
   [closed_values] items are maps with uuid/db-ident/value/icon/schema/properties. *)
let closed_values_to_blocks (property : Block_map.t) (closed_values : Block_map.t list)
    : Block_map.t list =
  List.map
    (fun (cv : Block_map.t) ->
      let uuid' =
        match Block_map.uuid_attr cv "uuid" with
        | Some u -> u
        | None -> invalid_arg "closed-value requires :uuid"
      in
      let block_type =
        match Block_map.attr_value cv "schema" with
        | Some (Map kvs) ->
          (match List.assoc_opt (Keyword "type") kvs with
           | Some (Keyword t) -> Some t
           | _ -> None)
        | _ -> None
      in
      let block_value =
        match Block_map.attr_value cv "value" with Some v -> v | None -> Nil
      in
      let m =
        build_closed_value_block ?db_ident:(Block_map.string_attr cv "db-ident")
          ?icon:(Block_map.attr_value cv "icon") uuid' block_type block_value property
      in
      let m =
        match Block_map.attr_value cv "properties" with
        | Some (Map kvs) ->
          List.fold_left
            (fun acc (k, v) ->
              match k with Keyword a | String a -> Block_map.put acc a v | _ -> acc)
            m kvs
        | _ -> m
      in
      Block_map.put m "block/order" (String (Db_order.gen_key_from_max ())))
    closed_values

(* sqlite-util/build-new-property *)
let build_new_property ~(db_ident : string) ~(prop_schema : Block_map.t)
    ?(title : string option) ?(block_uuid : string option) ?(ref_type = false)
    ?(properties : Block_map.t option = None) () : Block_map.t =
  let db_ident' =
    if Ns_util.str_contains db_ident "/" then db_ident
    else
      Db_ident.create_db_ident_from_name ~user_namespace:"logseq.property.user"
        ~name_string:db_ident
  in
  let prop_name = match title with Some t -> t | None -> name_of_ident db_ident' in
  let prop_type =
    match property_type_attr prop_schema with
    | Some t -> t
    | None -> "default"
  in
  let cardinality =
    match Block_map.attr_value prop_schema "db/cardinality" with
    | Some (Keyword ("many" | "db.cardinality/many")) -> "db.cardinality/many"
    | _ -> "db.cardinality/one"
  in
  (* cljs (merge (dissoc prop-schema :db/cardinality) {...}) — the literal is
     `over` so its :logseq.property/type Keyword wins over prop_schema's. *)
  Block_map.merge
    (Block_map.dissoc prop_schema [ "db/cardinality" ])
    [ "db/ident", Keyword db_ident'
    ; "block/tags", Set [ Keyword "logseq.class/Property" ]
    ; "logseq.property/type", Keyword prop_type
    ; "block/name", String (Ldb.page_name_sanity_lc prop_name)
    ; ( "block/uuid"
      , Uuid
          (match block_uuid with
           | Some u -> u
           | None -> Common_uuid.gen_uuid "db-ident-block-uuid" db_ident') )
    ; "block/title", String prop_name
    ; "db/index", Bool true
    ; "db/cardinality", Keyword cardinality
    ; "block/order", String (Db_order.gen_key_from_max ()) ]
  |> block_with_timestamps
  |> (fun m ->
      if ref_type || List.mem prop_type all_ref_property_types
      then Block_map.put m "db/valueType" (Keyword "db.type/ref")
      else m)
  |> fun m ->
     match properties with Some p -> Block_map.merge m p | None -> m

(* property-build/build-closed-values *)
let build_closed_values ?(property_attributes : Block_map.t option = None)
    ?(properties : Block_map.t option = None) (db_ident : string) (prop_name : string)
    (property : Block_map.t) : Block_map.t list =
  let property_schema =
    match Block_map.attr_value property "schema" with
    | Some (Map kvs) ->
      List.filter_map (fun (k, v) ->
          match k with Keyword a | String a -> Some (a, v) | _ -> None) kvs
    | _ -> []
  in
  let property_tx =
    let m =
      build_new_property ~db_ident ~prop_schema:property_schema ~title:prop_name
        ~ref_type:true ~properties ()
    in
    match property_attributes with
    | Some pa -> Block_map.merge m pa
    | None -> m
  in
  let closed_values =
    match Block_map.attr_value property "closed-values" with
    | Some (Vector items) | Some (List items) | Some (Set items) ->
      List.filter_map
        (function
          | Map kvs ->
            Some
              (List.filter_map (fun (k, v) ->
                   match k with Keyword a | String a -> Some (a, v) | _ -> None)
                 kvs)
          | _ -> None)
        items
    | _ -> []
  in
  property_tx :: closed_values_to_blocks property closed_values

(* property-build/build-property-value-block *)
let build_property_value_block ?(block_uuid : string option)
    ?(properties : Block_map.t option) (block : Block_map.t)
    (property : Block_map.t) (v : value) : Block_map.t =
  let block_id : value =
    match Block_map.attr_value block "db/id" with
    | Some id -> id
    | None ->
      (match Block_map.attr_value block "db/ident" with
       | Some i -> i
       | None -> Nil)
  in
  let uuid =
    match block_uuid with
    | Some u -> u
    | None -> Common_uuid.gen_uuid "builtin-block-uuid" (str_of_value v)
  in
  let created_from : value =
    if Block_map.string_attr property "db/ident" = Some "logseq.property/default-value"
    then block_id
    else
      match Block_map.attr_value property "db/id" with
      | Some id -> id
      | None ->
        (match Block_map.attr_value property "db/ident" with
         | Some i -> Map [ Keyword "db/ident", i ]
         | None -> Nil)
  in
  let block_page : value =
    match Block_map.attr_value block "block/page" with
    | Some (Map page_m) ->
      (match List.assoc_opt (Keyword "db/id") page_m with
       | Some id -> id
       | None -> block_id)
    | _ -> block_id
  in
  [ "block/uuid", Uuid uuid
  ; "block/page", block_page
  ; "block/parent", block_id
  ; "logseq.property/created-from-property", created_from
  ; "block/order", String (Db_order.gen_key_from_max ()) ]
  @ (if property_value_content
          (property_type_attr block) property
     then [ "logseq.property/value", v ]
     else [ "block/title", v ])
  |> block_with_timestamps
  |> fun m ->
     match properties with
     | Some p -> Block_map.merge m p
     | None -> m

(* property-build/build-property-values-tx-m
   Returns prop-ident -> value association list where value is a block-map
   [Map], a lookup-ref [Ref_to], or a [Set] of those — the cljs map. *)
let build_property_values_tx_m ?(pure = false) ?(pvalue_map = false)
    (block : Block_map.t) (properties : (value * value) list) : (attr * value) list =
  let block' =
    match Block_map.attr_value block "db/id" with
    | Some _ -> block
    | None ->
      (match Block_map.uuid_attr block "block/uuid" with
       | Some u ->
         block @ [ "db/id", Ref_to (Lookup_ref ("block/uuid", Uuid u)) ]
       | None -> block)
  in
  let gen_uuid_value_prefix =
    if pure then
      match Block_map.attr_value block "db/ident", Block_map.uuid_attr block "block/uuid" with
      (* cljs (str :ns/name "-v") keeps the leading colon. *)
      | Some (Keyword i), _ -> Some (":" ^ i)
      | _, Some u -> Some u
      | _ -> invalid_arg "pure? requires block :db/ident or :block/uuid"
    else None
  in
  List.map
    (fun ((k : value), (v_star : value)) ->
      let property_map : Block_map.t =
        match k with
        | Map kvs ->
          List.filter_map (fun (k, v) ->
              match k with Keyword a | String a -> Some (a, v) | _ -> None) kvs
        | Keyword ident -> [ "db/ident", Keyword ident ]
        | String ident -> [ "db/ident", Keyword ident ]
        | _ -> invalid_arg "property key must be ident or map"
      in
      let to_pvalue (x : value) : value =
        if pvalue_map then
          match x with
          | Map m ->
            (match List.assoc_opt (Keyword "value") m with
             | Some v -> v
             | None -> Nil)
          | _ -> x
        else x
      in
      let v =
        match v_star with
        | Set vs -> Set (List.map to_pvalue vs)
        | x -> to_pvalue x
      in
      let value_block_opts (v' : value) : string option * Block_map.t option =
        let props =
          if pvalue_map then
            match v' with
            | Map m ->
              (match List.assoc_opt (Keyword "attributes") m with
               | Some (Map attrs) ->
                 Some
                   (List.filter_map (fun (k, v) ->
                        match k with
                        | Keyword a | String a -> Some (a, v)
                        | _ -> None)
                      attrs)
               | _ -> None)
            | _ -> None
          else None
        in
        let buuid =
          if pure then
            Option.map
              (fun prefix ->
                Common_uuid.gen_uuid "builtin-block-uuid"
                  (prefix ^ "-" ^ str_of_value (to_pvalue v')))
              gen_uuid_value_prefix
          else None
        in
        (buuid, props)
      in
      let key : attr =
        match Block_map.string_attr property_map "original-property-id" with
        | Some i -> i
        | None ->
          (match Block_map.string_attr property_map "db/ident" with
           | Some i -> i
           | None -> invalid_arg "Key in map must have a :db/ident")
      in
      let value : value =
        match v_star, v with
        | Set _, Set vlist
          when List.for_all (function Uuid _ -> true | _ -> false) vlist ->
          Set
            (List.map (fun u -> Ref_to (Lookup_ref ("block/uuid", u))) vlist)
        | Set vs, _ ->
          Set
            (List.map
               (fun x ->
                 let buuid, props = value_block_opts x in
                 block_map_value
                   (build_property_value_block ?block_uuid:buuid
                      ?properties:props block' property_map (to_pvalue x)))
               vs)
        | _, Uuid u -> Ref_to (Lookup_ref ("block/uuid", Uuid u))
        | _ ->
          let buuid, props = value_block_opts v_star in
          block_map_value
            (build_property_value_block ?block_uuid:buuid ?properties:props
               block' property_map v)
      in
      (key, value))
    properties

(* property-build/lookup-id? *)
let lookup_id (v : value) : bool =
  match v with
  | Ref_to (Lookup_ref ("block/uuid", Uuid _)) -> true
  | Vector [ Keyword "block/uuid"; Uuid _ ]
  | List [ Keyword "block/uuid"; Uuid _ ] -> true
  | _ -> false

(* :block/uuid out of a value-block map (Map with keyword-or-string keys) *)
let map_block_uuid (v : value) : string option =
  match v with
  | Map kvs ->
    (match
       List.find_opt
         (fun (k, _) -> k = Keyword "block/uuid" || k = String "block/uuid")
         kvs
     with
     | Some (_, Uuid u) -> Some u
     | Some (_, String u) -> Some u
     | _ -> None)
  | _ -> None

(* property-build/build-properties-with-ref-values *)
let build_properties_with_ref_values (prop_vals_tx_m : (attr * value) list)
    : (attr * value) list =
  List.map
    (fun (k, v) ->
      let v' : value =
        match v with
        | Set vs when List.for_all lookup_id vs -> v
        | Set vs ->
          Set
            (List.filter_map
               (fun x ->
                 match map_block_uuid x with
                 | Some u -> Some (Ref_to (Lookup_ref ("block/uuid", Uuid u)))
                 | None -> None)
               vs)
        | _ when lookup_id v -> v
        | _ ->
          (match map_block_uuid v with
           | Some u -> Ref_to (Lookup_ref ("block/uuid", Uuid u))
           | None -> v)
      in
      (k, v'))
    prop_vals_tx_m

(* sqlite-util/build-new-class — adds Tag to :block/tags and extends Root
   when no :logseq.property.class/extends. *)
let build_new_class (block : Block_map.t) : Block_map.t =
  let ident =
    match Block_map.attr_value block "db/ident" with
    | Some (Keyword i) | Some (String i) -> Some i
    | _ -> None
  in
  let tags =
    match Block_map.attr_value block "block/tags" with
    | Some (Set ts) -> Set (ts @ [ Keyword "logseq.class/Tag" ])
    | Some (Vector ts) | Some (List ts) -> Set (ts @ [ Keyword "logseq.class/Tag" ])
    | Some (Keyword t) -> Set [ Keyword t; Keyword "logseq.class/Tag" ]
    | _ -> Set [ Keyword "logseq.class/Tag" ]
  in
  let m = Block_map.put block "block/tags" tags in
  let m =
    if ident <> Some "logseq.class/Root"
       && not (Block_map.mem m "logseq.property.class/extends")
    then Block_map.put m "logseq.property.class/extends" (Keyword "logseq.class/Root")
    else m
  in
  block_with_timestamps m
