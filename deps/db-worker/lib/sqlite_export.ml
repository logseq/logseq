(* Faithful 1:1 port of deps/db/src/logseq/db/sqlite/export.cljs.

   Graph/block/page EDN export (sqlite.build format) + import tx
   construction + dry-run validation.

   cljs notes:
   - `^::existing-property-value?` metadata on `[:block/uuid u]` vectors
     is carried by a per-export [epuuids] string set ref: uuids produced
     by build-pvalue-entity for pre-existing pvalue blocks are recorded
     there; `get-pvalue-uuids` collects occurrences intersected with it
     (union-equivalent to per-vector meta, since the tag identifies the
     uuid value, not the site).
   - Export maps are EDN `value` trees (Map keyed by Keyword). Options
     are the [export_options] record; cljs `merge`/`dissoc` on options
     maps become record updates.
   - cljs `(d/entity db v)` on values = [ent_of_v]; `de/entity?` =
     [is_entity_v] (Ref/Ref_to).
   - cljs namespaced `::kw` keys are stored as
     "logseq.db.sqlite.export/..." keywords so remove-namespaced-keys
     stays faithful.

   init() wiring: none — called by Endpoint_export. *)

open Datascript
module BM = Block_map
module SSet = Set.Make (String)
module IntSet = Set.Make (Int)

exception Export_error of string

let fail (s : string) : 'a = raise (Export_error s)

let ns = "logseq.db.sqlite.export"
let ns_key s = ns ^ "/" ^ s
let k_block = ns_key "block"
let k_export_type = ns_key "export-type"
let k_graph_format = ns_key "graph-format"
let k_schema_version = ns_key "schema-version"
let k_graph_files = ns_key "graph-files"
let k_kv_values = ns_key "kv-values"
let k_property_history = ns_key "property-history"
let k_auto_include_namespaces = ns_key "auto-include-namespaces"
let k_import_options = ns_key "import-options"

(* ---- value helpers (match sqlite_build conventions) ---- *)

let bm_of_value = Sqlite_build.bm_of_value
let map_of_bm = Sqlite_build.map_of_bm
let bm_get = Sqlite_build.bm_get
let bm_get_opt (m : BM.t) (a : attr) : value option = BM.attr_value m a
let is_map = function Map _ -> true | _ -> false
let is_set = function Set _ -> true | _ -> false
let is_vector = function Vector _ -> true | _ -> false
let coll_items = function Vector vs | List vs | Set vs -> vs | _ -> []
let truthy = function Nil | Bool false -> false | _ -> true
let truthy_opt = function Some Nil | None -> false | Some (Bool b) -> b | Some _ -> true

let bm_put m a v = BM.put m a v

let bm_dissoc (m : BM.t) (ks : attr list) : BM.t =
  List.filter (fun (k, _) -> not (List.mem k ks)) m

(* cljs walk/postwalk over value trees *)
let rec postwalk (f : value -> value) (v : value) : value =
  let v' =
    match v with
    | Map kvs -> Map (List.map (fun (k, x) -> (k, postwalk f x)) kvs)
    | Vector vs -> Vector (List.map (postwalk f) vs)
    | List vs -> List (List.map (postwalk f) vs)
    | Set vs -> Set (List.map (postwalk f) vs)
    | _ -> v
  in
  f v'

let value_in (v : value) (xs : value list) : bool =
  List.exists (fun x -> Util.value_equal x v) xs

let dedup_values_str (xs : string list) : string list =
  let rec aux seen acc = function
    | [] -> List.rev acc
    | x :: rest ->
        if List.mem x seen then aux seen acc rest
        else aux (x :: seen) (x :: acc) rest
  in
  aux [] [] xs

let dedup_ints (xs : int list) : int list =
  let rec aux seen acc = function
    | [] -> List.rev acc
    | x :: rest ->
        if List.mem x seen then aux seen acc rest
        else aux (x :: seen) (x :: acc) rest
  in
  aux [] [] xs

let dedup_values (vs : value list) : value list =
  let rec aux seen acc = function
    | [] -> List.rev acc
    | v :: rest ->
        if List.exists (fun s -> Util.value_equal s v) seen then aux seen acc rest
        else aux (v :: seen) (v :: acc) rest
  in
  aux [] [] vs

(* uuid of a [:block/uuid u] lookup vector *)
let uuid_of_uuid_vec (v : value) : string option =
  match v with
  | Vector [ Keyword "block/uuid"; Uuid u ]
  | Vector [ Keyword "block/uuid"; String u ]
  | List [ Keyword "block/uuid"; Uuid u ]
  | List [ Keyword "block/uuid"; String u ] -> Some u
  | _ -> None

let uuid_vec u = Vector [ Keyword "block/uuid"; Uuid u ]

(* ---- entity helpers ---- *)

let is_entity_v = function Ref _ | Ref_to _ -> true | _ -> false

let ent_of_v (db : db) (v : value) : entity option =
  match v with
  | Ref n -> Ldb.ent_of_id db n
  | Ref_to r -> entity db r
  | _ -> None

let uuid_of (e : entity) : string option = Ldb.uuid_value e "block/uuid"
let ident_of (e : entity) : string option = Ldb.ident_of e
let is_property_e = Ldb.is_property
let is_class_e = Ldb.is_class
let is_page_e = Ldb.is_page

(* entity attrs as (attr * value) — entity refs become Ref_to, many
   attrs become Set (cljs (into {} entity) shape). *)
let ent_bm (e : entity) : BM.t =
  List.filter_map
    (fun (a, (tv : tx_value)) ->
      match tv with
      | One_value v -> Some (a, v)
      | Many_values vs -> Some (a, Set vs)
      | One_entity te -> Option.map (fun r -> (a, Ref_to r)) te.db_id
      | Many_entities tes ->
          Some
            ( a
            , Set
                (List.filter_map
                   (fun (t : tx_entity) ->
                     Option.map (fun r -> Ref_to r) t.db_id)
                   tes) ))
    (entity_attrs e)

(* cljs db-property/properties — entity's own attrs filtered by
   property? *)
let ent_properties (e : entity) : (attr * value) list =
  List.filter (fun (a, _) -> Db_property.property a) (ent_bm e)

let props_dissoc (kvs : (attr * value) list) (ks : attr list) : (attr * value) list =
  List.filter (fun (k, _) -> not (List.mem k ks)) kvs

let ent_ref_ents (e : entity) (a : attr) : entity list = Ldb.ref_ents e a

let sort_by_block_order (ents : entity list) : entity list =
  List.stable_sort
    (fun (a : entity) (b : entity) ->
      match (Ldb.string_value a "block/order", Ldb.string_value b "block/order") with
      | Some x, Some y -> String.compare x y
      | _ -> 0)
    ents

(* ---- export options ---- *)

type export_options =
  { include_properties : bool
  ; include_timestamps : bool
  ; include_uuid : bool
  ; shallow_copy : bool
  ; include_alias : bool
  ; include_uuid_fn : string -> bool
  ; include_uuid_set : string list
      (* cljs :include-uuid-fn may itself be a SET of uuids; we keep that set
         for remove-uuid-if-not-ref's union step. *)
  ; include_pvalue_uuid_fn : string -> bool
  ; exclude_ontology : bool
  ; ontology_page : bool
  ; property_value_uuids : bool
  ; include_children : bool
  ; handle_block_uuids : bool
  ; exclude_namespaces : string list (* kw names as cljs :exclude-namespaces *)
  ; exclude_built_in_pages : bool
  ; exclude_files : bool
  ; group_by : bool
  ; catch_validation_errors : bool
  ; graph_ontology : value option (* {:properties m :classes m} *)
  ; properties : value option (* ident -> config Map *)
  ; classes : value option
  ; blocks : value option
  ; page_entity : entity option
  ; current_block : entity option
  ; existing_pages_keep_properties : bool
  ; epuuids : SSet.t ref (* ::existing-property-value? uuid side-channel *)
  }

let never _ = false
let always _ = true

let default_export_options () : export_options =
  { include_properties = false
  ; include_timestamps = false
  ; include_uuid = false
  ; shallow_copy = false
  ; include_alias = false
  ; include_uuid_fn = never
  ; include_uuid_set = []
  ; include_pvalue_uuid_fn = never
  ; exclude_ontology = false
  ; ontology_page = false
  ; property_value_uuids = false
  ; include_children = true
  ; handle_block_uuids = false
  ; exclude_namespaces = []
  ; exclude_built_in_pages = false
  ; exclude_files = false
  ; group_by = false
  ; catch_validation_errors = false
  ; graph_ontology = None
  ; properties = None
  ; classes = None
  ; blocks = None
  ; page_entity = None
  ; current_block = None
  ; existing_pages_keep_properties = false
  ; epuuids = ref SSet.empty
  }

let uuid_set_pred (us : string list) : string -> bool =
  let s = List.fold_left (fun acc u -> SSet.add u acc) SSet.empty us in
  fun u -> SSet.mem u s

(* bool key lookup in an option-bearing EDN options map *)
let opt_bool (m : value) (a : string) : bool =
  truthy (bm_get (bm_of_value m) a)

let kw_set_of_value (v : value) : string list =
  List.filter_map (function Keyword k -> Some k | _ -> None) (coll_items v)

(* cljs kw `name` (after last /) and `namespace` (before last /) *)
let kw_name (s : string) : string =
  match String.rindex_opt s '/' with
  | Some i -> String.sub s (i + 1) (String.length s - i - 1)
  | None -> s

let kw_namespace (s : string) : string option =
  match String.rindex_opt s '/' with
  | Some i -> Some (String.sub s 0 i)
  | None -> None

(* Parse EDN options into export_options; [entity_of] resolves
   :current-block / :page-entity idents+ids. Extra top-level keys
   (:export-type etc.) stay in the raw map — callers read them off the
   original value. *)
let export_options_of_value (db : db) (v : value) : export_options =
  let m = bm_of_value v in
  let o = default_export_options () in
  let pred_of a =
    match bm_get_opt m a with
    | Some (Set us) | Some (Vector us) | Some (List us) ->
        let strs =
          List.filter_map
            (function Uuid u | String u -> Some u | _ -> None)
            us
        in
        uuid_set_pred strs
    | Some (Bool true) -> always
    | Some (Bool false) | Some Nil | None -> never
    | Some _ -> fail ("Unexpected include-fn for :" ^ a)
  in
  let ent_opt_of a =
    match bm_get_opt m a with
    | Some v -> ent_of_v db v
    | None -> None
  in
  let uuid_strs_of a =
    match bm_get_opt m a with
    | Some (Set us) | Some (Vector us) | Some (List us) ->
        List.filter_map
          (function Uuid u | String u -> Some u | _ -> None)
          us
    | _ -> []
  in
  let import_opts = bm_of_value (bm_get m "import-options") in
  { o with
    include_properties = opt_bool v "include-properties?"
  ; include_timestamps = opt_bool v "include-timestamps?"
  ; include_uuid = opt_bool v "include-uuid?"
  ; shallow_copy = opt_bool v "shallow-copy?"
  ; include_alias = opt_bool v "include-alias?"
  ; include_uuid_fn = pred_of "include-uuid-fn"
  ; include_uuid_set = uuid_strs_of "include-uuid-fn"
  ; include_pvalue_uuid_fn = pred_of "include-pvalue-uuid-fn"
  ; exclude_ontology = opt_bool v "exclude-ontology?"
  ; ontology_page = opt_bool v "ontology-page?"
  ; property_value_uuids = opt_bool v "property-value-uuids?"
  ; include_children = opt_bool v "include-children?"
  ; handle_block_uuids = opt_bool v "handle-block-uuids?"
  ; exclude_namespaces =
      List.map kw_name (kw_set_of_value (bm_get m "exclude-namespaces"))
  ; exclude_built_in_pages = opt_bool v "exclude-built-in-pages?"
  ; exclude_files = opt_bool v "exclude-files?"
  ; group_by = opt_bool v "group-by?"
  ; catch_validation_errors = opt_bool v "catch-validation-errors?"
  ; graph_ontology =
      (match bm_get_opt m "graph-ontology" with Some (Map _ as g) -> Some g | _ -> None)
  ; properties =
      (match bm_get_opt m "properties" with Some (Map _ as p) -> Some p | _ -> None)
  ; classes =
      (match bm_get_opt m "classes" with Some (Map _ as c) -> Some c | _ -> None)
  ; blocks = bm_get_opt m "blocks"
  ; page_entity = ent_opt_of "page-entity"
  ; current_block = ent_opt_of "current-block"
  ; existing_pages_keep_properties =
      truthy (bm_get import_opts "existing-pages-keep-properties?")
  }

(* EDN options -> [export_options] for :graph-options sub-map *)
let graph_options_of_value (db : db) (v : value) : export_options =
  let o = export_options_of_value db v in
  { o with property_value_uuids = true; include_alias = true }

(* ---- forward decl: buildable-properties <-> build-blocks-export ---- *)

let build_blocks_export_ref :
    (epuuids:SSet.t ref -> db -> entity list -> export_options -> BM.t) ref =
  ref (fun ~epuuids:_ _ _ _ -> failwith "sqlite-export uninitialized")

(* ---- small ports ---- *)

(* cljs ->build-tags *)
let build_tags_of (tags : entity list) : value =
  Set
    (List.filter_map
       (fun t ->
         match ident_of t with
         | Some "logseq.class/Page" | Some "logseq.class/Journal" -> None
         | Some id -> Some (Keyword id)
         | None -> None)
       tags)

(* cljs block-title — (:block/raw-title ent) or (:block/title ent).
   raw_title resolves journal pages to their formatted title like
   lookup-kv-then-entity. *)
let block_title_opt (e : entity) : value option =
  match Ldb.raw_title e.db e with
  | Some v -> Some v
  | None -> Ldb.value e "block/title"

let block_title (e : entity) : value =
  Option.value ~default:Nil (block_title_opt e)

(* cljs local property-value-content: title or :logseq.property/value *)
let property_value_content (e : entity) : value =
  match block_title_opt e with
  | Some v -> v
  | None -> Option.value ~default:Nil (Ldb.value e "logseq.property/value")

let title_string_of (e : entity) : string =
  match block_title_opt e with
  | Some (String s) -> s
  | Some v -> Db_property_build.str_of_value v
  | None -> ""

(* cljs referenced-property-value-contents *)
let referenced_property_value_contents (db : db) (property : entity) : value list =
  match Ldb.value property "db/valueType" with
  | Some (Keyword "db.type/ref") ->
      (match ident_of property with
       | Some ident ->
           List.of_seq (datoms db Avet ~a:ident ())
           |> List.filter_map (fun (d : datom) ->
                  Option.map property_value_content (ent_of_v db d.v))
           |> dedup_values
       | None -> [])
  | _ -> []

(* cljs closed-values-for-export *)
let closed_values_for_export (db : db) (property : entity) : entity list =
  let referenced = referenced_property_value_contents db property in
  let from_kv = Db_property.property_closed_values property in
  let from_reverse =
    List.of_seq
      (datoms db Avet ~a:"block/closed-value-property" ~v:(Ref property.id) ())
    |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)
    |> List.filter (fun e -> value_in (property_value_content e) referenced)
  in
  (* dedup by :db/id, sort by :block/order *)
  let seen = Hashtbl.create 16 in
  let merged =
    List.filter
      (fun (e : entity) ->
        if Hashtbl.mem seen e.id then false
        else begin
          Hashtbl.replace seen e.id ();
          true
        end)
      (from_kv @ from_reverse)
  in
  sort_by_block_order merged

(* cljs shallow-copy-page *)
let shallow_copy_page (e : entity) : BM.t =
  if Ldb.is_journal e then
    [ "build/journal", Option.value ~default:Nil (Ldb.value e "block/journal-day") ]
  else [ "block/title", block_title e ]

