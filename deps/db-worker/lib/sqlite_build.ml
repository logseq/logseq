(* Faithful 1:1 port of deps/db/src/logseq/db/sqlite/build.cljs.

   Build-tx construction for EDN options: pages/blocks, user properties,
   classes, auto-created ontology, existing-tx (import) mode.

   cljs keyword-or-string map keys are represented by [pkey]
   (Kkw/Kstr) so qualified-keyword? dispatch stays faithful. cljs
   with-meta flags (::existing-block?, ::new-page?) are carried as
   record fields on [node]. cljs maps are Block_map.t ((attr*value)
   assoc lists, insertion order = cljs map order). Output txs are
   `value` lists of Map entities and bare [:block/uuid u] lookup
   vectors, converted to tx_op by tx_ops_of_values.

   init() wiring: none — called by Sqlite_export (build-import) and
   Endpoint_export (export-edn uses sqlite_export; no dispatcher). *)

open Datascript
module BM = Block_map

exception Build_error of string

let fail (s : string) : 'a = raise (Build_error s)

(* ---- cljs map/value helpers ---- *)

let bm_of_value (v : value) : BM.t =
  match v with
  | Map kvs ->
      List.filter_map
        (fun (k, v) ->
          match k with Keyword a | String a -> Some (a, v) | _ -> None)
        kvs
  | _ -> []

let map_of_bm (m : BM.t) : value =
  Map (List.map (fun (a, v) -> (Keyword a, v)) m)

let is_map = function Map _ -> true | _ -> false
let is_vector = function Vector _ -> true | _ -> false
let is_set = function Set _ -> true | _ -> false

let items_of_set_or_one (v : value) : value list =
  match v with Set vs -> vs | _ -> [ v ]

let coll_items = function
  | Vector vs | List vs | Set vs -> vs
  | _ -> []

let bm_get (m : BM.t) (a : attr) : value = Option.value ~default:Nil (BM.attr_value m a)

let bm_get_opt (m : BM.t) (a : attr) : value option = BM.attr_value m a

let truthy = function Nil | Bool false -> false | _ -> true

let select_keys (m : BM.t) (ks : attr list) : BM.t =
  List.filter (fun (k, _) -> List.mem k ks) m