(* cljs build-pvalue-entity-for-build-page *)
let build_pvalue_entity_for_build_page (pvalue : entity) : value option =
  if Ldb.internal_page pvalue then begin
    let bm = shallow_copy_page pvalue in
    let tags = ent_ref_ents pvalue "block/tags" in
    let bm =
      if tags <> [] then bm @ [ "build/tags", build_tags_of tags ] else bm
    in
    Some (Vector [ Keyword "build/page"; map_of_bm bm ])
  end
  else if Ldb.is_journal pvalue then
    Some
      (Vector
         [ Keyword "build/page"
         ; map_of_bm
             [ "build/journal"
             , Option.value ~default:Nil (Ldb.value pvalue "block/journal-day")
             ]
         ])
  else None

(* cljs build-pvalue-entity-default *)
let build_pvalue_entity_default (ent_properties_v : BM.t option)
    (build_children : value option) (pvalue : entity) (options : export_options)
    : value =
  let pvc = property_value_content pvalue in
  let tags = ent_ref_ents pvalue "block/tags" in
  let u = uuid_of pvalue in
  let include_uuid = Option.value ~default:false (Option.map options.include_pvalue_uuid_fn u) in
  if Option.is_some ent_properties_v
     || Option.is_some build_children
     || tags <> []
     || include_uuid
  then begin
    let bm =
      [ "build/property-value", Keyword "block"; "block/title", pvc ]
    in
    let bm =
      match build_children with
      | Some c -> bm @ [ "build/children", c ]
      | None -> bm
    in
    let bm =
      if tags <> [] then bm @ [ "build/tags", build_tags_of tags ] else bm
    in
    let bm =
      match ent_properties_v with
      | Some props -> bm @ [ "build/properties", map_of_bm props ]
      | None -> bm
    in
    let bm =
      match u with
      | Some u when include_uuid ->
          bm @ [ "block/uuid", Uuid u; "build/keep-uuid?", Bool true ]
      | _ -> bm
    in
    let bm =
      if options.include_timestamps then
        bm
        @ List.filter_map
            (fun a ->
              Option.map (fun v -> (a, v)) (Ldb.value pvalue a))
            [ "block/created-at"; "block/updated-at" ]
      else bm
    in
    map_of_bm bm
  end
  else pvc

let ignored_properties =
  [ "logseq.property/created-by-ref"
  ; "logseq.property.embedding/hnsw-label-updated-at" ]

(* cljs buildable-properties.
   [properties_config]: (ident -> config BM.t) list. *)