let rec distinct_by (f : 'a -> 'k) (xs : 'a list) : 'a list =
  match xs with
  | [] -> []
  | x :: tl ->
      if List.exists (fun y -> f y = f x) tl then distinct_by f tl
      else x :: distinct_by f tl

let distinct xs = distinct_by Fun.id xs

(* cljs string/capitalize — first char upper, rest lower *)
let string_capitalize (s : string) : string =
  if s = "" then s
  else
    Unicode.uppercase (String.sub s 0 1)
    ^ Unicode.lowercase (String.sub s 1 (String.length s - 1))

(* cljs (name kw) — after last "/" ; for strings the string itself *)
let name_of_kw (s : string) : string =
  match String.rindex_opt s '/' with
  | Some i -> String.sub s (i + 1) (String.length s - i - 1)
  | None -> s

(* cljs (namespace kw) — before the last "/" *)
let namespace_of (s : string) : string option =
  match String.rindex_opt s '/' with
  | Some i -> Some (String.sub s 0 i)
  | None -> None

(* property/class option keys — cljs keywords or strings *)
type pkey =
  | Kkw of string
  | Kstr of string

let key_of_value : value -> pkey = function
  | Keyword s -> Kkw s
  | String s -> Kstr s
  | v -> invalid_arg ("build options key must be keyword/string, got " ^ Db_property_build.str_of_value v)

let pkey_name (k : pkey) : string = match k with Kkw s | Kstr s -> s

let pkey_value (k : pkey) : value = match k with Kkw s -> Keyword s | Kstr s -> String s

let qualified_kw (k : pkey) : bool =
  match k with Kkw s -> String.contains s '/' | Kstr _ -> false

(* cljs (meta m)-carried flags on build nodes *)
type node =
  { bm : BM.t
  ; existing_block : bool
  ; new_page : bool
  }

let node_of_bm bm = { bm; existing_block = false; new_page = false }

(* {:page map :blocks [map]} entries *)
type pab =
  { page : node
  ; blocks : node list
  }

type options =
  { pages_and_blocks : pab list
  ; properties : (pkey * BM.t) list
  ; classes : (pkey * BM.t) list
  ; graph_namespace : string option
  ; page_id_fn : BM.t -> value
  ; auto_create_ontology : bool
  ; build_existing_tx : bool
  ; extract_content_refs : bool
  ; translate_property_values : bool
  }

let default_options =
  { pages_and_blocks = []
  ; properties = []
  ; classes = []
  ; graph_namespace = None
  ; page_id_fn = (fun m -> bm_get m "db/id")
  ; auto_create_ontology = false
  ; build_existing_tx = false
  ; extract_content_refs = true
  ; translate_property_values = true
  }

(* ---- option input parsing (EDN Map -> options) ---- *)

let pab_of_value (v : value) : pab =
  let m = bm_of_value v in
  let page =
    match BM.attr_value m "page" with
    | Some p -> node_of_bm (bm_of_value p)
    | None -> fail "page-and-block entry missing :page"
  in
  let blocks =
    match BM.attr_value m "blocks" with
    | Some bs -> List.map (fun b -> node_of_bm (bm_of_value b)) (coll_items bs)
    | None -> []
  in
  { page; blocks }

let kv_map_of_value (v : value) : (pkey * BM.t) list =
  match v with
  | Map kvs ->
      List.filter_map
        (fun (k, v) ->
          match k with
          | Keyword _ | String _ -> Some (key_of_value k, bm_of_value v)
          | _ -> None)
        kvs
  | _ -> []

let options_of_value ?(page_id_fn = default_options.page_id_fn) (v : value) : options =
  let m = bm_of_value v in
  let bool_attr a = match BM.attr_value m a with Some (Bool b) -> b | _ -> false in
  { pages_and_blocks =
      (match BM.attr_value m "pages-and-blocks" with
       | Some (Vector vs) | Some (List vs) -> List.map pab_of_value vs
       | _ -> [])
  ; properties =
      (match BM.attr_value m "properties" with
       | Some p -> kv_map_of_value p
       | None -> [])
  ; classes =
      (match BM.attr_value m "classes" with
       | Some c -> kv_map_of_value c
       | None -> [])
  ; graph_namespace =
      (match BM.attr_value m "graph-namespace" with
       | Some (Keyword s) | Some (String s) -> Some s
       | _ -> None)
  ; page_id_fn
  ; auto_create_ontology = bool_attr "auto-create-ontology?"
  ; build_existing_tx = bool_attr "build-existing-tx?"
  ; extract_content_refs =
      (match BM.attr_value m "extract-content-refs?" with
       | Some (Bool b) -> b
       | _ -> true)
  ; translate_property_values =
      (match BM.attr_value m "translate-property-values?" with
       | Some (Bool b) -> b
       | _ -> true)
  }

(* ---- shared helpers ---- *)

(* block-property-value? *)
let block_property_value (v : value) : bool =
  is_map v && truthy (bm_get (bm_of_value v) "build/property-value")

(* page-prop-value? — [:build/page {...}] *)
let page_prop_value (v : value) : bool =
  match v with
  | Vector (Keyword "build/page" :: _) -> true
  | _ -> false

let block_with_timestamps (m : BM.t) : BM.t =
  let now = Common_util.value_of_ms (Date_time_util.time_ms ()) in
  let m =
    if BM.mem m "block/updated-at" then m
    else BM.put m "block/updated-at" now
  in
  if BM.mem m "block/created-at" then m
  else BM.put m "block/created-at" now

(* cljs (meta) ::existing-block? / ::new-page? carried on node *)

let current_db_id = ref 0

let new_db_id () : value =
  decr current_db_id;
  Int !current_db_id

(* translate-property-value *)
let translate_property_value (v : value) (page_uuids : (string * string) list)
    : value =
  match v with
  | Vector (Keyword "build/page" :: [ second ]) ->
      let sm = bm_of_value second in
      let page_name =
        match BM.attr_value sm "build/journal" with
        | Some (Int day) ->
            Date_time_util.int_to_journal_title day "MMM do, yyyy"
        | _ ->
            (match BM.string_attr sm "block/title" with
             | Some t -> t
             | None -> "")
      in
      (match List.assoc_opt page_name page_uuids with
       | Some u -> Vector [ Keyword "block/uuid"; Uuid u ]
       | None ->
           fail ("No uuid for page '" ^ Db_property_build.str_of_value second ^ "'"))
  | Vector (Keyword "block/uuid" :: _) -> v
  | Vector _ -> v
  | _ -> v

(* get-ident *)
let get_ident (all_idents : (pkey * string) list) (k : pkey) : string =
  match k with
  | Kkw s
    when String.contains s '/'
         && ( Db_property.property s
              || (match Db_property.namespace_of s with
                  | Some ns -> Db_class.user_class_namespace ns
                  | None -> false) ) -> s
  | _ ->
      (match List.assoc_opt k all_idents with
       | Some i -> i
       | None -> fail ("No ident found for " ^ pkey_name k))

(* ->block-properties — (pkey*value) list -> (attr*value) list *)
let block_properties_of (properties : (pkey * value) list)
    (page_uuids : (string * string) list) (all_idents : (pkey * string) list)
    ~(translate : bool) : (attr * value) list =
  let translate_property_values v =
    if translate then
      match v with
      | Set vs -> Set (List.map (fun x -> translate_property_value x page_uuids) vs)
      | _ -> translate_property_value v page_uuids
    else v
  in
  List.map
    (fun (k, v) -> (get_ident all_idents k, translate_property_values v))
    properties

(* create-page-uuids — title -> uuid *)
let create_page_uuids (pabs : pab list) : (string * string) list =
  List.filter_map
    (fun (p : pab) ->
      match
        (BM.string_attr p.page.bm "block/title", BM.uuid_attr p.page.bm "block/uuid")
      with
      | Some t, Some u -> Some (t, u)
      | _ -> None)
    pabs

(* build-property-map-for-pvalue-tx — returns Some bm when a property
   value entity should be constructed *)
let build_property_map_for_pvalue_tx (k : pkey) (v : value)
    (new_block : BM.t) (properties_config : (pkey * BM.t) list)
    (all_idents : (pkey * string) list) : BM.t option =
  let no_vector_ref =
    match v with
    | Set (x :: _) -> not (is_vector x)
    | Set [] -> true
    | _ -> not (is_vector v)
  in
  let kn = pkey_name k in
  match Db_property.built_in_property_schema_type kn with
  | Some built_in_type ->
      if List.mem built_in_type Db_property_build.value_ref_property_types
         && (match Db_property.built_in_property kn with
             | Some p -> p.Db_property.bip_closed_values = []
             | None -> true)
      then
        Some
          [ "db/ident", pkey_value k
          ; "logseq.property/type", Keyword built_in_type ]
      else
        (let ref_types =
           match BM.attr_value new_block "build/properties-ref-types" with
           | Some m -> bm_of_value m
           | None -> [ "entity", Keyword "number" ]
         in
         match
           List.find_map
             (fun (a, t) -> if a = built_in_type then Some t else None)
             ref_types
         with
         | Some (Keyword t') when no_vector_ref ->
             Some
               [ "db/ident", pkey_value k
               ; "logseq.property/type", Keyword t' ]
         | _ -> None)
  | None ->
      let prop_type =
        match List.assoc_opt k properties_config with
        | Some prop ->
            (match BM.attr_value prop "logseq.property/type" with
             | Some (Keyword t) -> Some t
             | _ -> None)
        | None -> None
      in
      (match prop_type with
       | Some t
         when List.mem t Db_property_build.value_ref_property_types
              && no_vector_ref ->
           Some
             [ "db/ident", Keyword (get_ident all_idents k)
             ; "original-property-id", pkey_value k
             ; "logseq.property/type", Keyword t ]
       | _ -> None)

(* build-pvalue — {:attributes <map or absent> :value <v>} as Map value *)
let rec build_pvalue (properties_config : (pkey * BM.t) list)
    (all_idents : (pkey * string) list) (closed_value_id : value option)
    (v : value) : value =
  let vm = bm_of_value v in
  let pvalue_uuid =
    match BM.uuid_attr vm "block/uuid" with
    | Some u -> u
    | None -> Common_uuid.new_block_id ()
  in
  let nested_pvalue_tx_m =
    match BM.attr_value vm "build/properties" with
    | Some (Map _ as props) ->
        let m =
          property_value_tx_m
            [ "block/uuid", Uuid pvalue_uuid ]
            (kv_pairs_of_bm props)
            properties_config all_idents
        in
        (* add :db/id to ensure datascript consistently creates this new tx *)
        List.map
          (fun (k', pv) ->
            let pv' =
              match pv with
              | Map _ -> map_of_bm (BM.put (bm_of_value pv) "db/id" (new_db_id ()))
              | Set vs ->
                  Set
                    (List.map
                       (fun x ->
                         if is_map x then
                           map_of_bm (BM.put (bm_of_value x) "db/id" (new_db_id ()))
                         else x)
                       vs)
              | _ -> pv
            in
            (k', pv'))
          m
    | _ -> []
  in
  let attributes =
    if truthy (bm_get vm "build/property-value") then
      let base =
        match BM.attr_value vm "build/properties" with
        | Some (Map _ as props) -> List.map (fun (k, v) -> (pkey_name k, v)) (kv_pairs_of_bm props)
        | _ -> []
      in
      let tags =
        match BM.attr_value vm "build/tags" with
        | Some ts ->
            Vector
              (List.map
                 (fun t ->
                   Map
                     [ ( Keyword "db/ident"
                       , Keyword (get_ident all_idents (key_of_value t)) ) ])
                 (coll_items ts))
        | None -> Nil
      in
      let m =
        BM.merge
          (BM.merge base nested_pvalue_tx_m
           |> fun m -> BM.put m "block/tags" tags)
          (BM.merge
             (select_keys vm
                [ "block/created-at"; "block/updated-at"; "build/children" ])
             [ "block/uuid", Uuid pvalue_uuid ])
      in
      Some (map_of_bm m)
    else None
  in
  let value' =
    match closed_value_id with
    | Some c -> c
    | None ->
        if truthy (bm_get vm "build/property-value") then
          (match BM.attr_value vm "logseq.property/value" with
           | Some x -> x
           | None ->
               (match BM.attr_value vm "block/title" with
                | Some x -> x
                | None -> Nil))
        else v
  in
  Map
    [ ( Keyword "attributes"
      , match attributes with Some m -> m | None -> Nil )
    ; (Keyword "value", value') ]

(* ->property-value-tx-m — (pkey*value) list -> (attr*value) tx-map *)
and property_value_tx_m (new_block : BM.t) (properties : (pkey * value) list)
    (properties_config : (pkey * BM.t) list) (all_idents : (pkey * string) list)
    : (attr * value) list =
  let pairs =
    List.filter_map
      (fun (k, v) ->
        match
          build_property_map_for_pvalue_tx k v new_block properties_config
            all_idents
        with
        | Some property_map ->
            let property =
              match k with
              | Kkw _ -> List.assoc_opt k properties_config
              | Kstr _ -> List.assoc_opt k properties_config
            in
            let closed_value_id =
              match property with
              | Some prop ->
                  (match BM.attr_value prop "build/closed-values" with
                   | Some cvs ->
                       List.find_map
                         (fun item ->
                           let im = bm_of_value item in
                           match
                             ( BM.attr_value im "value"
                             , BM.attr_value im "uuid" )
                           with
                           | Some iv, Some u when Util.value_equal iv v -> Some u
                           | _ -> None)
                         (coll_items cvs)
                   | None -> None)
              | None -> None
            in
            let build_pvalue' x =
              build_pvalue properties_config all_idents closed_value_id x
            in
            let v' =
              match v with
              | Set vs -> Set (List.map build_pvalue' vs)
              | _ -> build_pvalue' v
            in
            Some (map_of_bm property_map, v')
        | None -> None)
      properties
  in
  Db_property_build.build_property_values_tx_m ~pvalue_map:true new_block pairs

(* (pkey*value) list of a bm's "build/properties" attr-map *)
and kv_pairs_of_bm (v : value) : (pkey * value) list =
  match v with
  | Map kvs ->
      List.filter_map
        (fun (k, v) ->
          match k with
          | Keyword _ | String _ -> Some (key_of_value k, v)
          | _ -> None)
        kvs
  | _ -> []

(* build/properties of a bm node *)
let build_properties_of_node (m : BM.t) : (pkey * value) list =
  match BM.attr_value m "build/properties" with
  | Some p -> kv_pairs_of_bm p
  | None -> []

(* extract-basic-content-refs — [[x]] refs from a title *)
let page_ref_re = Regexp.compile "\\[\\[(.*?)\\]\\]"

let extract_basic_content_refs (s : string) : string list =
  if String.length s >= 2 && String.sub s 0 2 = "{{" then []
  else
    let rec loop pos acc =
      match Regexp.exec ~pos page_ref_re s with
      | None -> List.rev acc
      | Some m ->
          (match m.Regexp.groups with
           | [| _; Some g |] -> loop m.Regexp.last (g :: acc)
           | _ -> loop m.Regexp.last acc)
    in
    loop 0 []

(* expand-build-children — flatten children, set parent refs + uuids.
   cljs meta ::existing-block? -> node.existing_block *)
let rec expand_build_children ?(parent_id : string option) (data : node list)
    : node list =
  List.concat_map
    (fun (block : node) ->
      let bm', existing =
        match BM.attr_value block.bm "block/uuid" with
        | Some _ -> (block.bm, true)
        | None ->
            (BM.put block.bm "block/uuid" (Uuid (Common_uuid.new_block_id ())), false)
      in
      let bm'' =
        BM.dissoc bm' [ "build/children" ]
        |> fun m ->
           match parent_id with
           | Some pid ->
               BM.put m "block/parent"
                 (Map
                    [ ( Keyword "db/id"
                      , Vector [ Keyword "block/uuid"; Uuid pid ] ) ])
           | None -> m
      in
      let children =
        match BM.attr_value block.bm "build/children" with
        | Some cs ->
            expand_build_children
              ?parent_id:(BM.uuid_attr bm'' "block/uuid")
              (List.map (fun c -> node_of_bm (bm_of_value c)) (coll_items cs))
        | None -> []
      in
      { bm = bm''; existing_block = existing; new_page = false } :: children)
    data

(* pvalue-tx->txs and block-tx are mutually recursive *)
let rec pvalue_tx_to_txs (pvalue_tx_m : (attr * value) list)
    (page_uuids : (string * string) list) (all_idents : (pkey * string) list)
    (options : options) : value list =
  List.concat_map
    (fun pvalue ->
      if is_map pvalue then
        let pm = bm_of_value pvalue in
        let children_tx =
          match BM.attr_value pm "build/children" with
          | Some cs when coll_items cs <> [] ->
              let children' =
                expand_build_children
                  ?parent_id:(BM.uuid_attr pm "block/uuid")
                  (List.map (fun c -> node_of_bm (bm_of_value c)) (coll_items cs))
              in
              List.concat_map
                (fun (c : node) ->
                  block_tx c page_uuids all_idents (bm_get pm "block/page") options)
                children'
          | _ -> []
        in
        map_of_bm (BM.dissoc pm [ "build/children" ]) :: children_tx
      else [ pvalue ])
    (List.concat_map items_of_set_or_one
       (List.map snd pvalue_tx_m))

(* ->block-tx *)
and block_tx (m : node) (page_uuids : (string * string) list)
    (all_idents : (pkey * string) list) (page_id : value) (options : options)
    : value list =
  let build_existing' =
    options.build_existing_tx && m.existing_block
    && not (truthy (bm_get m.bm "build/keep-uuid?"))
  in
  let block =
    if build_existing' then select_keys m.bm [ "block/uuid" ]
    else
      [ "db/id", new_db_id ()
      ; ( "block/page", Map [ (Keyword "db/id", page_id) ] )
      ; "block/order", String (Db_order.gen_key_from_max ())
      ; ( "block/parent"
        , match BM.attr_value m.bm "block/parent" with
          | Some p -> p
          | None -> Map [ (Keyword "db/id", page_id) ] ) ]
  in
  let properties = build_properties_of_node m.bm in
  let pvalue_tx_m =
    property_value_tx_m block properties options.properties all_idents
  in
  let ref_strings =
    if options.extract_content_refs then
      match BM.string_attr m.bm "block/title" with
      | Some t -> extract_basic_content_refs t
      | None -> []
    else []
  in
  let pvalue_txs =
    if pvalue_tx_m <> [] then
      pvalue_tx_to_txs pvalue_tx_m page_uuids all_idents options
    else []
  in
  let final_block =
    BM.merge
      (if build_existing' then
         [ "block/updated-at", Common_util.value_of_ms (Date_time_util.time_ms ()) ]
       else block_with_timestamps block)
      (BM.merge
         (BM.dissoc m.bm
            [ "build/properties"; "build/tags"; "build/keep-uuid?" ])
         (BM.merge
            (if properties <> [] then
               block_properties_of
                 (build_properties_of_node m.bm
                  @ List.map
                      (fun (k, v) -> (Kkw k, v))
                      (Db_property_build.build_properties_with_ref_values
                         pvalue_tx_m))
                 page_uuids all_idents
                 ~translate:options.translate_property_values
             else [])
            (BM.merge
               (match BM.attr_value m.bm "build/tags" with
                | Some ts ->
                    [ ( "block/tags"
                      , Vector
                          (List.map
                             (fun t ->
                               Map
                                 [ ( Keyword "db/ident"
                                   , Keyword
                                       (get_ident all_idents (key_of_value t))
                                   ) ])
                             (coll_items ts)) ) ]
                | None -> [])
               (if ref_strings <> [] then
                  let block_refs =
                    List.map
                      (fun s ->
                        if Ldb.is_uuid_string s then
                          Map [ (Keyword "block/uuid", Uuid s) ]
                        else
                          Map
                            [ ( Keyword "block/uuid"
                              , Uuid
                                  (match List.assoc_opt s page_uuids with
                                   | Some u -> u
                                   | None ->
                                       fail
                                         ("No uuid for page ref name " ^ s)) )
                            ; (Keyword "block/title", String s) ])
                      ref_strings
                  in
                  let title =
                    match BM.string_attr m.bm "block/title" with
                    | Some t -> t
                    | None -> ""
                  in
                  [ ( "block/title"
                    , String
                        (Db_content.title_ref_to_id_ref ~replace_tag:false
                           title block_refs) )
                  ; ("block/refs", Vector block_refs) ]
                else []))))
  in
  pvalue_txs @ [ map_of_bm final_block ]

(* build-property-tx — tx for one :properties entry *)
let build_property_tx (properties : (pkey * BM.t) list)
    (page_uuids : (string * string) list) (all_idents : (pkey * string) list)
    (property_db_ids : (pkey * value) list)
    (class_property_orders : (pkey * string) list) (options : options)
    ((prop_name, prop_m) : pkey * BM.t) : value list =
  let class_property_order = List.assoc_opt prop_name class_property_orders in
  let property_classes =
    match BM.attr_value prop_m "build/property-classes" with
    | Some cs -> coll_items cs
    | None -> []
  in
  let select =
    select_keys prop_m
      [ "build/properties-ref-types"; "block/created-at";
        "block/updated-at"; "block/collapsed?"; "block/alias" ]
  in
  let new_block, additional_tx =
    let closed_values =
      match BM.attr_value prop_m "build/closed-values" with
      | Some cvs ->
          List.map
            (fun item ->
              bm_of_value item
              |> fun m ->
                 if BM.mem m "uuid" then m
                 else BM.put m "uuid" (Uuid (Common_uuid.new_block_id ())))
            (coll_items cvs)
      | None -> []
    in
    if closed_values <> [] then
      let db_ident = get_ident all_idents prop_name in
      let prop_with_cv =
        BM.put
          (BM.put prop_m "db/ident" (Keyword db_ident))
          "closed-values"
          (Vector (List.map map_of_bm closed_values))
      in
      let property_attributes =
        BM.merge
          [ ( "db/id"
            , match List.assoc_opt prop_name property_db_ids with
              | Some id -> id
              | None -> fail "No :db/id for property" ) ]
          (BM.merge
             (match class_property_order with
              | Some o -> [ "block/order", String o ]
              | None -> [])
             select)
      in
      match
        Db_property_build.build_closed_values db_ident
          (match BM.string_attr prop_m "block/title" with
           | Some t -> t
           | None -> pkey_name prop_name)
          prop_with_cv ~property_attributes:(Some property_attributes)
      with
      | nb :: rest -> (nb, List.map map_of_bm rest)
      | [] -> fail "build-closed-values returned empty"
    else
      let m =
        Db_property_build.build_new_property
          ~db_ident:(get_ident all_idents prop_name)
          ~prop_schema:(Db_property.get_property_schema prop_m)
          ?block_uuid:(BM.uuid_attr prop_m "block/uuid")
          ?title:(BM.string_attr prop_m "block/title")
          ()
        |> fun b ->
           BM.put b "db/id"
             (match List.assoc_opt prop_name property_db_ids with
              | Some id -> id
              | None -> fail "No :db/id for property")
        |> fun b -> BM.merge b select
        |> fun b ->
           match class_property_order with
           | Some o -> BM.put b "block/order" (String o)
           | None -> b
      in
      (m, [])
  in
  let pvalue_tx_m =
    property_value_tx_m new_block
      (build_properties_of_node prop_m)
      properties all_idents
  in
  let pvalue_txs =
    if pvalue_tx_m <> [] then
      pvalue_tx_to_txs pvalue_tx_m page_uuids all_idents options
    else []
  in
  let block_props =
    match build_properties_of_node prop_m with
    | [] -> []
    | props ->
        block_properties_of
          (props
           @ List.map
               (fun (k, v) -> (Kkw k, v))
               (Db_property_build.build_properties_with_ref_values pvalue_tx_m))
          page_uuids all_idents
          ~translate:options.translate_property_values
  in
  let classes_attr =
    if property_classes <> [] then
      [ ( "logseq.property/classes"
        , Vector
            (List.map
               (fun c ->
                 Map
                   [ ( Keyword "db/ident"
                     , Keyword (get_ident all_idents (key_of_value c)) ) ])
               property_classes) ) ]
    else []
  in
  pvalue_txs
  @ [ map_of_bm
        (BM.merge
           (BM.dissoc new_block [ "build/properties-ref-types" ])
           (BM.merge block_props classes_attr)) ]
  @ additional_tx

(* class-properties->ordered-properties — Kahn topo sort with
   first-seen input order as tie-break. Returns property keys ordered. *)
let class_properties_ordered (classes : (pkey * BM.t) list) : pkey list =
  let class_properties =
    List.filter_map
      (fun (_, m) ->
        match BM.attr_value m "build/class-properties" with
        | Some vs -> Some (List.map key_of_value (coll_items vs))
        | None -> None)
      classes
  in
  let all_properties = distinct (List.concat class_properties) in
  let index_of k =
    let rec go i = function
      | p :: _ when p = k -> i
      | _ :: tl -> go (i + 1) tl
      | [] -> fail "property not in index"
    in
    go 0 all_properties
  in
  let sort_by_input_order ks = List.sort (fun a b -> index_of a - index_of b) ks in
  (* adjacent pairs -> edges (dedup'd) *)
  let edges =
    class_properties
    |> List.concat_map (fun ps ->
           let rec pairs = function
             | a :: (b :: _ as tl) ->
                 if a = b then pairs tl else (a, b) :: pairs tl
             | _ -> []
           in
           pairs ps)
    |> distinct
  in
  let outgoing =
    List.fold_left
      (fun acc (l, r) ->
        let cur = try List.assoc l acc with Not_found -> [] in
        (l, cur @ [ (l, r) ]) :: List.remove_assoc l acc)
      [] edges
  in
  let incoming =
    List.fold_left
      (fun acc (_, r) ->
        let c = try List.assoc r acc with Not_found -> 0 in
        (r, c + 1) :: List.remove_assoc r acc)
      (List.map (fun p -> (p, 0)) all_properties)
      edges
  in
  let incoming_of k m = try List.assoc k m with Not_found -> 0 in
  let initial_queue = List.filter (fun p -> incoming_of p incoming = 0) all_properties
                      |> sort_by_input_order in
  let rec loop ordered queue inc =
    match queue with
    | [] ->
        if List.length ordered <> List.length all_properties then
          fail
            (Printf.sprintf
               "Cycle detected in :build/class-properties constraints. Ordered %d of %d properties."
               (List.length ordered) (List.length all_properties))
        else ordered
    | property :: rest ->
        let next_incoming, unlocked =
          List.fold_left
            (fun (inc', unlocked') (_, next_property) ->
              let nc = incoming_of next_property inc' - 1 in
              let inc'' = (next_property, nc) :: List.remove_assoc next_property inc' in
              (inc'', if nc = 0 then unlocked' @ [ next_property ] else unlocked'))
            (inc, []) (try List.assoc property outgoing with Not_found -> [])
        in
        let next_queue = sort_by_input_order (rest @ unlocked) in
        loop (ordered @ [ property ]) next_queue next_incoming
  in
  loop [] initial_queue incoming

(* effective-class-extends *)
let effective_class_extends (class_config : BM.t) : pkey list =
  match BM.attr_value class_config "build/class-parent" with
  | Some p -> [ key_of_value p ]
  | None ->
      (match BM.attr_value class_config "build/class-extends" with
       | Some cs -> List.map key_of_value (coll_items cs)
       | None -> [])

(* build-class-extends *)
let build_class_extends (class_config : BM.t)
    (class_db_ids : (pkey * value) list) : value list option =
  if BM.mem class_config "build/class-parent" then
    Printf.eprintf "Warning: :build/class-parent is deprecated and will be removed soon.\n%!";
  match effective_class_extends class_config with
  | [] -> None
  | extends' ->
      Some
        (List.map
           (fun c ->
             match List.assoc_opt c class_db_ids with
             | Some id -> id
             | None ->
                 if
                   match c with
                   | Kkw s ->
                       (match namespace_of s with
                        | Some ns -> Ns_util.str_contains ns ".class"
                        | None -> false)
                   | Kstr _ -> false
                 then pkey_value c
                 else fail ("No :db/id for " ^ pkey_name c))
           extends')

(* validate-class-extends-acyclic! *)
let validate_class_extends_acyclic (classes : (pkey * BM.t) list)
    (all_idents : (pkey * string) list) : unit =
  if
    List.exists (fun (_, c) -> effective_class_extends c <> []) classes
  then begin
    let class_idents =
      List.map (fun (k, _) -> get_ident all_idents k) classes
    in
    let edges =
      List.concat_map
        (fun (k, cfg) ->
          let class_ident = get_ident all_idents k in
          List.filter_map
            (fun parent ->
              let parent_ident = get_ident all_idents parent in
              if List.mem parent_ident class_idents then
                Some (class_ident, parent_ident)
              else None)
            (effective_class_extends cfg))
        classes
    in
    let outgoing =
      List.fold_left
        (fun acc (ci, pi) ->
          let cur = try List.assoc ci acc with Not_found -> [] in
          (ci, cur @ [ pi ]) :: List.remove_assoc ci acc)
        [] edges
    and incoming =
      List.fold_left
        (fun acc (_, pi) ->
          let c = try List.assoc pi acc with Not_found -> 0 in
          (pi, c + 1) :: List.remove_assoc pi acc)
        (List.map (fun i -> (i, 0)) class_idents)
        edges
    in
    let queue0 =
      List.filter (fun i -> (try List.assoc i incoming with Not_found -> 0) = 0)
        class_idents
    in
    let rec loop queue idx inc =
      if idx < List.length queue then begin
        let ci = List.nth queue idx in
        let inc', unlocked =
          List.fold_left
            (fun (inc'', unlocked') pi ->
              let nc = (try List.assoc pi inc'' with Not_found -> 0) - 1 in
              ( (pi, nc) :: List.remove_assoc pi inc''
              , if nc = 0 then unlocked' @ [ pi ] else unlocked' ))
            (inc, [])
            (try List.assoc ci outgoing with Not_found -> [])
        in
        loop (queue @ unlocked) (idx + 1) inc'
      end else if idx <> List.length class_idents then
        fail "Cycle detected in :build/class-extends"
    in
    loop queue0 0 incoming
  end

(* build-classes-tx *)
let build_classes_tx (classes : (pkey * BM.t) list)
    (properties_config : (pkey * BM.t) list) (uuid_maps : (string * string) list)
    (all_idents : (pkey * string) list) (options : options) : value list =
  let classes' =
    if options.build_existing_tx then
      List.filter
        (fun (_, v) ->
          not
            (BM.mem v "block/uuid"
             && not (truthy (bm_get v "build/keep-uuid?"))))
        classes
    else classes
  in
  let class_db_ids =
    List.map (fun (k, _) -> (k, new_db_id ())) classes'
  in
  List.concat_map
    (fun (class_name, class_m) ->
      let db_ident = get_ident all_idents class_name in
      let class_properties =
        match BM.attr_value class_m "build/class-properties" with
        | Some vs -> List.map key_of_value (coll_items vs)
        | None -> []
      in
      let title =
        match BM.string_attr class_m "block/title" with
        | Some t -> t
        | None -> name_of_kw (pkey_name class_name)
      in
      let uuid =
        match BM.uuid_attr class_m "block/uuid" with
        | Some u -> u
        | None -> Common_uuid.gen_uuid "db-ident-block-uuid" db_ident
      in
      let new_block =
        Db_property_build.build_new_class
          [ "block/name", String (Ldb.page_name_sanity_lc title)
          ; "block/title", String title
          ; "block/uuid", Uuid uuid
          ; "db/ident", Keyword db_ident
          ; ( "db/id"
            , match List.assoc_opt class_name class_db_ids with
              | Some id -> id
              | None -> fail "No :db/id for class" ) ]
      in
      let pvalue_tx_m =
        property_value_tx_m new_block
          (build_properties_of_node class_m)
          properties_config all_idents
      in
      let pvalue_txs =
        if pvalue_tx_m <> [] then
          pvalue_tx_to_txs pvalue_tx_m uuid_maps all_idents options
        else []
      in
      let block_props =
        match build_properties_of_node class_m with
        | [] -> []
        | props ->
            block_properties_of
              (props
               @ List.map
                   (fun (k, v) -> (Kkw k, v))
                   (Db_property_build.build_properties_with_ref_values
                      pvalue_tx_m))
              uuid_maps all_idents
              ~translate:options.translate_property_values
      in
      let extends_attr =
        match build_class_extends class_m class_db_ids with
        | Some xs -> [ "logseq.property.class/extends", Vector xs ]
        | None -> []
      in
      let class_props_attr =
        if class_properties <> [] then
          [ ( "logseq.property.class/properties"
            , Vector
                (List.map
                   (fun p ->
                     Map
                       [ ( Keyword "db/ident"
                         , Keyword (get_ident all_idents p) ) ])
                   class_properties) ) ]
        else []
      in
      let m =
        BM.merge new_block
          (BM.merge
             (BM.dissoc class_m
                [ "build/properties"; "build/class-extends";
                  "build/class-parent"; "build/class-properties";
                  "build/keep-uuid?" ])
             (BM.merge block_props (BM.merge extends_attr class_props_attr)))
      in
      pvalue_txs @ [ map_of_bm m ])
    classes'

(* build-properties-tx *)
let build_properties_tx (properties : (pkey * BM.t) list)
    (classes : (pkey * BM.t) list) (page_uuids : (string * string) list)
    (all_idents : (pkey * string) list) (options : options) : value list =
  let properties' =
    if options.build_existing_tx then
      List.filter
        (fun (_, v) ->
          not
            (BM.mem v "block/uuid"
             && not (truthy (bm_get v "build/keep-uuid?"))))
        properties
    else properties
  in
  let ordered = class_properties_ordered classes in
  let order_keys = Db_order.gen_n_keys (List.length ordered) None None in
  let class_property_orders = List.combine ordered order_keys in
  let property_db_ids =
    List.map (fun (k, _) -> (k, new_db_id ())) properties'
  in
  let new_properties_tx =
    List.concat_map
      (build_property_tx properties page_uuids all_idents property_db_ids
         class_property_orders options)
      properties'
  in
  let existing_property_orders_tx =
    List.filter_map
      (fun (k, o) ->
        if List.mem_assoc k properties' then None
        else
          Some
            (map_of_bm
               [ "db/ident", pkey_value k; "block/order", String o ]))
      class_property_orders
  in
  new_properties_tx @ existing_property_orders_tx

(* ---- page/block top level ---- *)

let build_page_tx (page : BM.t) (all_idents : (pkey * string) list)
    (page_uuids : (string * string) list) (properties : (pkey * BM.t) list)
    (options : options) ~(build_existing : bool) : value list =
  let page' =
    BM.dissoc page
      [ "build/tags"; "build/properties"; "build/keep-uuid?" ]
  in
  let pvalue_tx_m =
    property_value_tx_m page'
      (build_properties_of_node page)
      properties all_idents
  in
  let pvalue_txs =
    if pvalue_tx_m <> [] then
      pvalue_tx_to_txs pvalue_tx_m page_uuids all_idents options
    else []
  in
  let block_props =
    match build_properties_of_node page with
    | [] -> []
    | props ->
        block_properties_of
          (props
           @ List.map
               (fun (k, v) -> (Kkw k, v))
               (Db_property_build.build_properties_with_ref_values pvalue_tx_m))
          page_uuids all_idents
          ~translate:options.translate_property_values
  in
  let tag_idents =
    match BM.attr_value page "build/tags" with
    | Some ts ->
        List.map
          (fun t -> get_ident all_idents (key_of_value t))
          (coll_items ts)
    | None -> []
  in
  let tags_attr =
    if tag_idents = [] then []
    else
      [ ( "block/tags"
        , Vector
            (List.map (fun i -> Map [ (Keyword "db/ident", Keyword i) ]) tag_idents
             @ (if
                  List.for_all
                    (fun i -> not (List.mem i Db_class.page_classes))
                    tag_idents
                then [ Keyword "logseq.class/Page" ]
                else [])) ) ]
  in
  let m =
    BM.merge
      (if build_existing then
         [ "block/updated-at", Common_util.value_of_ms (Date_time_util.time_ms ()) ]
       else
         select_keys (block_with_timestamps page')
           [ "block/created-at"; "block/updated-at" ])
      (BM.merge page' (BM.merge block_props tags_attr))
  in
  pvalue_txs @ [ map_of_bm m ]

(* build-pages-and-blocks-tx *)
let build_pages_and_blocks_tx (pabs : pab list)
    (all_idents : (pkey * string) list) (page_uuids : (string * string) list)
    (options : options) : value list =
  List.concat_map
    (fun (pab : pab) ->
      let build_existing' =
        options.build_existing_tx && not pab.page.new_page
        && not (truthy (bm_get pab.page.bm "build/keep-uuid?"))
      in
      let page' =
        if build_existing' then pab.page.bm
        else
          BM.merge
            [ ( "db/id"
              , match BM.attr_value pab.page.bm "db/id" with
                | Some id -> id
                | None -> new_db_id () )
            ; ( "block/title"
              , match BM.attr_value pab.page.bm "block/title" with
                | Some t -> t
                | None ->
                    (match BM.string_attr pab.page.bm "block/name" with
                     | Some n -> String (string_capitalize n)
                     | None -> String "") )
            ; ( "block/name"
              , match BM.attr_value pab.page.bm "block/name" with
                | Some n -> n
                | None ->
                    (match BM.string_attr pab.page.bm "block/title" with
                     | Some t -> String (Ldb.page_name_sanity_lc t)
                     | None -> String "") )
            ; "block/tags", Set [ Keyword "logseq.class/Page" ] ]
            (BM.dissoc pab.page.bm
               [ "db/id"; "block/name"; "block/title" ])
      in
      let page_id (m : BM.t) : value =
        if options.build_existing_tx && not pab.page.new_page then
          Vector [ Keyword "block/uuid"; bm_get m "block/uuid" ]
        else options.page_id_fn m
      in
      let page_tx =
        if
          build_existing'
          && BM.attr_value page' "build/properties" = None
          && BM.attr_value page' "build/tags" = None
        then
          [ map_of_bm
              (select_keys pab.page.bm
                 [ "block/uuid"; "block/created-at"; "block/updated-at" ]) ]
        else
          build_page_tx page' all_idents page_uuids options.properties
            { options with build_existing_tx = build_existing' }
            ~build_existing:build_existing'
      in
      page_tx
      @ List.concat_map
          (fun (b : node) ->
            block_tx b page_uuids all_idents (page_id page') options)
          pab.blocks)
    pabs

(* split-blocks-tx — (init-tx, block-props-tx). Tx maps that carry
   property-ident attrs (with :db/cardinality schema or declared in
   :properties) are split: base attrs transact first, property attrs
   after as {:block/uuid ... <props>}. *)
let split_blocks_tx (blocks_tx : value list) (properties : (pkey * BM.t) list)
    : value list * value list =
  let property_idents : string list =
    List.filter_map
      (fun v ->
        if is_map v then
          let m = bm_of_value v in
          match BM.attr_value m "db/cardinality", BM.attr_value m "db/ident" with
          | Some _, Some (Keyword i) | Some _, Some (String i) -> Some i
          | _ -> None
        else None)
      blocks_tx
    @ List.map (fun (k, _) -> pkey_name k) properties
  in
  let props_of (m : BM.t) = List.filter (fun (a, _) -> List.mem a property_idents) m in
  List.fold_left
    (fun (init_tx, block_props_tx) v ->
      if is_map v then
        let m = bm_of_value v in
        let props = props_of m in
        ( init_tx @ [ map_of_bm (BM.dissoc m property_idents) ]
        , if props <> [] then
            block_props_tx
            @ [ map_of_bm
                  (BM.merge
                     [ ( "block/uuid"
                       , match BM.attr_value m "block/uuid" with
                         | Some u -> u
                         | None ->
                             fail "No :block/uuid for block" ) ]
                     props) ]
          else block_props_tx )
      else (init_tx @ [ v ], block_props_tx))
    ([], []) blocks_tx

(* add-new-pages-from-refs — [[name]] refs in top-level block titles
   auto-create pages *)
let add_new_pages_from_refs (pabs : pab list) : pab list =
  let existing_pages =
    List.filter_map (fun p -> BM.string_attr p.page.bm "block/title") pabs
  in
  let new_pages =
    pabs
    |> List.concat_map (fun p ->
           List.concat_map
             (fun (b : node) ->
               match BM.string_attr b.bm "block/title" with
               | Some t -> extract_basic_content_refs t
               | None -> [])
             p.blocks)
    |> List.filter (fun s -> not (Ldb.is_uuid_string s))
    |> List.filter (fun s -> not (List.mem s existing_pages))
    |> distinct
    |> List.map (fun title ->
           { page =
               node_of_bm [ "block/title", String title ]
           ; blocks = [] })
  in
  new_pages @ pabs

(* add-new-pages-from-properties — page-prop-value pages referenced in
   property values become real pages (prepended) *)
let get_used_properties (pabs : pab list) (properties : (pkey * BM.t) list)
    (classes : (pkey * BM.t) list) : (pkey * value) list =
  let rec node_props (nodes : node list) : (pkey * value) list =
    List.concat_map
      (fun (n : node) ->
        let props = build_properties_of_node n.bm in
        let nested =
          List.concat_map
            (fun (_, v) ->
              List.filter_map
                (fun x ->
                  if page_prop_value x then
                    (match x with
                     | Vector [ _; second ] -> Some second
                     | _ -> None)
                  else if block_property_value x then Some x
                  else None)
                (items_of_set_or_one v))
            props
        in
        match List.map bm_of_value nested |> List.map node_of_bm with
        | [] -> props
        | nested_nodes -> props @ node_props nested_nodes)
      nodes
  in
  let page_block_properties =
    pabs
    |> List.concat_map (fun p -> node_props (p.blocks @ [ p.page ]))
    |> distinct
  in
  let property_properties =
    List.concat_map
      (fun (_, m) -> build_properties_of_node m)
      properties
  in
  let class_properties =
    List.concat_map
      (fun (_, m) ->
        (match BM.attr_value m "build/class-properties" with
         | Some vs ->
             List.map (fun p -> (key_of_value p, Keyword ":no-value")) (coll_items vs)
         | None -> [])
        @ build_properties_of_node m)
      classes
    |> distinct
  in
  page_block_properties @ class_properties @ property_properties

let add_new_pages_from_properties (properties : (pkey * BM.t) list)
    (pabs : pab list) : pab list =
  let used_properties =
    get_used_properties pabs properties []
  in
  let existing_pages =
    List.filter_map
      (fun p ->
        match
          ( BM.attr_value p.page.bm "build/journal"
          , BM.attr_value p.page.bm "block/title" )
        with
        | None, None -> None
        | j, t -> Some (j, t))
      pabs
  in
  let new_pages =
    List.concat_map
      (fun (_, v) ->
        List.filter_map
          (fun x ->
            match x with
            | Vector [ Keyword "build/page"; m ] ->
                let pm = bm_of_value m in
                let key' =
                  ( BM.attr_value pm "build/journal"
                  , BM.attr_value pm "block/title" )
                in
                if List.mem key' existing_pages then None
                else Some { page = node_of_bm pm; blocks = [] }
            | _ -> None)
          (items_of_set_or_one v))
      used_properties
    |> distinct_by (fun p -> p.page.bm)
  in
  new_pages @ pabs

(* pre-build-pages-and-blocks *)
let pre_build_pages_and_blocks (pabs : pab list)
    (properties : (pkey * BM.t) list) ~(extract_content_refs : bool) : pab list =
  let ensure_page_uuids (p : pab) : pab =
    if BM.mem p.page.bm "block/uuid" then p
    else
      { p with
        page =
          { bm = BM.put p.page.bm "block/uuid" (Uuid (Common_uuid.new_block_id ()))
          ; existing_block = p.page.existing_block
          ; new_page = true } }
  in
  let expand_block_children (p : pab) : pab =
    if p.blocks <> [] then { p with blocks = expand_build_children p.blocks }
    else p
  in
  let expand_journal (p : pab) : pab =
    match BM.attr_value p.page.bm "build/journal" with
    | Some (Int date_int) ->
        let page_name =
          Date_time_util.int_to_journal_title date_int "MMM do, yyyy"
        in
        let bm =
          BM.dissoc p.page.bm [ "build/journal" ]
          |> fun m ->
             BM.merge m
               [ "block/journal-day", Int date_int
               ; "block/title", String page_name
               ; ( "block/uuid"
                 , match BM.attr_value m "block/uuid" with
                   | Some u -> u
                   | None ->
                       Uuid
                         (Common_uuid.gen_journal_page_uuid date_int) )
               ; "block/tags", Keyword "logseq.class/Journal" ]
        in
        { p with
          page =
            { bm
            ; existing_block = p.page.existing_block
            ; new_page = not (BM.mem p.page.bm "block/uuid") } }
    | _ -> p
  in
  let pages =
    add_new_pages_from_properties properties pabs
    |> List.map expand_journal
    |> List.map expand_block_children
  in
  let pages =
    if extract_content_refs then add_new_pages_from_refs pages else pages
  in
  List.map ensure_page_uuids pages

(* infer-property-schema *)
let infer_property_schema (pair_values : value list) : BM.t =
  let prop_value =
    List.find_opt (fun v -> v <> Keyword ":no-value") pair_values
  in
  let prop_value' =
    match prop_value with
    | Some (Set (x :: _)) -> Some x
    | Some v -> Some v
    | None -> None
  in
  let prop_type =
    match prop_value' with
    | Some pv ->
        if page_prop_value pv then
          (match pv with
           | Vector [ _; m ] when BM.mem (bm_of_value m) "build/journal" -> "date"
           | _ -> "node")
        else
          (match pv with
           | Int _ | Float _ -> "number"
           | String s when Ns_util.url_parses s -> "url"
           | Bool _ -> "checkbox"
           | _ -> "default")
    | None -> "default"
  in
  let m = [ "logseq.property/type", Keyword prop_type ] in
  match prop_value with
  | Some (Set _) -> BM.put m "db/cardinality" (Keyword "many")
  | _ -> m

(* auto-create-ontology *)
let auto_create_ontology (options : options)
    : (pkey * BM.t) list * (pkey * BM.t) list =
  let new_classes =
    List.concat_map
      (fun (p : pab) ->
        (List.concat_map
           (fun (b : node) ->
             match BM.attr_value b.bm "build/tags" with
             | Some ts -> List.map key_of_value (coll_items ts)
             | None -> [])
           p.blocks)
        @ (match BM.attr_value p.page.bm "build/tags" with
           | Some ts -> List.map key_of_value (coll_items ts)
           | None -> []))
      options.pages_and_blocks
    |> List.filter
         (fun k ->
           match k with
           | Kkw s -> not (Db_class.logseq_class_kw s)
           | Kstr _ -> true)
    |> distinct
    |> List.filter (fun k -> not (List.mem_assoc k options.classes))
    |> List.map (fun k -> (k, []))
  in
  let classes' = new_classes @ options.classes in
  let used_properties =
    get_used_properties options.pages_and_blocks options.properties
      options.classes
  in
  let used_keys = List.map fst used_properties |> distinct in
  let new_properties =
    List.filter
      (fun k ->
        not (List.mem_assoc k options.properties)
        && not (Db_property.internal_property (pkey_name k)))
      used_keys
    |> List.map (fun k ->
           let vals' =
             List.filter_map
               (fun (k', v) -> if k' = k then Some v else None)
               used_properties
           in
           (k, infer_property_schema vals'))
  in
  (new_properties @ options.properties, classes')

(* get-possible-referenced-uuids — postwalk scrape *)
let rec scrape_uuids (v : value) (acc : string list ref) : unit =
  (match v with
   | Vector [ Keyword "block/uuid"; Uuid u ]
   | List [ Keyword "block/uuid"; Uuid u ] -> acc := u :: !acc
   | _ -> ());
  (match v with
   | Map kvs ->
       let m = bm_of_value v in
       (match
          (BM.attr_value m "build/journal", BM.attr_value m "block/uuid")
        with
        | Some (Int d), None ->
            acc := Common_uuid.gen_journal_page_uuid d :: !acc
        | _ -> ());
       List.iter (fun (k, v') -> scrape_uuids k acc; scrape_uuids v' acc) kvs
   | Vector vs | List vs | Set vs -> List.iter (fun v' -> scrape_uuids v' acc) vs
   | _ -> ())

let get_possible_referenced_uuids (v : value) : string list =
  let acc = ref [] in
  scrape_uuids v acc;
  distinct (List.rev !acc)

(* create-all-idents — (pkey*ident) list for properties+classes *)
let create_all_idents (properties : (pkey * BM.t) list)
    (classes : (pkey * BM.t) list) ~(graph_namespace : string option)
    : (pkey * string) list =
  let create_property_ident (k : pkey) =
    match graph_namespace with
    | Some gns ->
        Db_ident.create_db_ident_from_name
          ~user_namespace:(gns ^ ".property") ~name_string:(pkey_name k)
    | None ->
        (match k with
         | Kkw s when String.contains s '/' ->
             (match Db_property.namespace_of s with
              | Some ns when Db_property.user_property_namespace ns ->
                  Db_ident.create_db_ident_from_name ~user_namespace:ns
                    ~name_string:(name_of_kw s)
              | _ ->
                  fail
                    ("Property ident must have valid namespace: " ^ s))
         | _ ->
             Db_ident.create_user_property_ident_from_name
               (pkey_name k))
  in
  let property_idents =
    List.map (fun (k, _) -> (k, create_property_ident k)) properties
  in
  (let seen = List.map snd property_idents in
   if List.length (distinct seen) <> List.length property_idents then
     fail "All property db-idents must be unique");
  let create_class_ident (k : pkey) =
    match graph_namespace with
    | Some gns ->
        Db_ident.create_db_ident_from_name
          ~user_namespace:(gns ^ ".class") ~name_string:(pkey_name k)
    | None ->
        (match k with
         | Kkw s when String.contains s '/' ->
             (match Db_property.namespace_of s with
              | Some ns when Db_class.user_class_namespace ns ->
                  Db_ident.create_db_ident_from_name ~user_namespace:ns
                    ~name_string:(name_of_kw s)
              | _ ->
                  fail ("Class ident must have valid namespace: " ^ s))
         | _ ->
             Db_ident.create_user_class_ident_from_name (pkey_name k))
  in
  let class_idents = List.map (fun (k, _) -> (k, create_class_ident k)) classes in
  (let seen = List.map snd class_idents in
   if List.length (distinct seen) <> List.length class_idents then
     fail "All class db-idents must be unique");
  let all = property_idents @ class_idents in
  if List.length (distinct (List.map snd all)) <> List.length all then
    fail "Class and property db-idents are unique and do not overlap";
  all

(* build-blocks-tx* *)
let build_blocks_tx_impl (options : options) : value list * value list =
  let pabs =
    pre_build_pages_and_blocks options.pages_and_blocks options.properties
      ~extract_content_refs:options.extract_content_refs
  in
  let page_uuids = create_page_uuids pabs in
  let properties, classes =
    if options.auto_create_ontology then auto_create_ontology options
    else (options.properties, options.classes)
  in
  let all_idents =
    create_all_idents properties classes ~graph_namespace:options.graph_namespace
  in
  validate_class_extends_acyclic classes all_idents;
  let properties_tx =
    build_properties_tx properties classes page_uuids all_idents options
  in
  let classes_tx =
    build_classes_tx classes properties page_uuids all_idents options
  in
  let class_ident_to_id =
    List.filter_map
      (fun v ->
        if is_map v then
          let m = bm_of_value v in
          match BM.attr_value m "db/ident", BM.attr_value m "db/id" with
          | Some i, Some id -> Some (i, id)
          | _ -> None
        else None)
      classes_tx
  in
  let properties_tx' =
    List.map
      (fun v ->
        if is_map v then
          let m = bm_of_value v in
          match BM.attr_value m "logseq.property/classes" with
          | Some cs ->
              let cs' =
                List.map
                  (fun c ->
                    let cm = bm_of_value c in
                    match BM.attr_value cm "db/ident" with
                    | Some (Keyword i) when Db_class.logseq_class_kw i -> c
                    | Some i ->
                        (match List.assoc_opt i class_ident_to_id with
                         | Some id -> Map [ (Keyword "db/id", id) ]
                         | None ->
                             (match i with
                              | Keyword s | String s
                                when options.build_existing_tx
                                     && List.mem_assoc
                                          (Kkw s) classes ->
                                  Map [ (Keyword "db/ident", i) ]
                              | _ ->
                                  fail
                                    ("No :db/id found for :db/ident "
                                     ^ Db_property_build.str_of_value c)))
                    | _ -> c)
                  (coll_items cs)
              in
              map_of_bm (BM.put m "logseq.property/classes" (Vector cs'))
          | None -> v
        else v)
      properties_tx
  in
  let pages_and_blocks_tx =
    build_pages_and_blocks_tx pabs all_idents page_uuids
      { options with properties }
  in
  let init_tx, block_props_tx =
    split_blocks_tx (properties_tx' @ classes_tx @ pages_and_blocks_tx) properties
  in
  if options.build_existing_tx then
    let indices =
      List.map
        (fun u -> Map [ (Keyword "block/uuid", Uuid u) ])
        (get_possible_referenced_uuids
           (Map
              [ ( Keyword "classes"
                , Map
                    (List.map (fun (k, v) -> (pkey_value k, map_of_bm v)) classes) )
              ; ( Keyword "properties"
                , Map
                    (List.map (fun (k, v) -> (pkey_value k, map_of_bm v)) properties) )
              ; ( Keyword "pages-and-blocks"
                , Vector
                    (List.map
                       (fun (p : pab) ->
                         Map
                           [ (Keyword "page", map_of_bm p.page.bm)
                           ; ( Keyword "blocks"
                             , Vector (List.map (fun b -> map_of_bm b.bm) p.blocks) ) ])
                       pabs) ) ]))
    in
    (indices @ init_tx, block_props_tx)
  else (init_tx, block_props_tx)

(* validate-options — partial: malli Options schema validation is
   approximated by required-shape checks; the undeclared-properties
   check is ported faithfully. *)
let validate_options (options : options) : unit =
  if not options.auto_create_ontology then begin
    let used = get_used_properties options.pages_and_blocks options.properties options.classes in
    let undeclared =
      List.map fst used
      |> distinct
      |> List.filter
           (fun k ->
             not (List.mem_assoc k options.properties)
             && not (Db_property.internal_property (pkey_name k)))
    in
    if undeclared <> [] then
      fail
        ("The following properties used in EDN were not declared in :properties: "
         ^ String.concat " " (List.map pkey_name undeclared))
  end

(* build-blocks-tx — public entry. Returns (init-tx, block-props-tx)
   as EDN tx item lists (Map entities + bare lookup vectors). *)
let build_blocks_tx ?page_id_fn (options_v : value) : value list * value list =
  let options = options_of_value ?page_id_fn options_v in
  validate_options options;
  build_blocks_tx_impl options

(* EDN tx items -> tx_op list. Map -> entity; bare [attr v] lookup
   vectors -> lookup-ref upsert; op vectors follow datascript tx-op
   dispatch (see datascript-ocaml data_readers.tx_op_of_edn_form). *)
let entity_ref_of_value (v : value) : entity_ref =
  match v with
  | Int n when n < 0 -> Temp_id (string_of_int n)
  | Int n -> Entity_id n
  | String s -> Temp_id s
  | Keyword "db/current-tx" | Symbol "db/current-tx" -> CurrentTx
  | Symbol ("datomic.tx" | "datascript.tx" as s) -> Temp_id s
  | Keyword ident -> Ident ident
  | Vector [ Keyword a; x ] | List [ Keyword a; x ] -> Lookup_ref (a, x)
  | _ ->
      fail
        ("Expected number or lookup ref for entity id: "
         ^ Db_property_build.str_of_value v)

let tx_attr_of_value (v : value) : attr =
  match v with
  | Keyword a | String a | Symbol a -> a
  | _ ->
      fail ("Bad entity attribute: " ^ Db_property_build.str_of_value v)

let tx_op_name_of_value (v : value) : string =
  match v with
  | Keyword a | String a | Symbol a -> a
  | _ -> fail "Unknown operation"

(* [op e a v tx] -> explicit-tx raw datom (datascript/datom literal). *)
let raw_datom_of_values (e : value) (a : value) (v : value) (tx : value)
    (added : bool) : tx_op =
  let eid =
    match e with
    | Int n -> n
    | _ -> fail "explicit transaction datoms require entity ids"
  in
  let txid =
    match tx with
    | Int n -> n
    | _ -> fail "explicit transaction tx must be an integer"
  in
  Raw_datom (Datascript.datom ~tx:txid ~added ~e:eid ~a:(tx_attr_of_value a) ~v ())

let is_tx_op_head (v : value) : bool =
  match tx_op_name_of_value v with
  | "add" | "db/add" | "retract" | "db/retract" | "db/cas" | "db.fn/cas"
  | "db/retractEntity" | "db.fn/retractEntity" | "db/retractAttribute"
  | "db.fn/retractAttribute" ->
      true
  | _ -> false
  | exception _ -> false

let tx_op_of_value (db : db) (v : value) : tx_op =
  match v with
  | Map _ -> Sqlite_create_graph.entity_tx db (bm_of_value v)
  | Vector (op_head :: rest) | List (op_head :: rest) when is_tx_op_head op_head ->
      (match rest with
       | [ e; a; v' ] ->
           (match tx_op_name_of_value op_head with
            | "add" | "db/add" ->
                Add (entity_ref_of_value e, tx_attr_of_value a, v')
            | "retract" | "db/retract" ->
                Retract (entity_ref_of_value e, tx_attr_of_value a, Some v')
            | "db/cas" | "db.fn/cas" ->
                fail "db/cas requires entity, attr, expected value, and new value"
            | _ -> fail "Unknown operation")
       | [ e; a; expected; v' ] ->
           (match tx_op_name_of_value op_head with
            | "add" | "db/add" -> raw_datom_of_values e a expected v' true
            | "retract" | "db/retract" -> raw_datom_of_values e a expected v' false
            | "db/cas" | "db.fn/cas" ->
                CompareAndSet
                  ( entity_ref_of_value e
                  , tx_attr_of_value a
                  , (match expected with Nil -> None | _ -> Some expected)
                  , v' )
            | _ -> fail "Unknown operation")
       | [ e; a ] ->
           (match tx_op_name_of_value op_head with
            | "retract" | "db/retract" ->
                Retract (entity_ref_of_value e, tx_attr_of_value a, None)
            | "db/retractAttribute" | "db.fn/retractAttribute" ->
                RetractAttr (entity_ref_of_value e, tx_attr_of_value a)
            | _ -> fail "Unknown operation")
       | [ e ] ->
           (match tx_op_name_of_value op_head with
            | "db/retractEntity" | "db.fn/retractEntity" ->
                RetractEntity (entity_ref_of_value e)
            | _ -> fail "Unknown operation")
       | _ -> fail "Unknown operation")
  | Vector [ Keyword a; x ] | List [ Keyword a; x ] ->
      (* bare lookup ref, e.g. [:block/uuid u] -> upserted entity *)
      Entity { db_id = Some (Lookup_ref (a, x)); attrs = [] }
  | _ ->
      fail ("Unexpected tx item: " ^ Db_property_build.str_of_value v)

let tx_ops_of_values (db : db) (txs : value list) : tx_op list =
  let hint =
    BM.schema_hint_of_bms
      (List.filter_map
         (fun v -> match v with Map _ -> Some (bm_of_value v) | _ -> None)
         txs)
  in
  List.map
    (fun v ->
      match v with
      | Map _ -> Sqlite_create_graph.entity_tx ~hint db (bm_of_value v)
      | _ -> tx_op_of_value db v)
    txs

(* create-blocks — build + transact on a conn *)
let create_blocks (conn : conn) (options_v : value) : unit =
  let options =
    match options_v with
    | Vector _ | List _ ->
        (* shorthand: vec of blocks -> {:pages-and-blocks [...]} *)
        options_of_value
          (Map
             [ ( Keyword "pages-and-blocks"
               , Vector (coll_items options_v) )
             ; (Keyword "auto-create-ontology?", Bool true) ])
    | _ ->
        options_of_value
          (map_of_bm
             (BM.put (bm_of_value options_v) "auto-create-ontology?" (Bool true)))
  in
  let init_tx, block_props_tx = build_blocks_tx_impl options in
  let ops1 = tx_ops_of_values (Conn.db conn) init_tx in
  ignore (Db_tx.transact conn ops1);
  if block_props_tx <> [] then
    let ops2 = tx_ops_of_values (Conn.db conn) block_props_tx in
    ignore (Db_tx.transact conn ops2)

(* extract-from-blocks *)
let extract_from_blocks (blocks : BM.t list) (f : BM.t -> 'a list) : 'a list =
  let rec apply_all (m : BM.t) : 'a list =
    f m
    @ (match BM.attr_value m "build/children" with
       | Some cs -> List.concat_map (fun c -> apply_all (bm_of_value c)) (coll_items cs)
       | None -> [])
  in
  List.concat_map apply_all blocks

(* update-each-block *)
let update_each_block (blocks : BM.t list) (f : BM.t -> BM.t) : BM.t list =
  let rec upd (m : BM.t) : BM.t =
    let m' = f m in
    match BM.attr_value m "build/children" with
    | Some cs ->
        BM.put m' "build/children"
          (Vector (List.map (fun c -> map_of_bm (upd (bm_of_value c))) (coll_items cs)))
    | None -> m'
  in
  List.map upd blocks



(* cljs validate-options on a raw export/import EDN options map *)
let validate_export_map (v : value) : unit = validate_options (options_of_value v)