let rec buildable_properties ~epuuids (db : db)
    (ent_properties_l : (attr * value) list) (properties_config : (string * BM.t) list)
    (options : export_options) : BM.t =
  let build_pvalue_entity db' (property_ent : entity option) (pvalue : entity)
      (properties_config' : (string * BM.t) list) (options' : export_options) : value =
    match
      (if not options'.property_value_uuids then
         build_pvalue_entity_for_build_page pvalue
       else None)
    with
    | Some build_page -> build_page
    | None ->
        let ptype =
          Option.bind property_ent (fun e -> Ldb.value e "logseq.property/type")
        in
        let pident = Option.bind property_ent ident_of in
        if List.mem ptype
             [ Some (Keyword "node"); Some (Keyword "date"); Some (Keyword "entity") ]
           && pident <> Some "logseq.property/default-value"
        then
          (* Idents take precedence over uuid because they keep data
             graph-agnostic *)
          match ident_of pvalue with
          | Some i -> Keyword i
          | None ->
              (match uuid_of pvalue with
               | Some u ->
                   epuuids := SSet.add u !epuuids;
                   uuid_vec u
               | None -> fail "pvalue entity without ident or uuid")
        else
          match ident_of pvalue with
          | Some i -> Keyword i
          | None ->
              let ent_properties_inner =
                props_dissoc
                  (ent_properties pvalue)
                  ([ "logseq.property/value"
                   ; "logseq.property/created-from-property" ]
                   @ Db_property.public_db_attribute_properties)
              in
              let child_blocks =
                match uuid_of pvalue with
                | Some u ->
                    (match Ldb.get_block_and_children db' u with
                     | _ :: rest -> rest
                     | [] -> [])
                | None -> []
              in
              let build_children =
                if child_blocks <> [] then
                  (* TODO: Handle new properties and classes for non
                     :graph exports (cljs comment) *)
                  let be =
                    !build_blocks_export_ref ~epuuids db' child_blocks
                      { options' with
                        include_uuid_fn = never
                      ; include_pvalue_uuid_fn = never }
                  in
                  Some (bm_get be "blocks")
                else None
              in
              let ent_props' =
                if Ldb.value pvalue "block/closed-value-property" = None
                   && ent_properties_inner <> []
                then
                  Some
                    (buildable_properties ~epuuids db' ent_properties_inner
                       properties_config' options')
                else None
              in
              build_pvalue_entity_default ent_props' build_children pvalue
                options'
  in
  props_dissoc ent_properties_l ignored_properties
  |> List.map
       (fun (k, v) ->
         let v' =
           (* handle user closed value properties; built-ins have
              idents and shouldn't be handled here *)
           if (not (Db_property.logseq_property k))
              &&
            (match v with
             | vv when truthy (bm_get
                                 (match ent_of_v db vv with
                                  | Some e -> ent_bm e
                                  | None -> [])
                                 "block/closed-value-property") -> true
             | Set vs ->
                 (match vs with
                  | first :: _ ->
                      (match ent_of_v db first with
                       | Some e ->
                           truthy
                             (bm_get (ent_bm e)
                                "block/closed-value-property")
                       | None -> false)
                  | [] -> false)
             | _ -> false)
           then begin
             let closed_values =
               match List.assoc_opt k properties_config with
               | Some cfg ->
                   coll_items (bm_get cfg "build/closed-values")
               | None -> []
             in
             let find_closed_uuid (val_e : entity) : string =
               let target = Ldb.property_value_content val_e in
               let hit =
                 List.find_map
                   (fun cv ->
                     let cvm = bm_of_value cv in
                     (match bm_get_opt cvm "value" with
                      | Some (String s) ->
                          (match target with
                           | Some t when t = s -> bm_get_opt cvm "uuid"
                           | _ -> None)
                      | Some v ->
                          (* non-string values compare by pr-str *)
                          (match target with
                           | Some t
                             when Db_property_build.str_of_value v = t ->
                               bm_get_opt cvm "uuid"
                           | _ -> None)
                      | None -> None))
                   closed_values
               in
               match hit with
               | Some (Uuid u) -> u
               | Some (String u) -> u
               | _ ->
                   fail
                     ("No closed value found for content: "
                      ^ Option.value ~default:"nil" target)
             in
             match v with
             | Set vs ->
                 Set
                   (List.map
                      (fun x ->
                        match ent_of_v db x with
                        | Some e -> uuid_vec (find_closed_uuid e)
                        | None -> x)
                      vs)
             | _ ->
                 (match ent_of_v db v with
                  | Some e -> uuid_vec (find_closed_uuid e)
                  | None -> v)
           end
           else
             match v with
             | vv when is_entity_v vv ->
                 (match ent_of_v db vv with
                  | Some pvalue ->
                      build_pvalue_entity db
                        (entity db (Ident k))
                        pvalue properties_config options
                  | None -> vv)
             | Set vs when List.for_all is_entity_v vs ->
                 let property_ent = entity db (Ident k) in
                 Set
                   (List.map
                      (fun x ->
                        match ent_of_v db x with
                        | Some pvalue ->
                            build_pvalue_entity db property_ent pvalue
                              properties_config options
                        | None -> x)
                      vs)
             | _ -> v
         in
         (k, v'))
  |> List.filter (fun (k, _) -> k <> "")

(* cljs build-export-properties -> (ident, config) pairs *)
and build_export_properties ~epuuids (db : db) (user_property_idents : string list)
    (options : export_options) : (string * BM.t) list =
  let schema_attrs =
    List.filter
      (fun a -> a <> "logseq.property/classes")
      Db_schema.schema_properties
    @ [ "block/title"; "block/collapsed?" ]
  in
  let config_by_ent =
    List.filter_map
      (fun ident ->
        match entity db (Ident ident) with
        | Some property ->
            let closed_values = closed_values_for_export db property in
            let bm = Sqlite_build.select_keys (ent_bm property) schema_attrs in
            let bm =
              if options.include_uuid then
                match uuid_of property with
                | Some u ->
                    bm
                    @ [ "block/uuid", Uuid u; "build/keep-uuid?", Bool true ]
                | None -> bm
              else bm
            in
            let bm =
              if options.include_timestamps then
                bm
                @ List.filter_map
                    (fun a ->
                      Option.map (fun v -> (a, v)) (Ldb.value property a))
                    [ "block/created-at"; "block/updated-at" ]
              else bm
            in
            let bm =
              if (not options.shallow_copy) && options.include_alias then
                match ent_ref_ents property "block/alias" with
                | [] -> bm
                | aliases ->
                    bm
                    @ [ ( "block/alias"
                        , Set
                            (List.filter_map
                               (fun a ->
                                 Option.map uuid_vec (uuid_of a))
                               aliases) ) ]
              else bm
            in
            let bm =
              if not options.shallow_copy then
                match ent_ref_ents property "logseq.property/classes" with
                | [] -> bm
                | classes ->
                    bm
                    @ [ ( "build/property-classes"
                        , Set
                            (List.filter_map
                               (fun c ->
                                 Option.map
                                   (fun i -> Keyword i)
                                   (ident_of c))
                               classes) ) ]
              else bm
            in
            let bm =
              if closed_values <> [] then
                bm
                @ [ ( "build/closed-values"
                    , Vector
                        (List.map
                           (fun cv ->
                             let cvm =
                               [ ( "value"
                                 , (match Ldb.property_value_content cv with
                                    | Some s -> String s
                                    | None -> Nil) )
                               ; ( "uuid"
                                 , (match uuid_of cv with
                                    | Some u -> Uuid u
                                    | None -> Nil) )
                               ]
                             in
                             let cvm =
                               match Ldb.value cv "logseq.property/icon" with
                               | Some icon -> cvm @ [ "icon", icon ]
                               | None -> cvm
                             in
                             map_of_bm cvm)
                           closed_values) ) ]
              else bm
            in
            Some (property, bm)
        | None -> None)
      user_property_idents
  in
  (* cljs properties-config keyed by ident *)
  let properties_config =
    List.filter_map
      (fun (property, bm) ->
        Option.map (fun i -> (i, bm)) (ident_of property))
      config_by_ent
  in
  if options.include_properties then
    List.filter_map
      (fun (ent, build_property) ->
        match ident_of ent with
        | None -> None
        | Some ident ->
            let ent_props =
              props_dissoc (ent_properties ent)
                (Db_schema.schema_properties
                 @ Db_property.public_db_attribute_properties)
            in
            let build_properties =
              buildable_properties ~epuuids db ent_props properties_config
                options
            in
            Some
              ( ident
              , if build_properties <> [] then
                  build_property
                  @ [ "build/properties", map_of_bm build_properties ]
                else build_property ))
      config_by_ent
  else properties_config

(* cljs build-export-class *)
let build_export_class (class_ent : entity) (options : export_options) : BM.t =
  let class_properties =
    ent_ref_ents class_ent "logseq.property.class/properties"
    |> sort_by_block_order
    |> List.filter_map ident_of
    |> List.filter (fun i -> not (List.mem i ignored_properties))
  in
  let bm = Sqlite_build.select_keys (ent_bm class_ent) [ "block/title"; "block/collapsed?" ] in
  let bm =
    if options.include_uuid then
      match uuid_of class_ent with
      | Some u -> bm @ [ "block/uuid", Uuid u; "build/keep-uuid?", Bool true ]
      | None -> bm
    else bm
  in
  let bm =
    if options.include_timestamps then
      bm
      @ List.filter_map
          (fun a -> Option.map (fun v -> (a, v)) (Ldb.value class_ent a))
          [ "block/created-at"; "block/updated-at" ]
    else bm
  in
  let bm =
    if class_properties <> [] && not options.shallow_copy then
      bm @ [ "build/class-properties", Vector (List.map (fun i -> Keyword i) class_properties) ]
    else bm
  in
  let bm =
    if (not options.shallow_copy) && options.include_alias then
      match ent_ref_ents class_ent "block/alias" with
      | [] -> bm
      | aliases ->
          bm
          @ [ ( "block/alias"
              , Set
                  (List.filter_map
                     (fun a -> Option.map uuid_vec (uuid_of a))
                     aliases) ) ]
    else bm
  in
  let bm =
    if not options.shallow_copy then
      let extends_idents =
        List.filter_map ident_of
          (ent_ref_ents class_ent "logseq.property.class/extends")
      in
      if extends_idents <> [] && extends_idents <> [ "logseq.class/Root" ] then
        bm
        @ [ ( "build/class-extends"
            , Set (List.map (fun i -> Keyword i) extends_idents) ) ]
      else bm
    else bm
  in
  bm

(* cljs build-node-classes *)
let build_node_classes (db : db) (build_block : BM.t) (block_tags : entity list)
    (properties : (string * BM.t) list) : (string * BM.t) list =
  let build_props = bm_of_value (bm_get build_block "build/properties") in
  let pvalue_classes =
    List.concat_map
      (fun (_, val_or_vals) ->
        List.concat_map
          (fun x ->
            if Sqlite_build.page_prop_value x then
              match x with
              | Vector [ _; page_m ] ->
                  List.filter_map
                    (function Keyword k -> Some k | _ -> None)
                    (coll_items (bm_get (bm_of_value page_m) "build/tags"))
              | _ -> []
            else if Sqlite_build.block_property_value x then
              List.filter_map
                (function Keyword k -> Some k | _ -> None)
                (coll_items (bm_get (bm_of_value x) "build/tags"))
            else [])
          (Sqlite_build.items_of_set_or_one val_or_vals))
      build_props
    |> List.filter (fun k -> not (Db_class.logseq_class_kw k))
  in
  let property_classes =
    List.concat_map
      (fun (_, cfg) ->
        List.filter_map
          (function Keyword k -> Some k | _ -> None)
          (coll_items (bm_get cfg "build/property-classes")))
      properties
    |> List.filter (fun k -> not (Db_class.logseq_class_kw k))
    |> dedup_values_str
  in
  let new_class_idents =
    List.filter_map
      (fun t ->
        match ident_of t with
        | Some i when not (Db_class.logseq_class_kw i) -> Some (t, i)
        | _ -> None)
      block_tags
  in
  let shallow_classes =
    List.filter
      (fun k -> not (List.exists (fun (_, i) -> i = k) new_class_idents))
      (dedup_values_str (property_classes @ pvalue_classes))
  in
  let shallow =
    List.filter_map
      (fun ident ->
        match entity db (Ident ident) with
        | Some e -> Some (ident, build_export_class e { (default_export_options ()) with shallow_copy = true })
        | None -> None)
      shallow_classes
  in
  let full =
    List.map
      (fun (ent, ident) -> (ident, build_export_class ent (default_export_options ())))
      new_class_idents
  in
  shallow @ full


(* cljs build-node-properties *)
let build_node_properties ~epuuids (db : db) (e : entity)
    (ent_properties_l : (attr * value) list) (options : export_options) :
    (string * BM.t) list =
  let rec collect_nested_property_ids (v : value) : string list =
    if is_entity_v v then
      match ent_of_v db v with
      | Some ent
        when Option.is_some
               (Ldb.value ent "logseq.property/created-from-property") ->
          let pvalue_properties =
            props_dissoc (ent_properties ent)
              Db_property.public_db_attribute_properties
          in
          List.map fst pvalue_properties
          @ List.concat_map collect_nested_property_ids
              (List.map snd pvalue_properties)
      | _ -> []
    else
      match v with
      | Set vs -> List.concat_map collect_nested_property_ids vs
      | _ -> []
  in
  let class_prop_idents =
    List.concat_map
      (fun t ->
        List.filter_map ident_of
          (ent_ref_ents t "logseq.property.class/properties"))
      (ent_ref_ents e "block/tags")
  in
  let existing =
    match options.properties with
    | Some (Map kvs) ->
        List.filter_map (fun (k, _) -> match k with Keyword s -> Some s | _ -> None) kvs
    | _ -> []
  in
  let new_user_property_ids =
    List.map fst ent_properties_l
    @ class_prop_idents
    @ List.concat_map collect_nested_property_ids (List.map snd ent_properties_l)
    |> List.filter (fun k -> not (Db_property.logseq_property k))
    |> List.filter (fun k -> not (List.mem k existing))
    |> dedup_values_str
  in
  build_export_properties ~epuuids db new_user_property_ids options

(* cljs build-node-export *)
let build_node_export ~epuuids (db : db) (e : entity) (options : export_options) : value =
  let ent_properties =
    props_dissoc (ent_properties e) Db_property.public_db_attribute_properties
  in
  let tags = ent_ref_ents e "block/tags" in
  let build_tags_v = if tags <> [] then build_tags_of tags else Set [] in
  let new_properties =
    if not (options.shallow_copy || options.exclude_ontology) then
      build_node_properties ~epuuids db e ent_properties
        { options with shallow_copy = false; include_uuid_fn = never }
    else []
  in
  let merged_props =
    match options.properties with
    | Some (Map kvs) -> kvs
    | _ -> []
  in

  let merged =
    (* cljs (merge properties new-properties) — right (new) wins *)
    List.fold_left
      (fun acc (k, cfg) ->
        List.filter
          (fun (mk, _) -> not (Util.value_equal mk (Keyword k)))
          acc
        @ [ (Keyword k, map_of_bm cfg) ])
      merged_props new_properties
  in
  let merged_config =
    List.filter_map
      (fun (k, v) -> match k with Keyword s -> Some (s, bm_of_value v) | _ -> None)
      merged
  in
  let build_properties =
    if (not options.shallow_copy) && ent_properties <> [] then
      buildable_properties ~epuuids db ent_properties merged_config options
    else []
  in
  let node =
    [ "block/title", property_value_content e ]
  in
  let node =
    (match Ldb.value e "block/collapsed?" with
     | Some c -> node @ [ "block/collapsed?", c ]
     | None -> node)
  in
  let node =
    (match Ldb.ref_ent e "block/link" with
     | Some link ->
         (match uuid_of link with
          | Some u -> node @ [ "block/link", uuid_vec u ]
          | None -> node)
     | None -> node)
  in
  let node =
    match uuid_of e with
    | Some u when options.include_uuid_fn u ->
        node @ [ "block/uuid", Uuid u; "build/keep-uuid?", Bool true ]
    | _ -> node
  in
  let node =
    if options.include_timestamps then
      node
      @ List.filter_map
          (fun a -> Option.map (fun v -> (a, v)) (Ldb.value e a))
          [ "block/created-at"; "block/updated-at" ]
    else node
  in
  let node =
    if (not options.shallow_copy) && build_tags_v <> Set [] then
      node @ [ "build/tags", build_tags_v ]
    else node
  in
  let node =
    if build_properties <> [] then
      node @ [ "build/properties", map_of_bm build_properties ]
    else node
  in
  let new_classes =
    if not (options.shallow_copy || options.exclude_ontology) then
      build_node_classes db node tags new_properties
    else []
  in
  let out = [ Keyword "node", map_of_bm node ] in
  let out =
    if new_classes <> [] then
      out
      @ [ ( Keyword "classes"
          , Map (List.map (fun (k, cfg) -> (Keyword k, map_of_bm cfg)) new_classes) ) ]
    else out
  in
  let out =
    if new_properties <> [] then
      out
      @ [ ( Keyword "properties"
          , Map (List.map (fun (k, cfg) -> (Keyword k, map_of_bm cfg)) new_properties) ) ]
    else out
  in
  Map out

(* cljs get-pvalue-uuids — tagged (existing) uuids in build-properties
   values *)
let get_pvalue_uuids ~(epuuids : SSet.t ref) (build_block_bm : BM.t) : string list =
  bm_of_value (bm_get build_block_bm "build/properties")
  |> List.concat_map (fun (_, val_or_vals) ->
         List.filter_map
           (fun x ->
             match uuid_of_uuid_vec x with
             | Some u when SSet.mem u !epuuids -> Some u
             | _ -> None)
           (Sqlite_build.items_of_set_or_one val_or_vals))
  |> dedup_values_str

(* cljs merge-export-maps over export-map values *)
let merge_export_maps (export_maps : value list) : value =
  let pabs =
    List.concat_map
      (fun m -> coll_items (bm_get (bm_of_value m) "pages-and-blocks"))
      export_maps
  in
  let page_key (m : value) : value * value =
    let p = bm_of_value (bm_get (bm_of_value m) "page") in
    ( bm_get p "block/title", bm_get p "build/journal" )
  in
  let merge_pair (v1 : value) (v2 : value) : value =
    match v1, v2 with
    | Map a, Map b ->
        (* cljs merge — right wins *)
        Map
          (List.fold_left
             (fun acc (k, v) ->
               List.filter (fun (k', _) -> not (Util.value_equal k' k)) acc
               @ [ (k, v) ])
             a b)
    | Set a, Set b -> Set (dedup_values (a @ b))
    | Vector a, Vector b -> Vector (a @ b)
    | List a, List b -> List (a @ b)
    | _ -> v2
  in
  let merge_item (m1 : value) (m2 : value) : value =
    match m1, m2 with
    | Map a, Map b ->
        Map
          (List.fold_left
             (fun acc (k, v) ->
               match List.find_opt (fun (k', _) -> Util.value_equal k' k) acc with
               | Some (k', _) ->
                   List.map
                     (fun (kk, vv) ->
                       if Util.value_equal kk k' then (kk, merge_pair vv v) else (kk, vv))
                     acc
               | None -> acc @ [ (k, v) ])
             a b)
    | _ -> m2
  in
  let groups : ((value * value) * value list) list ref = ref [] in
  List.iter
    (fun m ->
      let key = page_key m in
      match
        List.find_opt
          (fun (k, _) -> Util.value_equal (fst k) (fst key) && Util.value_equal (snd k) (snd key))
          !groups
      with
      | Some (k, _) ->
          groups :=
            List.map
              (fun (k2, items2) ->
                if k2 == k then (k2, items2 @ [ m ]) else (k2, items2))
              !groups
      | None -> groups := !groups @ [ (key, [ m ]) ])
    pabs;
  let pages_and_blocks =
    List.map
      (fun (_, items) ->
        match items with
        | [] -> Map []
        | first :: rest -> List.fold_left merge_item first rest)
      !groups
  in
  (* merge-with merge on properties/classes maps *)
  let merge_ident_maps (ms : value list) : value option =
    let merged =
      List.fold_left
        (fun acc m ->
          match m with
          | Map kvs ->
              List.fold_left
                (fun acc (k, v) ->
                  match
                    List.find_opt (fun (k', _) -> Util.value_equal k' k) acc
                  with
                  | Some _ ->
                      List.map
                        (fun (kk, vv) ->
                          if Util.value_equal kk k then (kk, merge_pair vv v)
                          else (kk, vv))
                        acc
                  | None -> acc @ [ (k, v) ])
                acc kvs
          | _ -> acc)
        [] ms
    in
    if merged = [] then None else Some (Map merged)
  in
  let properties =
    merge_ident_maps
      (List.filter_map
         (fun m ->
           match bm_get_opt (bm_of_value m) "properties" with
           | Some p -> Some p
           | None -> None)
         export_maps)
  in
  let classes =
    merge_ident_maps
      (List.filter_map
         (fun m ->
           match bm_get_opt (bm_of_value m) "classes" with
           | Some c -> Some c
           | None -> None)
         export_maps)
  in
  let out = [ Keyword "pages-and-blocks", Vector pages_and_blocks ] in
  let out =
    match properties with Some p -> out @ [ Keyword "properties", p ] | None -> out
  in
  let out =
    match classes with Some c -> out @ [ Keyword "classes", c ] | None -> out
  in
  Map out

(* cljs build-mixed-properties-and-classes-export *)
let build_mixed_properties_and_classes_export ~epuuids (db : db) (ents : entity list)
    (options : export_options) : value =
  let properties =
    let prop_idents =
      List.filter_map
        (fun e -> if is_property_e e then ident_of e else None)
        ents
    in
    if prop_idents <> [] then
      Some (build_export_properties ~epuuids db prop_idents options)
    else None
  in
  let classes =
    let class_ents = List.filter is_class_e ents in
    if class_ents <> [] then
      Some
        (List.filter_map
           (fun e ->
             Option.map
               (fun i -> (i, build_export_class e options))
               (ident_of e))
           class_ents)
    else None
  in
  let out = [] in
  let out =
    match properties with
    | Some props ->
        out
        @ [ ( Keyword "properties"
            , Map (List.map (fun (k, cfg) -> (Keyword k, map_of_bm cfg)) props) ) ]
    | None -> out
  in
  let out =
    match classes with
    | Some clss ->
        out
        @ [ ( Keyword "classes"
            , Map (List.map (fun (k, cfg) -> (Keyword k, map_of_bm cfg)) clss) ) ]
    | None -> out
  in
  Map out

type content_ref_export =
  { content_ref_uuids : string list
  ; content_ref_ents : entity list
  ; export_map : value (* {:properties :classes :pages-and-blocks} *) }

(* cljs build-content-ref-export *)
let build_content_ref_export ~epuuids (db : db) (blocks' : entity list) :
    content_ref_export =
  let blocks =
    List.filter
      (fun e -> not (truthy_opt (Ldb.value e "logseq.property/value")))
      blocks'
  in
  let block_links =
    List.filter_map
      (fun e ->
        Option.bind (Ldb.ref_ent e "block/link") uuid_of)
      blocks
  in
  let content_ref_uuids =
    List.concat_map
      (fun e -> Db_content.get_matched_ids (title_string_of e))
      blocks
    @ block_links
    |> dedup_values_str
  in
  let content_ref_ents =
    List.filter_map
      (fun u -> entity db (Lookup_ref ("block/uuid", Uuid u)))
      content_ref_uuids
  in
  let content_ref_pages =
    List.filter
      (fun e -> Ldb.internal_page e || Ldb.is_journal e)
      content_ref_ents
  in
  let mixed =
    bm_of_value
      (build_mixed_properties_and_classes_export ~epuuids db content_ref_ents
         { (default_export_options ()) with
           include_uuid = true
         ; shallow_copy = true })
  in
  let keep_uuid k v =
    ( Keyword k
    , match v with
      | Map _ -> map_of_bm (bm_put (bm_of_value v) "build/keep-uuid?" (Bool true))
      | _ -> v )
  in
  let keep_uuid_props =
    List.map (fun (k, v) -> keep_uuid k v)
      (bm_of_value (bm_get mixed "properties"))
  in
  let keep_uuid_classes =
    List.map (fun (k, v) -> keep_uuid k v)
      (bm_of_value (bm_get mixed "classes"))
  in
  let pabs =
    List.map
      (fun e ->
        let bm = shallow_copy_page e in
        let bm =
          match uuid_of e with
          | Some u ->
              bm @ [ "block/uuid", Uuid u; "build/keep-uuid?", Bool true ]
          | None -> bm
        in
        Map [ (Keyword "page", map_of_bm bm) ])
      content_ref_pages
  in
  let out =
    [ ( Keyword "pages-and-blocks", Vector pabs ) ]
  in
  let out =
    if keep_uuid_props <> [] then
      out @ [ Keyword "properties", Map keep_uuid_props ]
    else out
  in
  let out =
    if keep_uuid_classes <> [] then
      out @ [ Keyword "classes", Map keep_uuid_classes ]
    else out
  in
  { content_ref_uuids
  ; content_ref_ents
  ; export_map = Map out }

(* cljs build-class-parents-export *)
let build_class_parents_export ~epuuids (db : db)
    (classes_config : (string * BM.t) list) : value =
  let parent_ents =
    List.filter_map
      (fun (ident, cfg) ->
        if Option.is_some (bm_get_opt cfg "build/class-extends") then
          entity db (Ident ident)
        else None)
      classes_config
    |> Db_class.get_classes_parents
  in
  let classes =
    List.filter_map
      (fun (e : entity) ->
        match ident_of e with
        | Some i when not (Db_class.logseq_class_kw i) ->
            Some (i, build_export_class e (default_export_options ()))
        | _ -> None)
      parent_ents
  in
  let class_parent_properties =
    List.concat_map
      (fun (e : entity) ->
        List.filter_map ident_of
          (ent_ref_ents e "logseq.property.class/properties"))
      parent_ents
    |> List.filter (fun i -> not (Db_property.logseq_property i))
    |> dedup_values_str
  in
  let properties =
    build_export_properties ~epuuids db class_parent_properties
      { (default_export_options ()) with shallow_copy = true }
  in
  let out = [] in
  let out =
    if classes <> [] then
      out
      @ [ ( Keyword "classes"
          , Map (List.map (fun (k, cfg) -> (Keyword k, map_of_bm cfg)) classes) ) ]
    else out
  in
  let out =
    if properties <> [] then
      out
      @ [ ( Keyword "properties"
          , Map (List.map (fun (k, cfg) -> (Keyword k, map_of_bm cfg)) properties) ) ]
    else out
  in
  Map out

(* cljs build-blocks-export — returns export map BM *)
let build_blocks_export ~epuuids (db : db) (blocks : entity list)
    (options : export_options) : BM.t =
  let properties_acc : (string * BM.t) list ref =
    ref
      (match options.graph_ontology with
       | Some g ->
           List.filter_map
             (fun (k, v) ->
               match k with Keyword s -> Some (s, bm_of_value v) | _ -> None)
             (match bm_get (bm_of_value g) "properties" with
              | Map kvs -> kvs
              | _ -> [])
       | None -> [])
  in
  let classes_acc : (string * BM.t) list ref =
    ref
      (match options.graph_ontology with
       | Some g ->
           List.filter_map
             (fun (k, v) ->
               match k with Keyword s -> Some (s, bm_of_value v) | _ -> None)
             (match bm_get (bm_of_value g) "classes" with
              | Map kvs -> kvs
              | _ -> [])
       | None -> [])
  in
  let pvalue_uuids = ref [] in
  let id_set =
    List.fold_left (fun s (e : entity) -> IntSet.add e.id s) IntSet.empty blocks
  in
  let children : (int, entity list) Hashtbl.t = Hashtbl.create 64 in
  if options.include_children then
    List.iter
      (fun (e : entity) ->
        match Ldb.ref_ids e "block/parent" with
        | pid :: _ ->
            Hashtbl.replace children pid
              (e :: Option.value ~default:[] (Hashtbl.find_opt children pid))
        | [] -> ())
      blocks;
  let opts' =
    { options with graph_ontology = None }
  in
  let rec build_block (e : entity) : BM.t =
    let child_nodes =
      List.map build_block
        (List.rev (Option.value ~default:[] (Hashtbl.find_opt children e.id)))
    in
    let node_export =
      bm_of_value
        (build_node_export ~epuuids db e
           { opts' with properties =
              (match !properties_acc with
               | [] -> None
               | props ->
                   Some
                     (Map
                        (List.map
                           (fun (k, cfg) -> (Keyword k, map_of_bm cfg))
                           props))) })
    in
    let node = bm_of_value (bm_get node_export "node") in
    let new_props = bm_of_value (bm_get node_export "properties") in
    let new_classes = bm_of_value (bm_get node_export "classes") in
    if new_props <> [] then
      properties_acc :=
        !properties_acc
        @ List.map (fun (s, v) -> (s, bm_of_value v)) new_props;
    if new_classes <> [] then
      classes_acc :=
        !classes_acc
        @ List.map (fun (s, v) -> (s, bm_of_value v)) new_classes;
    let new_puuids = get_pvalue_uuids ~epuuids node in
    if new_puuids <> [] then
      pvalue_uuids := !pvalue_uuids @ new_puuids;
    if child_nodes <> [] then
      node
      @ [ ( "build/children"
          , Vector (List.map map_of_bm child_nodes) ) ]
    else node
  in
  let roots =
    List.filter
      (fun (e : entity) ->
        match Ldb.ref_ids e "block/parent" with
        | pid :: _ -> not (IntSet.mem pid id_set)
        | [] -> true)
      blocks
  in
  let exported = List.map build_block roots in
  let out =
    [ "blocks", Vector (List.map map_of_bm exported)
    ; "pvalue-uuids", Set (List.map (fun u -> Uuid u) (dedup_values_str !pvalue_uuids)) ]
  in
  let graph_props =
    match options.graph_ontology with
    | Some g -> bm_of_value (bm_get (bm_of_value g) "properties")
    | None -> []
  in
  let graph_classes =
    match options.graph_ontology with
    | Some g -> bm_of_value (bm_get (bm_of_value g) "classes")
    | None -> []
  in
  let props_same =
    List.length !properties_acc = List.length graph_props
    && List.for_all
         (fun (k, _) -> List.exists (fun (k2, _) -> k2 = k) graph_props)
         !properties_acc
  in
  let classes_same =
    List.length !classes_acc = List.length graph_classes
    && List.for_all
         (fun (k, _) -> List.exists (fun (k2, _) -> k2 = k) graph_classes)
         !classes_acc
  in
  let out =
    if not props_same then
      out
      @ [ ( "properties"
          , Map (List.map (fun (k, cfg) -> (Keyword k, map_of_bm cfg)) !properties_acc) ) ]
    else out
  in
  let out =
    if not classes_same then
      out
      @ [ ( "classes"
          , Map (List.map (fun (k, cfg) -> (Keyword k, map_of_bm cfg)) !classes_acc) ) ]
    else out
  in
  out

let () =
  build_blocks_export_ref :=
    (fun ~epuuids db blocks options -> build_blocks_export ~epuuids db blocks options)

(* cljs build-uuid-block-export *)
let build_uuid_block_export ~epuuids (db : db) (pvalue_uuids : string list)
    (content_ref_ents : entity list) (options : export_options) : value =
  let content_ref_blocks =
    List.filter (fun e -> not (is_page_e e)) content_ref_ents
  in
  let uuid_block_ents =
    List.filter_map
      (fun u -> entity db (Lookup_ref ("block/uuid", Uuid u)))
      pvalue_uuids
    @ content_ref_blocks
  in
  let uuid_block_pages =
    if uuid_block_ents = [] then []
    else begin
      let by_page : (int, entity * entity list) Hashtbl.t = Hashtbl.create 16 in
      List.iter
        (fun (e : entity) ->
          match Ldb.ref_ids e "block/page" with
          | pid :: _ ->
              (match Ldb.ent_of_id db pid with
               | Some page_e ->
                   let skip =
                     match options.page_entity with
                     | Some pe -> pe.id = pid
                     | None -> false
                   in
                   if not skip then
                     let _, es =
                       Option.value ~default:(page_e, []) (Hashtbl.find_opt by_page pid)
                     in
                     Hashtbl.replace by_page pid (page_e, es @ [ e ])
               | None -> ())
          | [] -> ())
        uuid_block_ents;
      Hashtbl.fold
        (fun _ (page_e, blocks) acc ->
          let be =
            build_blocks_export ~epuuids db
              (sort_by_block_order blocks)
              { (default_export_options ()) with
                include_uuid_fn = always
              ; shallow_copy = true }
          in
          let merged =
            merge_export_maps
              [ map_of_bm be
              ; Map [ Keyword "page", map_of_bm (shallow_copy_page page_e) ] ]
          in
          merged :: acc)
        by_page []
      |> List.rev
    end
  in
  let properties =
    List.concat_map
      (fun m -> bm_of_value (bm_get (bm_of_value m) "properties"))
      uuid_block_pages
  in
  let classes =
    List.concat_map
      (fun m -> bm_of_value (bm_get (bm_of_value m) "classes"))
      uuid_block_pages
  in
  let pabs =
    List.map
      (fun m ->
        Map
          (List.filter
             (fun (k, _) -> Util.value_equal k (Keyword "page") || Util.value_equal k (Keyword "blocks"))
             (match m with Map kvs -> kvs | _ -> [])))
      uuid_block_pages
  in
  let out = [ Keyword "pages-and-blocks", Vector pabs ] in
  let out =
    if properties <> [] then
      out @ [ Keyword "properties", Map (List.map (fun (k, v) -> (Keyword k, v)) properties) ]
    else out
  in
  let out =
    if classes <> [] then
      out @ [ Keyword "classes", Map (List.map (fun (k, v) -> (Keyword k, v)) classes) ]
    else out
  in
  Map out

(* cljs sort-pages-and-blocks *)
let sort_pages_and_blocks (pages_and_blocks : value list) : value =
  let key_of (m : value) : string =
    let page = bm_of_value (bm_get (bm_of_value m) "page") in
    match bm_get_opt page "block/title" with
    | Some (String s) -> s
    | Some v -> Db_property_build.str_of_value v
    | None ->
        (match bm_get_opt page "build/journal" with
         | Some (Int d) -> string_of_int d
         | Some v -> Db_property_build.str_of_value v
         | None ->
             (match bm_get_opt page "block/uuid" with
              | Some (Uuid u) | Some (String u) -> u
              | Some v -> Db_property_build.str_of_value v
              | None -> ""))
  in
  Vector
    (List.stable_sort
       (fun a b -> String.compare (key_of a) (key_of b))
       pages_and_blocks)

(* cljs finalize-export-maps *)
let finalize_export_maps ~epuuids (db : db) (export_maps : value list) : value =
  let final = merge_export_maps export_maps in
  let class_parents =
    match bm_get_opt (bm_of_value final) "classes" with
    | Some (Map kvs) ->
        Some
          (build_class_parents_export ~epuuids db
             (List.filter_map
                (fun (k, v) ->
                  match k with Keyword s -> Some (s, bm_of_value v) | _ -> None)
                kvs))
    | _ -> None
  in
  let merged =
    match class_parents with
    | Some cp -> merge_export_maps [ final; cp ]
    | None -> final
  in
  let mm = bm_of_value merged in
  match bm_get_opt mm "pages-and-blocks" with
  | Some pabs ->
      map_of_bm
        (BM.put mm "pages-and-blocks" (sort_pages_and_blocks (coll_items pabs)))
  | None -> merged

(* cljs get-page-blocks *)
let get_page_blocks (db : db) (eid : entity_id) : entity list =
  List.of_seq (datoms db Avet ~a:"block/page" ~v:(Ref eid) ())
  |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)

(* cljs remove-uuid-if-not-ref-given-uuids — on a block/page BM *)
let remove_uuid_if_not_ref_given_uuids (ref_uuids : SSet.t) (m : BM.t) : BM.t =
  let keep =
    match bm_get_opt m "block/uuid" with
    | Some (Uuid u) | Some (String u) -> SSet.mem u ref_uuids
    | _ -> true (* no uuid: nothing to remove *)
  in
  let m =
    if keep then m else bm_dissoc m [ "block/uuid"; "build/keep-uuid?" ]
  in
  match bm_get_opt m "build/properties" with
  | Some props_v ->
      let props = bm_of_value props_v in
      let shrink (v : value) : value =
        if Sqlite_build.block_property_value v then
          let bm = bm_of_value v in
          let uuid_ref =
            match bm_get_opt bm "block/uuid" with
            | Some (Uuid u) | Some (String u) -> SSet.mem u ref_uuids
            | _ -> false
          in
          if uuid_ref
             || List.exists
                  (fun a -> Option.is_some (bm_get_opt bm a))
                  [ "build/tags"; "build/properties"; "build/children" ]
          then v
          else bm_get bm "block/title"
        else v
      in
      let props' =
        List.map
          (fun (k, v) ->
            ( k
            , match v with
              | Set vs -> Set (List.map shrink vs)
              | _ -> shrink v ))
          props
      in
      BM.put m "build/properties" (map_of_bm props')
  | None -> m

(* cljs pvalue-descendant? *)
let pvalue_descendant (block : entity) : bool =
  let rec loop parent =
    match parent with
    | None -> false
    | Some p ->
        if Option.is_some (Ldb.value p "logseq.property/created-from-property") then
          true
        else loop (Ldb.ref_ent p "block/parent")
  in
  loop (Ldb.ref_ent block "block/parent")

(* cljs build-page-export* *)
let build_page_export' ~epuuids (db : db) (eid : entity_id)
    (page_blocks' : entity list) (options : export_options) : value * string list =
  let page_entity =
    match Ldb.ent_of_id db eid with
    | Some e -> e
    | None -> fail ("No page entity for eid " ^ string_of_int eid)
  in
  let page_blocks =
    sort_by_block_order page_blocks'
    |> List.filter (fun e ->
           not
             (Option.is_some (Ldb.value e "logseq.property/created-from-property")
              || pvalue_descendant e))
  in
  let blocks_export_v =
    map_of_bm
      (build_blocks_export ~epuuids db page_blocks
         (if options.handle_block_uuids then
            { options with include_uuid_fn = always }
          else options))
  in
  let pvalue_uuids =
    List.filter_map
      (function Uuid u | String u -> Some u | _ -> None)
      (coll_items (bm_get (bm_of_value blocks_export_v) "pvalue-uuids"))
  in
  let blocks_export_v =
    if options.handle_block_uuids then
      let ref_uuids =
        (* cljs (set/union (set pvalue-uuids)
             (when (set? (:include-uuid-fn options)) (:include-uuid-fn options))) *)
        List.fold_left
          (fun s u -> SSet.add u s)
          SSet.empty (pvalue_uuids @ options.include_uuid_set)
      in
      let blocks_bm =
        List.map bm_of_value
          (coll_items (bm_get (bm_of_value blocks_export_v) "blocks"))
      in
      let blocks' =
        List.map map_of_bm
          (Sqlite_build.update_each_block blocks_bm
             (remove_uuid_if_not_ref_given_uuids ref_uuids))
      in
      let m = bm_of_value blocks_export_v in
      map_of_bm (BM.put m "blocks" (Vector blocks'))
    else blocks_export_v
  in
  let ontology_page_export =
    if (not options.ontology_page)
       && (is_class_e page_entity || is_property_e page_entity)
    then
      Some
        (build_mixed_properties_and_classes_export ~epuuids db [ page_entity ]
           { (default_export_options ()) with include_uuid = true })
    else None
  in
  let class_page_properties_export =
    if (not options.ontology_page) && is_class_e page_entity then
      let props =
        List.filter_map ident_of
          (ent_ref_ents page_entity "logseq.property.class/properties")
      in
      if props <> [] then
        Some
          (Map
             [ ( Keyword "properties"
               , Map
                   (List.map
                      (fun (k, cfg) -> (Keyword k, map_of_bm cfg))
                      (build_export_properties ~epuuids db props
                         { (default_export_options ()) with shallow_copy = true })) ) ])
      else None
    else None
  in
  let page_block_options =
    let merged =
      match ontology_page_export with
      | Some ope ->
          merge_export_maps
            (blocks_export_v
             :: (match class_page_properties_export with
                 | Some cpp -> [ ope; cpp ]
                 | None -> [ ope ]))
      | None -> blocks_export_v
    in
    { options with
      blocks =
        (match bm_get_opt (bm_of_value merged) "blocks" with
         | Some b -> Some b
         | None -> None)
    ; properties =
        (match bm_get_opt (bm_of_value merged) "properties" with
         | Some p -> Some p
         | None -> None)
    ; classes =
        (match bm_get_opt (bm_of_value merged) "classes" with
         | Some c -> Some c
         | None -> None)
    ; ontology_page = Option.is_some ontology_page_export }
  in
  (* cljs options' = (cond-> (dissoc options :classes :blocks :graph-ontology)
     (:exclude-ontology? options)
     (assoc :properties (get-in options [:graph-ontology :properties]))) *)
  let options' =
    { page_block_options with
      classes = None
    ; blocks = None
    ; graph_ontology = None
    ; properties =
        (if page_block_options.exclude_ontology then
           match page_block_options.graph_ontology with
           | Some g -> bm_get_opt (bm_of_value g) "properties"
           | None -> None
         else page_block_options.properties) }
  in
  let page_ent_export =
    if options'.ontology_page then
      Map [ Keyword "node", map_of_bm (Sqlite_build.select_keys (ent_bm page_entity) [ "block/uuid" ]) ]
    else build_node_export ~epuuids db page_entity options'
  in
  let page_pvalue_uuids =
    get_pvalue_uuids ~epuuids
      (bm_of_value (bm_get (bm_of_value page_ent_export) "node"))
  in
  let page =
    if options'.ontology_page then
      bm_of_value (bm_get (bm_of_value page_ent_export) "node")
    else
      let node_bm =
        bm_dissoc (bm_of_value (bm_get (bm_of_value page_ent_export) "node"))
          [ "block/title" ]
      in
      let base = node_bm @ shallow_copy_page page_entity in
      let base =
        if options'.include_alias then
          match ent_ref_ents page_entity "block/alias" with
          | [] -> base
          | aliases ->
              base
              @ [ ( "block/alias"
                  , Set
                      (List.filter_map
                         (fun a -> Option.map uuid_vec (uuid_of a))
                         aliases) ) ]
        else base
      in
      base
  in
  let page_blocks_export =
    Map
      [ ( Keyword "pages-and-blocks"
        , Vector
            [ Map
                [ Keyword "page", map_of_bm page
                ; Keyword "blocks"
                , Option.value ~default:(Vector []) page_block_options.blocks
                ]
            ] )
      ]
    |> fun m ->
    let mm =
      (match page_block_options.properties with
       | Some p -> bm_put (bm_of_value m) "properties" p
       | None -> bm_of_value m)
      |> fun mm ->
      (match page_block_options.classes with
       | Some c -> bm_put mm "classes" c
       | None -> mm)
    in
    map_of_bm mm
  in
  let merged = merge_export_maps [ page_blocks_export; page_ent_export ] in
  let all_pvalue_uuids = dedup_values_str (pvalue_uuids @ page_pvalue_uuids) in
  let merged_m = bm_of_value merged in
  let merged_m =
    bm_put merged_m "pvalue-uuids"
      (Set (List.map (fun u -> Uuid u) all_pvalue_uuids))
  in
  (map_of_bm merged_m, all_pvalue_uuids)

(* cljs build-page-export *)
let build_page_export ~epuuids (db : db) (eid : entity_id) : value =
  let page_blocks = get_page_blocks db eid in
  let content_ref = build_content_ref_export ~epuuids db page_blocks in
  let export_options =
    { (default_export_options ()) with
      include_uuid_fn = uuid_set_pred content_ref.content_ref_uuids
    ; include_uuid_set = content_ref.content_ref_uuids
    ; include_pvalue_uuid_fn = uuid_set_pred content_ref.content_ref_uuids
    ; handle_block_uuids = true
    ; include_alias = true
    ; epuuids }
  in
  let page_export, pvalue_uuids =
    build_page_export' ~epuuids db eid page_blocks export_options
  in
  let page_entity =
    match Ldb.ent_of_id db eid with
    | Some e -> e
    | None -> fail "page not found"
  in
  let uuid_block_export =
    build_uuid_block_export ~epuuids db pvalue_uuids content_ref.content_ref_ents
      { (default_export_options ()) with page_entity = Some page_entity }
  in
  let alias_export =
    match ent_ref_ents page_entity "block/alias" with
    | [] -> Map []
    | aliases ->
        Map
          [ ( Keyword "pages-and-blocks"
            , Vector
                (List.map
                   (fun a ->
                     let bm =
                       match uuid_of a with
                       | Some u ->
                           shallow_copy_page a
                           @ [ "block/uuid", Uuid u
                             ; "build/keep-uuid?", Bool true ]
                       | None -> shallow_copy_page a
                     in
                     Map [ Keyword "page", map_of_bm bm ])
                   aliases) )
          ]
  in
  finalize_export_maps ~epuuids db
    [ page_export; uuid_block_export; content_ref.export_map; alias_export ]

(* cljs build-block-export *)
let build_block_export ~epuuids (db : db) (eid : entity_id) : value =
  let block_entity =
    match Ldb.ent_of_id db eid with
    | Some e -> e
    | None -> fail "block not found"
  in
  let property_value_ents =
    props_dissoc (ent_properties block_entity) [ "block/tags" ]
    |> List.filter_map (fun (_, v) -> ent_of_v db v)
  in
  let content_ref =
    build_content_ref_export ~epuuids db (block_entity :: property_value_ents)
  in
  let node_export =
    build_node_export ~epuuids db block_entity
      { (default_export_options ()) with
        include_uuid_fn = uuid_set_pred content_ref.content_ref_uuids
      ; include_uuid_set = content_ref.content_ref_uuids
      ; epuuids }
  in
  let pvalue_uuids =
    get_pvalue_uuids ~epuuids
      (bm_of_value (bm_get (bm_of_value node_export) "node"))
  in
  let uuid_block_export =
    build_uuid_block_export ~epuuids db pvalue_uuids content_ref.content_ref_ents
      (default_export_options ())
  in
  let export =
    finalize_export_maps ~epuuids db
      [ node_export; uuid_block_export; content_ref.export_map ]
  in
  let bm = bm_of_value export in
  map_of_bm
    (bm_put bm k_block (bm_get (bm_of_value node_export) "node"))

(* cljs build-nodes-export *)
let build_nodes_export ~epuuids (db : db) (nodes : entity list)
    (options : export_options) : value * string list =
  let node_pages = List.filter is_page_e nodes in
  let pages_export =
    merge_export_maps
      [ build_mixed_properties_and_classes_export ~epuuids db node_pages
          { (default_export_options ()) with shallow_copy = true }
      ; Map
          [ ( Keyword "pages-and-blocks"
            , Vector
                (List.map
                   (fun e -> Map [ Keyword "page", map_of_bm (shallow_copy_page e) ])
                   (List.filter
                      (fun e -> Ldb.internal_page e || Ldb.is_journal e)
                      node_pages)) )
          ]
      ]
  in
  let node_blocks = List.filter (fun e -> not (is_page_e e)) nodes in
  let by_page : (int, entity * entity list) Hashtbl.t = Hashtbl.create 16 in
  let page_order = ref [] in
  List.iter
    (fun (e : entity) ->
      match Ldb.ref_ids e "block/page" with
      | pid :: _ ->
          (match Ldb.ent_of_id db pid with
           | Some page_e ->
               if not (Hashtbl.mem by_page pid) then page_order := !page_order @ [ pid ];
               let _, es =
                 Option.value ~default:(page_e, []) (Hashtbl.find_opt by_page pid)
               in
               Hashtbl.replace by_page pid (page_e, es @ [ e ])
           | None -> ())
      | [] -> ())
    node_blocks;
  let pages_to_blocks =
    List.filter_map
      (fun pid ->
        match Hashtbl.find_opt by_page pid with
        | Some (page_e, blocks) ->
            let be =
              build_blocks_export ~epuuids db
                (sort_by_block_order blocks) options
            in
            Some
              (merge_export_maps
                 [ map_of_bm be
                 ; Map
                     [ Keyword "page", map_of_bm (shallow_copy_page page_e) ] ])
        | None -> None)
      !page_order
  in
  let pabs =
    List.map
      (fun m ->
        Map
          (List.filter
             (fun (k, _) ->
               Util.value_equal k (Keyword "page")
               || Util.value_equal k (Keyword "blocks"))
             (match m with Map kvs -> kvs | _ -> [])))
      pages_to_blocks
  in
  let props =
    List.concat_map
      (fun m -> bm_of_value (bm_get (bm_of_value m) "properties"))
      pages_to_blocks
  in
  let classes =
    List.concat_map
      (fun m -> bm_of_value (bm_get (bm_of_value m) "classes"))
      pages_to_blocks
  in
  let pvalue_uuids =
    List.concat_map
      (fun m ->
        List.filter_map
          (function Uuid u | String u -> Some u | _ -> None)
          (coll_items (bm_get (bm_of_value m) "pvalue-uuids")))
      pages_to_blocks
    |> dedup_values_str
  in
  let pab_export =
    let out = [ Keyword "pages-and-blocks", Vector pabs ] in
    let out =
      if props <> [] then
        out @ [ Keyword "properties", Map (List.map (fun (k, v) -> (Keyword k, v)) props) ]
      else out
    in
    let out =
      if classes <> [] then
        out @ [ Keyword "classes", Map (List.map (fun (k, v) -> (Keyword k, v)) classes) ]
      else out
    in
    Map out
  in
  (merge_export_maps [ pages_export; pab_export ], pvalue_uuids)

(* cljs build-view-nodes-export *)
let build_view_nodes_export ~epuuids (db : db) (rows : value list)
    (options : export_options) : value =
  let eids =
    if options.group_by then
      List.concat_map
        (fun r -> match r with Vector [ _; items ] | List [ _; items ] -> coll_items items | _ -> [])
        rows
    else rows
  in
  let nodes =
    List.filter_map
      (fun v ->
        match v with
        | Uuid u -> entity db (Lookup_ref ("block/uuid", Uuid u))
        | Int n -> Ldb.ent_of_id db n
        | _ -> None)
      eids
  in
  let property_value_ents =
    List.concat_map
      (fun e ->
        props_dissoc (ent_properties e) Db_property.public_db_attribute_properties
        |> List.filter_map (fun (_, v) -> ent_of_v db v))
      nodes
  in
  let content_ref =
    build_content_ref_export ~epuuids db (nodes @ property_value_ents)
  in
  let nodes_export, pvalue_uuids =
    build_nodes_export ~epuuids db nodes
      { (default_export_options ()) with
        include_uuid_fn = uuid_set_pred content_ref.content_ref_uuids
      ; include_uuid_set = content_ref.content_ref_uuids
      ; include_children = false
      ; epuuids }
  in
  let uuid_block_export =
    build_uuid_block_export ~epuuids db pvalue_uuids content_ref.content_ref_ents
      (default_export_options ())
  in
  finalize_export_maps ~epuuids db
    [ nodes_export; uuid_block_export; content_ref.export_map ]

(* cljs build-selected-nodes-export *)
let build_selected_nodes_export ~epuuids (db : db) (eids : value list) : value =
  let top_level =
    List.filter_map
      (fun v ->
        match v with
        | Int n -> Ldb.ent_of_id db n
        | Uuid u -> entity db (Lookup_ref ("block/uuid", Uuid u))
        | _ -> None)
      eids
  in
  let children_nodes =
    List.filter (fun e -> not (is_page_e e)) top_level
    |> List.concat_map (fun e ->
           match uuid_of e with
           | Some u ->
               (match Ldb.get_block_and_children db u with
                | _ :: rest -> rest
                | [] -> [])
           | None -> [])
    |> List.filter (fun e ->
           not
             (Option.is_some
                (Ldb.value e "logseq.property/created-from-property")))
  in
  let nodes = top_level @ children_nodes in
  let property_value_ents =
    List.concat_map
      (fun e ->
        props_dissoc (ent_properties e) Db_property.public_db_attribute_properties
        |> List.filter_map (fun (_, v) -> ent_of_v db v))
      nodes
  in
  let content_ref =
    build_content_ref_export ~epuuids db (nodes @ property_value_ents)
  in
  let nodes_export, pvalue_uuids =
    build_nodes_export ~epuuids db nodes
      { (default_export_options ()) with
        include_uuid_fn = uuid_set_pred content_ref.content_ref_uuids
      ; include_uuid_set = content_ref.content_ref_uuids
      ; include_children = true
      ; epuuids }
  in
  let uuid_block_export =
    build_uuid_block_export ~epuuids db pvalue_uuids content_ref.content_ref_ents
      (default_export_options ())
  in
  finalize_export_maps ~epuuids db
    [ nodes_export; uuid_block_export; content_ref.export_map ]

(* cljs build-graph-ontology-export *)
let build_graph_ontology_export ~epuuids (db : db) (options : export_options) : value =
  let exclude_regex =
    match options.exclude_namespaces with
    | [] -> None
    | names ->
        Some
          (Regexp.compile ("^(" ^ String.concat "|" names ^ ")(\\.|$)"))
  in
  let ns_excluded (ident : string) : bool =
    match (exclude_regex, kw_namespace ident) with
    | Some re, Some ns -> Regexp.test re ns
    | _ -> false
  in
  let user_property_idents =
    q_string db
      "[:find [?db-ident ...] :where [?p :db/ident ?db-ident] [?p :block/tags :logseq.class/Property] (not [?p :logseq.property/built-in?])]"
    |> List.filter_map (function
           | [ Result_value (Keyword k) ] -> Some k
           | _ -> None)
  in
  let user_property_idents =
    List.filter (fun i -> not (ns_excluded i)) user_property_idents
  in
  let properties =
    build_export_properties ~epuuids db user_property_idents
      { options with include_properties = true }
  in
  let class_ents =
    q_string db
      "[:find [?class ...] :where [?class :block/tags :logseq.class/Tag] (not [?class :logseq.property/built-in?])]"
    |> List.filter_map (function
           | [ Result_entity id ] -> Ldb.ent_of_id db id
           | _ -> None)
    |> List.filter (fun e ->
           match ident_of e with
           | Some i -> not (ns_excluded i)
           | None -> true)
  in
  let properties_config = properties in
  let classes =
    List.filter_map
      (fun (ent : entity) ->
        match ident_of ent with
        | None -> None
        | Some ident ->
            let ent_properties =
              props_dissoc (ent_properties ent)
                ("logseq.property.class/extends"
                 :: Db_property.public_db_attribute_properties)
            in
            let build_properties =
              buildable_properties ~epuuids db ent_properties properties_config
                options
              |> List.filter (fun (k, _) -> k <> "logseq.property.class/properties")
            in
            let cls = build_export_class ent options in
            let cls =
              if build_properties <> [] then
                cls @ [ "build/properties", map_of_bm build_properties ]
              else cls
            in
            Some (ident, cls))
      class_ents
  in
  let out = [] in
  let out =
    if properties <> [] then
      out
      @ [ ( Keyword "properties"
          , Map (List.map (fun (k, cfg) -> (Keyword k, map_of_bm cfg)) properties) ) ]
    else out
  in
  let out =
    if classes <> [] then
      out
      @ [ ( Keyword "classes"
          , Map (List.map (fun (k, cfg) -> (Keyword k, map_of_bm cfg)) classes) ) ]
    else out
  in
  Map out

(* cljs get-graph-content-ref-uuids *)
let get_graph_content_ref_uuids (db : db) (options : export_options) : string list =
  let block_titles =
    List.of_seq (datoms db Avet ~a:"block/title" ())
    |> List.filter_map (fun (d : datom) ->
           match d.v with String s -> Some s | _ -> None)
  in
  let block_links =
    List.of_seq (datoms db Avet ~a:"block/link" ())
    |> List.filter_map (fun (d : datom) ->
           match d.v with
           | Ref n ->
               (match Ldb.ent_of_id db n with
                | Some e -> uuid_of e
                | None -> None)
           | _ -> None)
  in
  let block_links =
    if options.exclude_built_in_pages then
      List.of_seq (datoms db Avet ~a:"block/link" ())
      |> List.filter_map (fun (d : datom) ->
             match Ldb.ent_of_id db d.e with
             | Some e ->
                 (match Ldb.ref_ent e "block/page" with
                  | Some p when Ldb.built_in p -> None
                  | _ ->
                      (match d.v with
                       | Ref n -> Option.bind (Ldb.ent_of_id db n) uuid_of
                       | _ -> None))
             | None -> None)
    else block_links
  in
  dedup_values_str
    (List.concat_map Db_content.get_matched_ids block_titles @ block_links)

(* cljs build-graph-pages-export *)
let build_graph_pages_export ~epuuids (db : db) (graph_ontology : value)
    (options : export_options) : value * string list =
  let options =
    { options with
      graph_ontology = Some graph_ontology
    ; exclude_ontology =
        (options.exclude_ontology || options.exclude_namespaces = []) }
  in
  let page_ids =
    (List.of_seq (datoms db Avet ~a:"block/tags" ~v:(Keyword "logseq.class/Page") ())
     @ List.of_seq
         (datoms db Avet ~a:"block/tags" ~v:(Keyword "logseq.class/Journal") ()))
    |> List.filter_map (fun (d : datom) ->
           match d.v with _ -> Some d.e)
    |> dedup_ints
  in
  let ontology_ids =
    (List.of_seq (datoms db Avet ~a:"block/tags" ~v:(Keyword "logseq.class/Tag") ())
     @ List.of_seq
         (datoms db Avet ~a:"block/tags" ~v:(Keyword "logseq.class/Property") ()))
    |> List.filter_map (fun (d : datom) -> Some d.e)
    |> dedup_ints
  in
  let page_options =
    { options with
      include_uuid_fn = always
    ; include_pvalue_uuid_fn = always }
  in
  let page_exports =
    List.map
      (fun eid ->
        let page_blocks = get_page_blocks db eid in
        build_page_export' ~epuuids db eid page_blocks page_options)
      page_ids
  in
  let ontology_page_exports =
    List.filter_map
      (fun eid ->
        let page_blocks =
          List.filter
            (fun e ->
              not
                (Option.is_some
                   (Ldb.value e "logseq.property/created-from-property")))
            (get_page_blocks db eid)
        in
        if page_blocks <> [] then
          Some
            (build_page_export' ~epuuids db eid page_blocks
               { page_options with ontology_page = true })
        else None)
      ontology_ids
  in
  let all_exports = page_exports @ ontology_page_exports in
  let filtered =
    List.filter
      (fun (export, _) ->
        if options.exclude_built_in_pages then
          let bm = bm_of_value export in
          match coll_items (bm_get bm "pages-and-blocks") with
          | pab :: _ ->
              let page = bm_of_value (bm_get (bm_of_value pab) "page") in
              let props = bm_of_value (bm_get page "build/properties") in
              not (truthy (bm_get props "logseq.property/built-in?"))
          | [] -> true
        else true)
      all_exports
  in
  let alias_uuids =
    List.concat_map
      (fun (export, _) ->
        List.concat_map
          (fun pab ->
            coll_items
              (bm_get (bm_of_value (bm_get (bm_of_value pab) "page")) "block/alias")
            |> List.filter_map uuid_of_uuid_vec)
          (coll_items (bm_get (bm_of_value export) "pages-and-blocks")))
      filtered
    @ (match bm_get_opt (bm_of_value graph_ontology) "classes" with
       | Some (Map kvs) ->
           List.concat_map
             (fun (_, v) ->
               coll_items (bm_get (bm_of_value v) "block/alias")
               |> List.filter_map uuid_of_uuid_vec)
             kvs
       | _ -> [])
    @ (match bm_get_opt (bm_of_value graph_ontology) "properties" with
       | Some (Map kvs) ->
           List.concat_map
             (fun (_, v) ->
               coll_items (bm_get (bm_of_value v) "block/alias")
               |> List.filter_map uuid_of_uuid_vec)
             kvs
       | _ -> [])
  in
  let uuids_to_keep =
    dedup_values_str
      (List.concat_map snd filtered
       @ alias_uuids
       @ List.filter_map
           (fun (export, _) ->
             match coll_items (bm_get (bm_of_value export) "pages-and-blocks") with
             | pab :: _ ->
                 (match bm_get_opt (bm_of_value (bm_get (bm_of_value pab) "page")) "block/uuid" with
                  | Some (Uuid u) | Some (String u) -> Some u
                  | _ -> None)
             | [] -> None)
           filtered)
  in
  let pabs =
    List.concat_map
      (fun (export, _) ->
        coll_items (bm_get (bm_of_value export) "pages-and-blocks"))
      filtered
  in
  ( Map
      [ Keyword "pages-and-blocks", Vector pabs
      ; Keyword "pvalue-uuids", Set (List.map (fun u -> Uuid u) uuids_to_keep) ]
  , uuids_to_keep )


(* cljs build-graph-files *)
let build_graph_files (db : db) (options : export_options) : value =
  List.of_seq (datoms db Avet ~a:"file/path" ())
  |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)
  |> List.stable_sort (fun (a : entity) (b : entity) ->
         String.compare
           (Option.value ~default:"" (Ldb.string_value a "file/path"))
           (Option.value ~default:"" (Ldb.string_value b "file/path")))
  |> List.map (fun e ->
         let ks =
           if options.include_timestamps then
             [ "file/path"; "file/content"; "file/created-at"; "file/last-modified-at" ]
           else [ "file/path"; "file/content" ]
         in
         map_of_bm
           (List.filter_map
              (fun a -> Option.map (fun v -> (a, v)) (Ldb.value e a))
              ks))
  |> fun fs -> Vector fs

(* cljs build-kv-values *)
let build_kv_values (db : db) : value =
  List.of_seq (datoms db Avet ~a:"kv/value" ())
  |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)
  |> List.filter (fun e -> ident_of e <> Some "logseq.kv/schema-version")
  |> List.map (fun e ->
         map_of_bm
           (List.filter_map
              (fun a -> Option.map (fun v -> (a, v)) (Ldb.value e a))
              [ "db/ident"; "kv/value" ]))
  |> fun kvs -> Vector kvs

(* cljs build-property-history *)
let build_property_history (db : db) : value =
  List.of_seq (datoms db Avet ~a:"logseq.property.history/block" ())
  |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)
  |> List.map (fun (h : entity) ->
         let bm =
           List.filter_map
             (fun a -> Option.map (fun v -> (a, v)) (Ldb.value h a))
             [ "block/uuid"; "block/created-at" ]
         in
         let bm =
           match Ldb.ref_ent h "logseq.property.history/block" with
           | Some b ->
               (match uuid_of b with
                | Some u ->
                    bm @ [ "logseq.property.history/block", uuid_vec u ]
                | None -> bm)
           | None -> bm
         in
         let bm =
           match Ldb.ref_ent h "logseq.property.history/property" with
           | Some p ->
               (match ident_of p with
                | Some i ->
                    bm @ [ "logseq.property.history/property", Keyword i ]
                | None -> bm)
           | None -> bm
         in
         let bm =
           match Ldb.ref_ent h "logseq.property.history/ref-value" with
           | Some r ->
               (match ident_of r with
                | Some i ->
                    bm @ [ "logseq.property.history/ref-value", Keyword i ]
                | None ->
                    (match uuid_of r with
                     | Some u ->
                         bm @ [ "logseq.property.history/ref-value", uuid_vec u ]
                     | None -> bm))
           | None -> bm
         in
         let bm =
           match Ldb.value h "logseq.property.history/scalar-value" with
           | Some v -> bm @ [ "logseq.property.history/scalar-value", v ]
           | None -> bm
         in
         map_of_bm bm)
  |> dedup_values
  |> fun hs -> Set hs

(* cljs remove-uuids-if-not-ref — full export map *)
let remove_uuids_if_not_ref (export_map : value) (all_ref_uuids : string list) : value =
  let ref_uuids =
    List.fold_left (fun s u -> SSet.add u s) SSet.empty all_ref_uuids
  in
  let clean m = remove_uuid_if_not_ref_given_uuids ref_uuids m in
  let mm = bm_of_value export_map in
  let mm =
    match bm_get_opt mm "classes" with
    | Some (Map kvs) ->
        bm_put mm "classes"
          (Map
             (List.map (fun (k, v) -> (k, map_of_bm (clean (bm_of_value v)))) kvs))
    | _ -> mm
  in
  let mm =
    match bm_get_opt mm "properties" with
    | Some (Map kvs) ->
        bm_put mm "properties"
          (Map
             (List.map (fun (k, v) -> (k, map_of_bm (clean (bm_of_value v)))) kvs))
    | _ -> mm
  in
  let mm =
    match bm_get_opt mm "pages-and-blocks" with
    | Some pabs ->
        let pabs' =
          List.map
            (fun pab ->
              let pm = bm_of_value pab in
              let page = clean (bm_of_value (bm_get pm "page")) in
              let blocks =
                List.map
                  (fun b -> map_of_bm (clean (bm_of_value b)))
                  (coll_items (bm_get pm "blocks"))
              in
              (* walk nested block-property-value maps too *)
              let page_map =
                Map
                  [ Keyword "page", map_of_bm page
                  ; Keyword "blocks", Vector blocks ]
              in
              postwalk
                (fun v ->
                  if Sqlite_build.block_property_value v then
                    map_of_bm (clean (bm_of_value v))
                  else v)
                page_map)
            (coll_items pabs)
        in
        bm_put mm "pages-and-blocks" (Vector pabs')
    | None -> mm
  in
  map_of_bm mm

(* cljs add-ontology-for-include-namespaces *)
(* cljs sqlite-build/get-used-properties-from-options — used-property
   idents extracted from an export map's :build/properties maps (page,
   block and nested pvalue pages, plus property/class configs). *)
let get_used_property_idents_from_options (m : value) : string list =
  let mm = bm_of_value m in
  let pabs = coll_items (bm_get mm "pages-and-blocks") in
  let rec node_props_of_node (bm : BM.t) : (attr * value) list =
    let props = bm_of_value (bm_get bm "build/properties") in
    let nested_pvalue_pages =
      List.concat_map
        (fun (_, v) ->
          List.filter_map
            (fun x ->
              if Sqlite_build.page_prop_value x then
                (match x with
                 | Vector [ _; s ] | List [ _; s ] -> Some s
                 | _ -> None)
              else if Sqlite_build.block_property_value x then Some x
              else None)
            (Sqlite_build.items_of_set_or_one v))
        props
    in
    match nested_pvalue_pages with
    | [] -> props
    | _ ->
        props
        @ List.concat_map node_props_of_node
            (List.map bm_of_value nested_pvalue_pages)
  in
  let page_block_properties =
    List.concat_map
      (fun pab ->
        let pm = bm_of_value pab in
        let nodes =
          List.map bm_of_value (coll_items (bm_get pm "blocks"))
          @ [ bm_of_value (bm_get pm "page") ]
        in
        List.concat_map node_props_of_node nodes)
      pabs
  in
  let property_properties =
    match bm_get_opt mm "properties" with
    | Some (Map kvs) ->
        List.concat_map
          (fun (_, cfg) ->
            bm_of_value (bm_get (bm_of_value cfg) "build/properties"))
          kvs
    | _ -> []
  in
  let class_properties =
    match bm_get_opt mm "classes" with
    | Some (Map kvs) ->
        List.concat_map
          (fun (_, cfg) ->
            let cb = bm_of_value cfg in
            List.map
              (fun k -> (k, Keyword "logseq.db.sqlite.build/no-value"))
              (List.filter_map
                 (function Keyword k -> Some k | _ -> None)
                 (coll_items (bm_get cb "build/class-properties")))
            @ bm_of_value (bm_get cb "build/properties"))
          kvs
    | _ -> []
  in
  let dedup_pairs xs =
    List.fold_left
      (fun acc ((k, v) as pair) ->
        if
          List.exists
            (fun (k2, v2) -> k2 = k && Util.value_equal v2 v)
            acc
        then acc
        else acc @ [ pair ])
      [] xs
  in
  class_properties @ page_block_properties @ property_properties
  |> dedup_pairs
  |> List.map fst
  |> dedup_values_str

(* cljs add-ontology-for-include-namespaces *)
let add_ontology_for_include_namespaces (db : db) (graph_export : value) : value =
  let auto_include =
    List.map kw_name
      (kw_set_of_value
         (bm_get (bm_of_value graph_export) k_auto_include_namespaces))
  in
  let include_regex =
    Regexp.compile ("^(" ^ String.concat "|" auto_include ^ ")(\\.|$)")
  in
  let used_idents = get_used_property_idents_from_options graph_export in
  let used =
    List.filter
      (fun k -> not (Db_property.internal_property k))
      used_idents
    |> List.filter_map (fun k ->
           match kw_namespace k with
           | Some ns when Regexp.test include_regex ns ->
               (match entity db (Ident k) with
                | Some e ->
                    Some
                      ( k
                      , map_of_bm
                          (Sqlite_build.select_keys (ent_bm e)
                             [ "logseq.property/type"; "db/cardinality" ]) )
                | None -> None)
           | _ -> None)
  in
  let merged =
    merge_export_maps
      [ Map
          (match bm_get_opt (bm_of_value graph_export) "properties" with
           | Some p -> [ Keyword "properties", p ]
           | None -> [])
      ; Map
          (if used = [] then []
           else
             [ ( Keyword "properties"
               , Map (List.map (fun (k, v) -> (Keyword k, v)) used) ) ])
      ]
  in
  map_of_bm
    (bm_dissoc (bm_of_value merged) [ "pages-and-blocks"; "classes" ])

(* cljs datom-export? *)
let datom_export (export_map : value) : bool =
  bm_get (bm_of_value export_map) k_graph_format = Keyword "datoms"

let graph_datom_export_excluded_kvs =
  [ "logseq.kv/local-graph-uuid"
  ; "logseq.kv/graph-uuid"
  ; "logseq.kv/graph-local-tx"
  ; "logseq.kv/remote-schema-version"
  ; "logseq.kv/graph-rtc-e2ee?"
  ; "logseq.kv/graph-remote?"
  ; "logseq.kv/import-type"
  ; "logseq.kv/imported-at"
  ; "logseq.kv/graph-backup-folder"
  ; "logseq.kv/graph-last-gc-at"
  ; "logseq.kv/graph-git-sha" ]

let graph_datom_export_excluded_attrs =
  [ "block/tx-id"
  ; "logseq.property.embedding/hnsw-label"
  ; "logseq.property.embedding/hnsw-label-updated-at"
  ; "logseq.property/created-by-ref"
  ; "logseq.property.user/email"
  ; "logseq.property.user/name"
  ; "logseq.property.user/avatar" ]

let graph_datom_export_excluded_eids (db : db) : int list =
  List.filter_map
    (fun ident ->
      match entity db (Ident ident) with
      | Some e -> Some e.id
      | None -> None)
    graph_datom_export_excluded_kvs

(* cljs export-datom *)
let export_datom (db : db) (d : datom) : value =
  let v =
    match d.v with
    | Vector _ | List _ ->
        (* lookup-ref *)
        (match coll_items d.v with
         | [ Keyword a; x ] ->
             (match entity db (Lookup_ref (a, x)) with
              | Some e -> Int e.id
              | None -> d.v)
         | _ -> d.v)
    | _ -> d.v
  in
  Vector [ Int d.e; Keyword d.a; v ]

(* cljs build-graph-datoms-export *)
let build_graph_datoms_export (db : db) : value =
  let excluded = graph_datom_export_excluded_eids db in
  let datoms' =
    List.of_seq (datoms db Eavt ())
    |> List.filter (fun (d : datom) ->
           not (List.mem d.e excluded)
           && not (List.mem d.a graph_datom_export_excluded_attrs))
    |> List.map (export_datom db)
    |> List.stable_sort (fun a b ->
           match a, b with
           | Vector (Int x :: _), Vector (Int y :: _) -> compare x y
           | _ -> 0)
  in
  Map
    [ Keyword k_schema_version, Sqlite_create_graph.db_schema_version
    ; Keyword k_graph_format, Keyword "datoms"
    ; Keyword "datoms", Vector datoms' ]

(* cljs build-graph-export *)
let build_graph_export (db : db) (options : export_options) : value =
  let epuuids = ref SSet.empty in
  let options = { options with property_value_uuids = true; include_alias = true } in
  let content_ref_uuids = get_graph_content_ref_uuids db options in
  let ontology_options = { options with include_uuid = true } in
  let ontology_export =
    build_graph_ontology_export ~epuuids db ontology_options
  in
  let ontology_pvalue_uuids =
    dedup_values_str
      ((match bm_get_opt (bm_of_value ontology_export) "properties" with
        | Some (Map kvs) ->
            List.concat_map
              (fun (_, v) -> get_pvalue_uuids ~epuuids (bm_of_value v))
              kvs
        | _ -> [])
       @
       match bm_get_opt (bm_of_value ontology_export) "classes" with
       | Some (Map kvs) ->
           List.concat_map
             (fun (_, v) -> get_pvalue_uuids ~epuuids (bm_of_value v))
             kvs
       | _ -> [])
  in
  let pages_export, pages_pvalue_uuids =
    build_graph_pages_export ~epuuids db ontology_export
      { options with
        include_pvalue_uuid_fn = uuid_set_pred content_ref_uuids }
  in
  let graph_export =
    merge_export_maps [ ontology_export; pages_export ]
  in
  let graph_export =
    if options.exclude_namespaces <> [] then
      let mm = bm_of_value graph_export in
      map_of_bm
        (bm_put mm k_auto_include_namespaces
           (Set (List.map (fun n -> Keyword n) options.exclude_namespaces)))
    else graph_export
  in
  let property_history = build_property_history db in
  let property_history_ref_uuids =
    List.concat_map
      (fun h ->
        let hm = bm_of_value h in
        List.filter_map uuid_of_uuid_vec
          [ bm_get hm "logseq.property.history/block"
          ; bm_get hm "logseq.property.history/ref-value" ])
      (coll_items property_history)
    |> dedup_values_str
  in
  let all_ref_uuids =
    dedup_values_str
      (content_ref_uuids
       @ ontology_pvalue_uuids @ pages_pvalue_uuids
       @ property_history_ref_uuids)
  in
  let files =
    if not options.exclude_files then build_graph_files db options else Vector []
  in
  let kv_values = build_kv_values db in
  let graph_export' =
    remove_uuids_if_not_ref graph_export all_ref_uuids
  in
  let mm = bm_of_value graph_export' in
  let mm =
    (match bm_get_opt mm "pages-and-blocks" with
     | Some pabs -> bm_put mm "pages-and-blocks" (sort_pages_and_blocks (coll_items pabs))
     | None -> mm)
    |> fun mm -> bm_put mm k_schema_version Sqlite_create_graph.db_schema_version
  in
  let mm =
    if not options.exclude_files then bm_put mm k_graph_files files else mm
  in
  let mm = bm_put mm k_kv_values kv_values in
  let mm = bm_put mm k_property_history property_history in
  map_of_bm mm

(* cljs find-undefined-classes-and-properties *)
let find_undefined_classes_and_properties (export_map : value) : value =
  let mm = bm_of_value export_map in
  let pabs = coll_items (bm_get mm "pages-and-blocks") in
  let referenced_classes =
    (List.concat_map
       (fun (_, cfg) ->
         List.filter_map
           (function Keyword k -> Some k | _ -> None)
           (coll_items (bm_get (bm_of_value cfg) "build/property-classes")))
       (match bm_get mm "properties" with Map kvs -> kvs | _ -> []))
    @ (List.filter_map
         (fun (_, cfg) ->
           match bm_get_opt (bm_of_value cfg) "class/parent" with
           | Some (Keyword k) -> Some k
           | _ -> None)
         (match bm_get mm "classes" with Map kvs -> kvs | _ -> []))
    @ List.concat_map
        (fun pab ->
          let page = bm_of_value (bm_get (bm_of_value pab) "page") in
          List.filter_map
            (function Keyword k -> Some k | _ -> None)
            (coll_items (bm_get page "block/tags")))
        pabs
    @ List.concat_map
        (fun pab ->
          Sqlite_build.extract_from_blocks
            (List.map bm_of_value (coll_items (bm_get (bm_of_value pab) "blocks")))
            (fun m ->
              List.filter_map
                (function Keyword k -> Some k | _ -> None)
                (coll_items (bm_get m "build/tags"))))
        pabs
    |> List.filter (fun k -> not (Db_class.logseq_class_kw k))
    |> dedup_values_str
  in
  let defined_classes =
    List.filter_map (fun (k, _) -> match k with Keyword s -> Some s | _ -> None)
      (match bm_get mm "classes" with Map kvs -> kvs | _ -> [])
  in
  let undefined_classes =
    List.filter (fun k -> not (List.mem k defined_classes)) referenced_classes
  in
  let referenced_properties =
    (List.concat_map
       (fun (_, cfg) ->
         List.filter_map
           (function Keyword k -> Some k | _ -> None)
           (coll_items (bm_get (bm_of_value cfg) "build/class-properties")))
       (match bm_get mm "classes" with Map kvs -> kvs | _ -> []))
    @ List.concat_map
        (fun pab ->
          let page = bm_of_value (bm_get (bm_of_value pab) "page") in
          List.map
            (fun (k, _) -> k)
            (bm_of_value (bm_get page "build/properties")))
        pabs
    @ List.concat_map
        (fun pab ->
          Sqlite_build.extract_from_blocks
            (List.map bm_of_value (coll_items (bm_get (bm_of_value pab) "blocks")))
            (fun m -> List.map fst (bm_of_value (bm_get m "build/properties"))))
        pabs
    |> List.filter (fun k -> not (Db_property.internal_property k))
    |> dedup_values_str
  in
  let defined_properties =
    List.filter_map (fun (k, _) -> match k with Keyword s -> Some s | _ -> None)
      (match bm_get mm "properties" with Map kvs -> kvs | _ -> [])
  in
  let undefined_properties =
    List.filter
      (fun k -> not (List.mem k defined_properties))
      referenced_properties
  in
  let out = [] in
  let out =
    if undefined_classes <> [] then
      out @ [ Keyword "classes", Set (List.map (fun k -> Keyword k) undefined_classes) ]
    else out
  in
  let out =
    if undefined_properties <> [] then
      out
      @ [ Keyword "properties", Set (List.map (fun k -> Keyword k) undefined_properties) ]
    else out
  in
  Map out

(* cljs find-undefined-uuids *)
let find_undefined_uuids ~(epuuids : SSet.t ref) (db : db) (export_map : value) : string list =
  let mm = bm_of_value export_map in
  let classes = bm_of_value (bm_get mm "classes") in
  let properties = bm_of_value (bm_get mm "properties") in
  let pabs = coll_items (bm_get mm "pages-and-blocks") in
  let pvalue_known = ref [] in
  let _ =
    postwalk
      (fun v ->
        (match v with
         | Map _ when Sqlite_build.block_property_value v ->
             (match bm_get_opt (bm_of_value v) "block/uuid" with
              | Some (Uuid u) | Some (String u) ->
                  pvalue_known := u :: !pvalue_known
              | _ -> ())
         | _ -> ());
        v)
      (Vector pabs)
  in
  let known_uuids =
    (List.filter_map
       (fun (_, v) ->
         match bm_get_opt (bm_of_value v) "block/uuid" with
         | Some (Uuid u) | Some (String u) -> Some u
         | _ -> None)
       classes
     @ List.filter_map
         (fun (_, v) ->
           match bm_get_opt (bm_of_value v) "block/uuid" with
           | Some (Uuid u) | Some (String u) -> Some u
           | _ -> None)
         properties
     @ List.filter_map
         (fun pab ->
           match
             bm_get_opt (bm_of_value (bm_get (bm_of_value pab) "page")) "block/uuid"
           with
           | Some (Uuid u) | Some (String u) -> Some u
           | _ -> None)
         pabs
     @ List.concat_map
         (fun pab ->
           Sqlite_build.extract_from_blocks
             (List.map bm_of_value (coll_items (bm_get (bm_of_value pab) "blocks")))
             (fun m ->
               match bm_get_opt m "block/uuid" with
               | Some (Uuid u) | Some (String u) -> [ u ]
               | _ -> []))
         pabs
     @ !pvalue_known)
    |> dedup_values_str
  in
  let ref_uuids =
    (List.concat_map
       (fun (_, v) ->
         coll_items (bm_get (bm_of_value v) "block/alias")
         |> List.filter_map uuid_of_uuid_vec)
       classes
     @ List.concat_map
         (fun (_, v) ->
           coll_items (bm_get (bm_of_value v) "block/alias")
           |> List.filter_map uuid_of_uuid_vec)
         properties
     @ List.concat_map
         (fun pab ->
           coll_items (bm_get (bm_of_value (bm_get (bm_of_value pab) "page")) "block/alias")
           |> List.filter_map uuid_of_uuid_vec)
         pabs
     @ List.concat_map (fun (_, v) -> get_pvalue_uuids ~epuuids (bm_of_value v)) classes
     @ List.concat_map
         (fun (_, v) -> get_pvalue_uuids ~epuuids (bm_of_value v))
         properties
     @ List.concat_map
         (fun pab -> get_pvalue_uuids ~epuuids (bm_of_value (bm_get (bm_of_value pab) "page")))
         pabs
     @ List.concat_map
         (fun pab ->
           Sqlite_build.extract_from_blocks
             (List.map bm_of_value (coll_items (bm_get (bm_of_value pab) "blocks")))
             (fun m -> get_pvalue_uuids ~epuuids m))
         pabs)
    (* drop uuids of created-from-property blocks *)
    |> List.filter (fun u ->
           match entity db (Lookup_ref ("block/uuid", Uuid u)) with
           | Some e ->
               Option.is_none (Ldb.value e "logseq.property/created-from-property")
           | None -> true)
    |> dedup_values_str
  in
  List.filter (fun u -> not (List.mem u known_uuids)) ref_uuids

(* cljs remove-namespaced-keys *)
let remove_namespaced_keys (m : value) : value =
  match m with
  | Map kvs ->
      Map
        (List.filter
           (fun (k, _) ->
             match k with
             | Keyword s -> kw_namespace s <> Some ns
             | _ -> true)
           kvs)
  | _ -> m

(* cljs patch-invalid-keywords *)
let patch_invalid_keywords (m : value) : value =
  let initial_version =
    List.find_map
      (fun kv ->
        let kvm = bm_of_value kv in
        match bm_get_opt kvm "db/ident" with
        | Some (Keyword "logseq.kv/graph-initial-schema-version") ->
            bm_get_opt kvm "kv/value"
        | _ -> None)
      (coll_items (bm_get (bm_of_value m) k_kv_values))
  in
  let skip =
    match initial_version with
    | Some v ->
        (try
           Db_schema.compare_schema_version
             (Db_schema.parse_schema_version v)
             { Db_schema.sv_major = 64; sv_minor = Some 8 }
           > 0
         with _ -> false)
    | None -> false
  in
  if skip then m
  else
    let digit_re = Regexp.compile "^(\\d)" in
    let valid_char c =
      (c >= '0' && c <= '9')
      || (c >= 'a' && c <= 'z')
      || (c >= 'A' && c <= 'Z')
      || List.mem c [ '*'; '+'; '!'; '_'; '\''; '?'; '<'; '>'; '='; '-' ]
    in
    postwalk
      (fun v ->
        match v with
        | Keyword s ->
            (match kw_namespace s with
             | Some nsn when String.length nsn >= 5 && String.sub nsn 0 5 = "user." ->
                 let name = kw_name s in
                 let name =
                   if Regexp.test digit_re name then "NUM-" ^ name else name
                 in
                 let name =
                   String.of_seq (Seq.filter valid_char (String.to_seq name))
                 in
                 if name <> kw_name s then Keyword (nsn ^ "/" ^ name) else v
             | _ -> v)
        | _ -> v)
      m

(* cljs basic-validate-export *)
let basic_validate_export ~(epuuids : SSet.t ref) (db : db) (export_map : value)
    (graph_options : export_options) : unit =
  if not (datom_export export_map) then begin
    let export_map = remove_namespaced_keys export_map in
    if graph_options.exclude_namespaces = [] then
      Sqlite_build.validate_export_map export_map;
    let undefined_uuids = find_undefined_uuids ~epuuids db export_map in
    let undefined =
      let parts =
        if graph_options.exclude_namespaces = [] then
          bm_of_value (find_undefined_classes_and_properties export_map)
        else []
      in
      let parts =
        if undefined_uuids <> [] then
          parts
          @ [ ( "uuids"
              , Set (List.map (fun u -> Uuid u) undefined_uuids) ) ]
        else parts
      in
      parts
    in
    if undefined <> [] then
      fail
        ("The following classes, uuids and properties are not defined: "
         ^ Db_property_build.str_of_value (map_of_bm undefined))
  end

(* cljs build-export *)
let build_export (db : db) (options_v : value) : value =
  let options_m = bm_of_value options_v in
  let export_type =
    match bm_get_opt options_m "export-type" with
    | Some (Keyword t) -> t
    | _ -> fail "Missing :export-type"
  in
  let options = export_options_of_value db options_v in
  let export_map =
    match export_type with
    | "block" ->
        (match bm_get_opt options_m "block-id" with
         | Some (Int eid) -> build_block_export ~epuuids:options.epuuids db eid
         | _ -> fail "Missing :block-id")
    | "page" ->
        (match bm_get_opt options_m "page-id" with
         | Some (Int eid) -> build_page_export ~epuuids:options.epuuids db eid
         | _ -> fail "Missing :page-id")
    | "view-nodes" ->
        build_view_nodes_export ~epuuids:options.epuuids db
          (coll_items (bm_get options_m "rows"))
          options
    | "selected-nodes" ->
        build_selected_nodes_export ~epuuids:options.epuuids db
          (coll_items (bm_get options_m "node-ids"))
    | "graph-ontology" ->
        build_graph_ontology_export ~epuuids:options.epuuids db
          (default_export_options ())
    | "graph" -> build_graph_datoms_export db
    | "graph-human" ->
        build_graph_export db
          (match bm_get_opt options_m "graph-options" with
           | Some g -> graph_options_of_value db g
           | None -> graph_options_of_value db (Map []))
    | t -> fail (t ^ " is an invalid export-type")
  in
  let export_map = patch_invalid_keywords export_map in
  let graph_options =
    match bm_get_opt options_m "graph-options" with
    | Some g -> export_options_of_value db g
    | None -> options
  in
  if graph_options.catch_validation_errors then
    (try basic_validate_export ~epuuids:options.epuuids db export_map graph_options
     with Export_error e -> Printf.eprintf "Caught error: %s\n%!" e)
  else basic_validate_export ~epuuids:options.epuuids db export_map graph_options;
  map_of_bm
    (bm_put (bm_of_value export_map) k_export_type (Keyword export_type))

(* ---- import fns ---- *)

type import_txs =
  { init_tx : value list
  ; block_props_tx : value list
  ; misc_tx : value list }

(* cljs add-uuid-to-page-if-exists *)
let add_uuid_to_page_if_exists (db : db)
    (import_to_existing_page_uuids : (string * string) list ref)
    (options : export_options) (m : BM.t) : BM.t =
  let ent =
    match bm_get_opt m "build/journal" with
    | Some (Int day) ->
        (match
           List.of_seq (datoms db Avet ~a:"block/journal-day" ~v:(Int day) ())
         with
         | d :: _ -> Ldb.ent_of_id db d.e
         | [] -> None)
    | _ ->
        (match bm_get_opt m "block/title" with
         | Some t -> Ldb.get_case_page db t
         | None -> None)
  in
  match ent with
  | Some e ->
      (match bm_get_opt m "block/uuid", uuid_of e with
       | Some (Uuid u), Some eu | Some (String u), Some eu ->
           import_to_existing_page_uuids := (u, eu) :: !import_to_existing_page_uuids;
           let m' = bm_put m "block/uuid" (Uuid eu) in
           (if options.existing_pages_keep_properties then
              match bm_get_opt m' "build/properties" with
              | Some props_v ->
                  let props =
                    bm_of_value props_v
                    |> List.filter (fun (k, _) ->
                           Option.is_none (Ldb.value e k))
                  in
                  bm_put m' "build/properties" (map_of_bm props)
              | None -> m'
            else m')
       | _ -> m)
  | None -> m

(* cljs update-existing-properties *)
let update_existing_properties (db : db)
    (property_conflicts : (string * BM.t * BM.t) list ref)
    (properties : (string * BM.t) list) : (string * BM.t) list =
  List.map
    (fun (k, v) ->
      match entity db (Ident k) with
      | Some ent ->
          let sel = [ "logseq.property/type"; "db/cardinality" ] in
          let actual = Sqlite_build.select_keys v sel in
          let expected = Sqlite_build.select_keys (ent_bm ent) sel in
          if actual <> expected then
            property_conflicts := (k, actual, expected) :: !property_conflicts;
          (match uuid_of ent with
           | Some u -> (k, v @ [ "block/uuid", Uuid u ])
           | None -> (k, v))
      | None -> (k, v))
    properties

(* cljs check-for-existing-entities *)
let check_for_existing_entities (db : db) (export_map : value)
    (import_options : export_options)
    (property_conflicts : (string * BM.t * BM.t) list ref) : value =
  let mm = bm_of_value export_map in
  let import_to_existing_page_uuids = ref [] in
  let export_type =
    match bm_get_opt mm k_export_type with
    | Some (Keyword t) -> t
    | _ -> ""
  in
  let out = [ "build-existing-tx?", Bool true; "extract-content-refs?", Bool false ] in
  let out =
    match bm_get_opt mm "pages-and-blocks" with
    | Some pabs ->
        out
        @ [ ( "pages-and-blocks"
            , Vector
                (List.map
                   (fun pab ->
                     let pm = bm_of_value pab in
                     let page =
                       add_uuid_to_page_if_exists db
                         import_to_existing_page_uuids import_options
                         (bm_of_value (bm_get pm "page"))
                     in
                     map_of_bm (bm_put pm "page" (map_of_bm page)))
                   (coll_items pabs)) ) ]
    | None -> out
  in
  let out =
    match bm_get_opt mm "classes" with
    | Some (Map kvs) ->
        out
        @ [ ( "classes"
            , Map
                (List.map
                   (fun (k, v) ->
                     match k with
                     | Keyword ident ->
                         (match entity db (Ident ident) with
                          | Some ent ->
                              (match uuid_of ent with
                               | Some u ->
                                   ( k
                                   , map_of_bm
                                       (bm_of_value v @ [ "block/uuid", Uuid u ]) )
                               | None -> (k, v))
                          | None -> (k, v))
                     | _ -> (k, v))
                   kvs) ) ]
    | _ -> out
  in
  let out =
    match bm_get_opt mm "properties" with
    | Some (Map kvs) ->
        let props' =
          update_existing_properties db property_conflicts
            (List.filter_map
               (fun (k, v) ->
                 match k with Keyword s -> Some (s, bm_of_value v) | _ -> None)
               kvs)
        in
        out
        @ [ ( "properties"
            , Map (List.map (fun (k, v) -> (Keyword k, map_of_bm v)) props') ) ]
    | _ -> out
  in
  let out =
    if List.mem export_type [ "graph"; "graph-human" ] then
      out @ [ "translate-property-values?", Bool false ]
    else out
  in
  let out =
    if List.mem export_type [ "graph"; "graph-human" ] then
      (* merge (dissoc export-map :pages-and-blocks :classes :properties) *)
      List.filter (fun (k, _) -> k <> "pages-and-blocks" && k <> "classes" && k <> "properties") out
      @ bm_dissoc mm [ "pages-and-blocks"; "classes"; "properties" ]
    else out
  in
  let export_map' = Map (List.map (fun (k, v) -> (Keyword k, v)) out) in
  let export_map' =
    if List.mem export_type [ "graph"; "graph-human" ] then export_map'
    else
      postwalk
        (fun v ->
          match v with
          | Vector [ Keyword "build/page"; page_m ]
          | List [ Keyword "build/page"; page_m ] ->
              Vector
                [ Keyword "build/page"
                ; map_of_bm
                    (add_uuid_to_page_if_exists db import_to_existing_page_uuids
                       import_options (bm_of_value page_m)) ]
          | _ -> v)
        export_map'
  in
  (* Update uuid references of all pages whose uuids were remapped *)
  postwalk
    (fun v ->
      match v with
      | Vector [ Keyword "block/uuid"; Uuid u ]
      | Vector [ Keyword "block/uuid"; String u ] ->
          (match List.assoc_opt u !import_to_existing_page_uuids with
           | Some nu -> uuid_vec nu
           | None -> v)
      | _ -> v)
    export_map'

(* cljs build-block-import-options *)
let build_block_import_options (current_block : entity) (export_map : value) : value =
  let mm = bm_of_value export_map in
  let block = bm_of_value (bm_get mm k_block) in
  let block =
    block
    @ [ ( "block/uuid"
        , (match uuid_of current_block with
           | Some u -> Uuid u
           | None -> Nil) )
      ; ( "block/page"
        , map_of_bm
            (Sqlite_build.select_keys
               (ent_bm
                  (Option.value ~default:current_block
                     (Ldb.ref_ent current_block "block/page")))
               [ "block/uuid" ]) )
      ]
  in
  let page_of_block =
    bm_of_value (bm_get (bm_of_value (map_of_bm block)) "block/page")
  in
  let pabs =
    Vector
      [ Map
          [ Keyword "page", map_of_bm (Sqlite_build.select_keys page_of_block [ "block/uuid" ])
          ; Keyword "blocks"
          , Vector [ map_of_bm (bm_dissoc block [ "block/page" ]) ] ]
      ]
  in
  merge_export_maps
    [ export_map
    ; Map [ Keyword "pages-and-blocks", pabs ] ]

(* cljs current-db-retract-tx *)
let current_db_retract_tx (db : db) : value list =
  List.of_seq (datoms db Eavt ())
  |> List.map (fun (d : datom) -> d.e)
  |> dedup_ints
  |> List.map (fun e -> Vector [ Keyword "db/retractEntity"; Int e ])

let datom_schema_attrs =
  [ "db/ident"; "db/cardinality"; "db/valueType"; "db/unique"; "db/index" ]

(* cljs schema-datom-eids *)
let schema_datom_eids (datoms : value list) : int list =
  let ident_eids =
    List.filter_map
      (fun v ->
        match coll_items v with
        | [ Int e; Keyword a; _ ] when a = "db/ident" -> Some e
        | _ -> None)
      datoms
  in
  let schema_eids =
    List.filter_map
      (fun v ->
        match coll_items v with
        | [ Int e; Keyword a; _ ] when a <> "db/ident" && List.mem a datom_schema_attrs ->
            Some e
        | _ -> None)
      datoms
  in
  List.filter (fun e -> List.mem e schema_eids) ident_eids |> dedup_ints

(* cljs resolve-lookup-refs *)
let resolve_lookup_refs (datoms : value list) : value list =
  let lookup_eids =
    List.filter_map
      (fun v ->
        match coll_items v with
        | [ Int e; Keyword a; vv ] -> Some ((a, vv), e)
        | _ -> None)
      datoms
  in
  List.map
    (fun v ->
      match coll_items v with
      | [ Int e; Keyword a; Vector [ Keyword la; lv ] ] ->
          let resolved =
            match
              List.find_opt
                (fun ((ka, kv), _) ->
                  ka = la && Util.value_equal kv lv)
                lookup_eids
            with
            | Some (_, e') -> Int e'
            | None -> Vector [ Keyword la; lv ]
          in
          Vector [ Int e; Keyword a; resolved ]
      | _ -> v)
    datoms

(* cljs datoms-for-import *)
let datoms_for_import (datoms : value list) : value list =
  let datoms = resolve_lookup_refs datoms in
  let schema_eids = schema_datom_eids datoms in
  let is_schema v =
    match coll_items v with
    | [ Int e; Keyword a; _ ] -> List.mem e schema_eids && List.mem a datom_schema_attrs
    | _ -> false
  in
  let schema_datoms = List.filter is_schema datoms in
  schema_datoms @ List.filter (fun d -> not (List.exists (Util.value_equal d) schema_datoms)) datoms

(* cljs build-datom-import *)
let build_datom_import (export_map : value) (db : db) : import_txs =
  let retract = current_db_retract_tx db in
  let adds =
    List.map
      (fun d ->
        match coll_items d with
        | [ e; a; v ] -> Vector [ Keyword "db/add"; e; a; v ]
        | _ -> d)
      (datoms_for_import
         (coll_items (bm_get (bm_of_value export_map) "datoms")))
  in
  { init_tx = retract @ adds; block_props_tx = []; misc_tx = [] }

(* cljs build-import -> Ok txs | Error msg *)
let build_import (export_map : value) (db : db) (current_block : entity option) :
    (import_txs, string) Result.t =
  if datom_export export_map then Ok (build_datom_import export_map db)
  else begin
    let mm = bm_of_value export_map in
    let export_map =
      match bm_get_opt mm k_block, current_block with
      | Some b, Some cb when truthy b ->
          build_block_import_options cb export_map
      | _ -> export_map
    in
    let export_type =
      match bm_get_opt (bm_of_value export_map) k_export_type with
      | Some (Keyword t) -> t
      | _ -> ""
    in
    let auto_includes =
      kw_set_of_value (bm_get (bm_of_value export_map) k_auto_include_namespaces)
    in
    let export_map =
      if List.mem export_type [ "graph"; "graph-human" ] && auto_includes <> [] then
        let mm = bm_of_value export_map in
        let base = bm_dissoc mm [ "properties"; k_auto_include_namespaces ] in
        let added =
          add_ontology_for_include_namespaces db export_map
        in
        map_of_bm
          (bm_of_value
             (merge_export_maps
                [ map_of_bm base; added ]))
      else export_map
    in
    let property_conflicts = ref [] in
    let export_map =
      check_for_existing_entities db export_map
        (let o = default_export_options () in
         { o with existing_pages_keep_properties =
             (match bm_get_opt (bm_of_value export_map) k_import_options with
              | Some io ->
                  truthy (bm_get (bm_of_value io) "existing-pages-keep-properties?")
              | None -> false) })
        property_conflicts
    in
    if !property_conflicts <> [] then
      Error
        ("The following imported properties conflict with the current graph: "
         ^ String.concat ", "
             (List.map
                (fun (k, _, _) -> k)
                (List.rev !property_conflicts)))
    else if List.mem export_type [ "graph"; "graph-human" ] then
      let init_tx, block_props_tx =
        Sqlite_build.build_blocks_tx (remove_namespaced_keys export_map)
      in
      let misc =
        coll_items (bm_get (bm_of_value export_map) k_graph_files)
        @ coll_items (bm_get (bm_of_value export_map) k_kv_values)
        @ coll_items (bm_get (bm_of_value export_map) k_property_history)
      in
      Ok { init_tx; block_props_tx; misc_tx = misc }
    else
      let init_tx, block_props_tx =
        Sqlite_build.build_blocks_tx (remove_namespaced_keys export_map)
      in
      Ok { init_tx; block_props_tx; misc_tx = [] }
  end

(* cljs import-tx-data *)
let import_tx_data (txs : import_txs) : value list =
  txs.init_tx @ txs.block_props_tx @ txs.misc_tx

(* cljs validate-import-tx-data internals *)
let disallowed_key (e : Malli.error) : bool =
  e.Malli.e_message = "disallowed key"

let disallowed_key_attr (e : Malli.error) : string option =
  match List.rev e.Malli.e_in with
  | Keyword s :: _ -> Some s
  | String s :: _ -> Some s
  | _ -> None

let disallowed_key_attrs (errors : Db_validate.grouped_error list) :
    (int * string list) list =
  List.filter_map
    (fun (ge : Db_validate.grouped_error) ->
      let eid =
        match ge.ge_entity with
        | Map kvs ->
            (match List.assoc_opt (Keyword "db/id") kvs with
             | Some (Int n) | Some (Ref n) -> Some n
             | _ -> None)
        | Ref n -> Some n
        | _ -> None
      in
      let attrs = List.filter_map disallowed_key_attr
                    (List.filter disallowed_key ge.ge_errors)
                  |> dedup_values_str in
      match eid, attrs with
      | Some eid, attrs when attrs <> [] -> Some (eid, attrs)
      | _ -> None)
    errors

let all_disallowed_key_errors (errors : Db_validate.grouped_error list) : bool =
  List.for_all
    (fun (ge : Db_validate.grouped_error) ->
      ge.ge_errors <> [] && List.for_all disallowed_key ge.ge_errors)
    errors

let remove_disallowed_key_datoms (tx_data : value list)
    (eid_attrs : (int * string list) list) : value list =
  List.filter
    (fun tx ->
      match coll_items tx with
      | [ Keyword "db/add"; e; Keyword a; _v ] ->
          let eid =
            match e with Int n | Ref n -> Some n | _ -> None
          in
          (match eid with
           | Some eid ->
               (match List.assoc_opt eid eid_attrs with
                | Some attrs -> not (List.mem a attrs)
                | None -> true)
           | None -> true)
      | _ -> true)
    tx_data

type validate_result =
  { valid_db : db option
  ; valid_tx_data : value list
  ; error : string option }

(* cljs validate-import-tx-data *)
let validate_import_tx_data (txs : import_txs) (db : db) (edn_label : string) :
    validate_result =
  let rec loop (tx_data : value list) =
    let ops = Sqlite_build.tx_ops_of_values db tx_data in
    let db_after = Datascript.db_with ops db in
    let errors = Db_validate.validate_local_db db_after in
    if errors <> [] then begin
      let eid_attrs = disallowed_key_attrs errors in
      let tx_data' = remove_disallowed_key_datoms tx_data eid_attrs in
      if all_disallowed_key_errors errors
         && eid_attrs <> []
         && List.length tx_data <> List.length tx_data'
      then loop tx_data'
      else
        { valid_db = None
        ; valid_tx_data = []
        ; error =
            Some
              ("The " ^ edn_label ^ " has "
               ^ string_of_int (List.length errors)
               ^ " validation error(s)") }
    end
    else { valid_db = Some db_after; valid_tx_data = tx_data; error = None }
  in
  loop (import_tx_data txs)

(* cljs validate-import-txs *)
let validate_import_txs ?(edn_label : string option) (txs_r : (import_txs, string) Result.t)
    (db : db) : validate_result =
  let edn_label = Option.value ~default:"Imported EDN" edn_label in
  match txs_r with
  | Error e -> { valid_db = None; valid_tx_data = []; error = Some e }
  | Ok txs ->
      (try validate_import_tx_data txs db edn_label
       with e ->
         { valid_db = None
         ; valid_tx_data = []
         ; error =
             Some
               ("The " ^ edn_label ^ " is unexpectedly invalid: "
                ^ Printexc.to_string e) })

(* cljs create-conn — fresh conn seeded with initial data *)
let create_conn () : conn =
  let conn = Datascript.create_conn ~schema:(Db_schema.schema ()) () in
  let db = Datascript.db conn in
  let tx =
    Sqlite_create_graph.initial_tx_data ~db ~config_content:"{}" ()
  in
  ignore (Db_tx.transact ~tx_meta:[] conn tx);
  conn

(* cljs validate-export *)
let validate_export (export_edn : value) : validate_result =
  try
    let conn = create_conn () in
    let db = Datascript.db conn in
    let txs = build_import export_edn db None in
    validate_import_txs ~edn_label:"Exported EDN" txs db
  with e ->
    { valid_db = None
    ; valid_tx_data = []
    ; error =
        Some
          ("The exported EDN is unexpectedly invalid: " ^ Printexc.to_string e) }

(* cljs prepare-export-to-diff *)
let prepare_export_to_diff (m : value) : value =
  let mm = bm_of_value m in
  match bm_get_opt mm k_kv_values with
  | Some kvs ->
      let kvs' =
        coll_items kvs
        |> List.filter (fun kv ->
               match bm_get_opt (bm_of_value kv) "db/ident" with
               | Some (Keyword i) ->
                   not
                     (List.mem i
                        [ "logseq.kv/import-type"
                        ; "logseq.kv/imported-at"
                        ; "logseq.kv/local-graph-uuid" ])
               | _ -> true)
        |> List.stable_sort (fun a b ->
               match
                 ( bm_get_opt (bm_of_value a) "db/ident"
                 , bm_get_opt (bm_of_value b) "db/ident" )
               with
               | Some (Keyword x), Some (Keyword y) -> String.compare x y
               | _ -> 0)
      in
      map_of_bm (bm_put mm k_kv_values (Vector kvs'))
  | None -> m

(* cljs clojure.data/diff — returns (only-a, only-b, in-both); we only
   need only-a/only-b for diff-exports *)
let rec diff_values (a : value) (b : value) : value option * value option =
  match a, b with
  | Map ka, Map kb ->
      let diff_side mine other =
        List.filter_map
          (fun (k, v) ->
            match
              List.find_opt (fun (k', _) -> Util.value_equal k' k) other
            with
            | Some (_, v') ->
                (match diff_values v v' with
                 | Some dv, _ -> Some (k, dv)
                 | None, _ -> None)
            | None -> Some (k, v))
          mine
      in
      let da, db_ = diff_side ka kb, diff_side kb ka in
      ( (if da = [] then None else Some (Map da))
      , if db_ = [] then None else Some (Map db_) )
  | Set sa, Set sb | Vector sa, Vector sb | List sa, List sb ->
      let da = List.filter (fun x -> not (value_in x sb)) sa in
      let db_ = List.filter (fun x -> not (value_in x sa)) sb in
      ( (if da = [] then None else Some (Set da))
      , if db_ = [] then None else Some (Set db_) )
  | _ ->
      if Util.value_equal a b then (None, None) else (Some a, Some b)

(* cljs diff-exports *)
let diff_exports (export_map : value) (export_map2 : value) : value option =
  let a, b =
    diff_values
      (prepare_export_to_diff export_map)
      (prepare_export_to_diff export_map2)
  in
  match a, b with
  | None, None -> None
  | _ ->
      Some (Vector [ Option.value ~default:Nil a; Option.value ~default:Nil b ])

(* misc: used by Endpoint_export *)
let datom_export_p = datom_export
