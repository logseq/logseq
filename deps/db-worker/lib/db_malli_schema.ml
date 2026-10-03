(* Port of logseq.db.frontend.malli-schema + the validation fns of
   logseq.db.frontend.property.type.

   Dynamic cljs vars map to: *skip-strict-url-validate?* /
   *closed-values-validate?* → the [vopts] record callers thread in;
   *db-for-validate-fns* → the [vctx.db] carried by Malli. *)

open Datascript
open Malli

let kw s = Keyword s

let ends_with (s : string) (suffix : string) : bool =
  let ls = String.length s and lf = String.length suffix in
  ls >= lf && String.sub s (ls - lf) lf = suffix

(* cljs dynamic vars *skip-strict-url-validate?* and
   *closed-values-validate?* — bound by validate.cljs callers *)
let skip_strict_url_validate = ref false
let closed_values_validate = ref false

type vopts =
  { new_closed_value : bool
  ; skip_strict_url : bool
  ; closed_values_validate : bool }

let default_vopts =
  { new_closed_value = false
  ; skip_strict_url = false
  ; closed_values_validate = false }

(* ---- helpers ---- *)

let vget (k : string) (v : value) : value option =
  match v with
  | Map kvs ->
      List.find_map
        (fun (key, x) ->
          match key with
          | Keyword s | String s when s = k -> Some x
          | _ -> None)
        kvs
  | _ -> None

let mget (k : string) (m : (attr * value) list) : value option =
  List.find_map (fun (a, v) -> if a = k then Some v else None) m

(* (d/entity db v) — raw eid (Int/Ref) or db-ident keyword *)
let ent_of_val (db : db) (v : value) : entity option =
  match v with
  | Ref id -> Ldb.ent_of_id db id
  | Int64 id -> Option.bind (Datascript.Util.int64_to_int id) (Ldb.ent_of_id db)
  | Keyword ident -> Ldb.ent_of_ref db (Ident ident)
  | _ -> None

let entity_val ctx v = Option.is_some (ent_of_val ctx.db v)

let class_entity_val ctx v =
  match ent_of_val ctx.db v with Some e -> Ldb.is_class e | None -> false

let property_entity_val ctx v =
  match ent_of_val ctx.db v with
  | Some e -> Ldb.is_property e
  | None -> false

let page_entity_val ctx v =
  match ent_of_val ctx.db v with Some e -> Ldb.is_page e | None -> false

let value_of (e : entity) (a : attr) = Ldb.value e a

let is_string_val = function String _ -> true | _ -> false
(* cljs number? — a Date is not a number *)
let is_number_val = function Int64 _ | Float _ -> true | _ -> false
let is_boolean_val = function Bool _ -> true | _ -> false
let is_keyword_val = function Keyword _ -> true | _ -> false
let is_map_val = function Map _ -> true | _ -> false
let is_coll_val = function List _ | Vector _ | Set _ | Map _ -> true | _ -> false
let is_some_val = function Nil -> false | _ -> true

let macro_str (s : string) : bool =
  let s = Unicode.trim s in
  Ns_util.str_starts_with s "{{" && ends_with s "}}"

let blank_str (s : string) : bool = Unicode.trim s = ""

(* db-property-type/url? — any parseable URL, not common-util/url?'s
   origin-restricted variant. *)
let url_str (s : string) : bool = Ns_util.url_parses s

(* db-property-type/url-entity? *)
let url_entity_val (ctx : vctx) (opts : vopts) (v : value) : bool =
  if opts.new_closed_value then
    match v with
    | String s -> url_str s || macro_str s
    | _ -> false
  else
    match ent_of_val ctx.db v with
    | Some ent ->
        (match value_of ent "block/title" with
         | Some (String title) ->
             if opts.skip_strict_url then true
             else blank_str title || url_str title || macro_str title
         | _ -> false)
    | None -> false

(* db-property-type/text-entity? *)
let text_entity_val (ctx : vctx) (opts : vopts) (v : value) : bool =
  if opts.new_closed_value then is_string_val v
  else
    match ent_of_val ctx.db v with
    | Some ent ->
        is_string_val (match value_of ent "block/title" with Some x -> x | None -> Nil)
        && Option.is_some (value_of ent "block/page")
    | None -> false

(* db-property-type/number-entity? *)
let number_entity_val (ctx : vctx) (opts : vopts) (v : value) : bool =
  if opts.new_closed_value then is_number_val v
  else
    match ent_of_val ctx.db v with
    | Some e ->
        (match value_of e "logseq.property/value" with
         | Some x -> is_number_val x
         | None -> false)
    | None -> false

(* db-property-type/node-entity? *)
let node_entity_val (ctx : vctx) (v : value) : bool =
  match ent_of_val ctx.db v with
  | Some e -> Option.is_some (value_of e "block/title")
  | None -> false

(* db-property-type/asset-entity? *)
let asset_entity_val (ctx : vctx) (v : value) : bool =
  match ent_of_val ctx.db v with
  | Some e ->
      Option.is_some (value_of e "block/title")
      && Ldb.has_tag e "logseq.class/Asset"
  | None -> false

(* db-property-type/date? *)
let date_val (ctx : vctx) (v : value) : bool =
  match ent_of_val ctx.db v with
  | Some e -> Option.is_some (value_of e "block/title") && Ldb.is_journal e
  | None -> false

(* db-property-type/built-in-validation-schemas — validate fns by type.
   Types in property-types-with-db take db; all share the same signature
   here. *)
type vfn = vctx -> vopts -> value -> bool

let property_types_with_db =
  [ "default"; "url"; "number"; "date"; "node"; "asset"; "entity"; "class"
  ; "property"; "page" ]

let closed_value_property_types = [ "default"; "number"; "url" ]

let internal_built_in_property_types =
  [ "keyword"; "map"; "coll"; "any"; "entity"; "class"; "page"; "property"
  ; "string"; "json"; "raw-number" ]

let user_built_in_property_types =
  [ "default"; "number"; "date"; "datetime"; "checkbox"; "url"; "node"
  ; "asset" ]

let user_allowed_internal_property_types = [ "map"; "json"; "string" ]

let validate_fn_of_type (t : string) : (vfn * string) option =
  match t with
  | "default" -> Some ((fun ctx o v -> text_entity_val ctx o v), "should be a text block")
  | "number" -> Some ((fun ctx o v -> number_entity_val ctx o v), "should be a number")
  | "date" -> Some ((fun ctx _ v -> date_val ctx v), "should be a journal date")
  | "datetime" -> Some ((fun _ _ v -> is_number_val v), "should be a datetime")
  | "checkbox" -> Some ((fun _ _ v -> is_boolean_val v), "should be a boolean")
  | "url" -> Some ((fun ctx o v -> url_entity_val ctx o v), "should be a URL")
  | "node" -> Some ((fun ctx _ v -> node_entity_val ctx v), "should be a node with a title")
  | "asset" -> Some ((fun ctx _ v -> asset_entity_val ctx v), "should be an asset node")
  | "string" -> Some ((fun _ _ v -> is_string_val v), "should be a string")
  | "json" -> Some ((fun _ _ v -> is_string_val v), "should be JSON string")
  | "raw-number" -> Some ((fun _ _ v -> is_number_val v), "should be a raw number")
  | "entity" -> Some ((fun ctx _ v -> entity_val ctx v), "should be an Entity")
  | "class" -> Some ((fun ctx _ v -> class_entity_val ctx v), "should be a Class")
  | "property" -> Some ((fun ctx _ v -> property_entity_val ctx v), "should be a Property")
  | "page" -> Some ((fun ctx _ v -> page_entity_val ctx v), "should be a Page")
  | "keyword" -> Some ((fun _ _ v -> is_keyword_val v), "should be a Clojure keyword")
  | "map" -> Some ((fun _ _ v -> is_map_val v), "should be a Clojure map")
  | "coll" -> Some ((fun _ _ v -> is_coll_val v), "should be a collection")
  | "any" -> Some ((fun _ _ v -> is_some_val v), "")
  | _ -> None

let built_in_validation_schema_types =
  List.filter_map
    (fun t -> Option.map (fun _ -> t) (validate_fn_of_type t))
    (internal_built_in_property_types @ user_built_in_property_types)

(* malli-schema/empty-placeholder-value? *)
let empty_placeholder_value (db : db) (property : value) (property_val : value)
    : bool =
  let ref_type =
    match vget "db/valueType" property with
    | Some (Keyword "db.type/ref") -> true
    | _ -> false
  in
  if ref_type then
    (match property_val with
     | Ref id -> (
         match Ldb.ent_of_id db id with
         | Some e -> Ldb.ident_of e = Some "logseq.property/empty-placeholder"
         | None -> false)
     | Int64 id -> (
         match Option.bind (Datascript.Util.int64_to_int id) (Ldb.ent_of_id db) with
         | Some e -> Ldb.ident_of e = Some "logseq.property/empty-placeholder"
         | None -> false)
     | _ -> false)
  else property_val = Keyword "logseq.property/empty-placeholder"

(* malli-schema/validate-property-value *)
let validate_property_value (ctx : vctx) (opts : vopts) (tuple : value) : bool =
  match coll_items tuple with
  (* cljs destructures [property property-val]; block/tags tuples carry a
     trailing opts map, so match the first two items *)
  | property :: property_val :: _ ->
      let ptype =
        match vget "logseq.property/type" property with
        | Some (Keyword s) -> s
        | _ -> ""
      in
      (match validate_fn_of_type ptype with
       | None -> false
       | Some (vfn, _msg) ->
           let closed_values =
             match vget "property/closed-values" property with
             | Some (Vector xs | List xs | Set xs) -> xs
             | _ -> []
           in
           let check v = vfn ctx opts v in
           let check =
             if
               opts.closed_values_validate
               && List.mem ptype closed_value_property_types
               && (not opts.new_closed_value)
               && closed_values <> []
             then
               let ids =
                 List.filter_map
                   (fun cv ->
                     match vget "db/id" cv with
                     | Some (Ref id) -> Some id
                     | Some (Int64 id) -> Datascript.Util.int64_to_int id
                     | _ -> None)
                   closed_values
               in
               fun v ->
                 check v
                 &&
                 match v with
                 | Ref id -> List.mem id ids
                 | Int64 id -> (
                     match Datascript.Util.int64_to_int id with
                     | Some id -> List.mem id ids
                     | None -> false)
                 | _ -> false
             else check
           in
           if Db_property.many_map property then
             (match property_val with
              | Set items | List items | Vector items ->
                  List.for_all check items
                  || (match items with
                      | v :: _ ->
                          empty_placeholder_value ctx.db property v
                      | [] -> false)
              | _ -> false)
           else
             check property_val
             || empty_placeholder_value ctx.db property property_val)
  | _ -> false

(* malli-schema/property-entity->map — minimal property map as a Map
   value; :property/closed-values are {db/id} maps *)
let property_entity_to_map (property : entity) : value =
  let add a kvs =
    match value_of property a with
    (* cljs stores :logseq.property/type datoms as keywords; the OCaml db
       convention keeps them as String, so normalize back here *)
    | Some (String s) when a = "logseq.property/type" ->
        kvs @ [ kw a, Keyword s ]
    | Some v -> kvs @ [ kw a, v ]
    | None -> kvs
  in
  let kvs =
    []
    |> add "db/ident" |> add "db/valueType" |> add "db/cardinality"
    |> add "logseq.property/type"
  in
  let cvs = Db_property.property_closed_values property in
  let kvs =
    if cvs = [] then kvs
    else
      kvs
      @ [ ( kw "property/closed-values"
          , Vector
              (List.map
                 (fun (cv : entity) -> Map [ kw "db/id", Int64 (Int64.of_int cv.id) ])
                 cvs) ) ]
  in
  Map kvs

(* malli-schema/update-properties-in-ents — ent maps are (attr*value)
   lists; property attrs move under :block/properties tuples,
   :block/tags becomes a [prop-map v opts] tuple *)
let update_properties_in_ents (db : db) (ents : (attr * value) list list)
    : (attr * value) list list =
  let exceptions =
    Db_schema.required_properties @ Db_schema.schema_properties
    @ [ "block/tags" ]
  in
  let page_class_id =
    match Ldb.ent_of_ref db (Ident "logseq.class/Page") with
    | Some e -> e.id
    | None -> 0
  in
  let all_page_class_ids =
    List.filter_map
      (fun ident ->
        Option.map (fun (e : entity) -> e.id)
          (Ldb.ent_of_ref db (Ident ident)))
      Db_class.page_classes
  in
  List.map
    (fun ent ->
      let props, m =
        List.fold_left
          (fun (props, m) (k, v) ->
            if Db_property.property k && not (List.mem k exceptions) then
              match Ldb.ent_of_ref db (Ident k) with
              | Some property ->
                  (Vector [ property_entity_to_map property; v ] :: props, m)
              | None -> (props, m @ [ (k, v) ])
            else if k = "block/tags" then
              match Ldb.ent_of_ref db (Ident "block/tags") with
              | Some property ->
                  let opts =
                    Map
                      ( List.filter_map
                          (fun (a, v) ->
                            if a = "logseq.property/built-in?" then
                              Some (kw a, v)
                            else None)
                          ent
                        @ [ kw "page-class-id", Int64 (Int64.of_int page_class_id)
                          ; ( kw "all-page-class-ids"
                            , Set (List.map (fun id -> Int64 (Int64.of_int id)) all_page_class_ids) ) ] )
                  in
                  ( props
                  , m
                    @ [ ( "block/tags"
                        , Vector [ property_entity_to_map property; v; opts ] ) ] )
              | None -> (props, m @ [ (k, v) ])
            else (props, m @ [ (k, v) ]))
          ([], []) ent
      in
      if props = [] then m
      else m @ [ ("block/properties", Vector (List.rev props)) ])
    ents

(* malli-schema/datoms->entity-maps *)
type ent_map = (attr * value) list

let datoms_to_entity_maps ?(entity_fn : (attr -> ent_map option) option)
    (datoms : datom list) : (entity_id * ent_map) list =
  let tbl : (entity_id, ent_map) Hashtbl.t = Hashtbl.create 256 in
  let order = ref [] in
  List.iter
    (fun (d : datom) ->
      (* cljs datom :v is the raw eid for ref attrs; OCaml keeps Ref. *)
      let v = match d.v with Ref n -> Int64 (Int64.of_int n) | v -> v in
      let m = try Hashtbl.find tbl d.e with Not_found -> [] in
      if m = [] then order := d.e :: !order;
      (* cljs builds sets via (fnil conj #{})/#{existing v} — conj dedups
         and a falsy existing value (nil/false) takes the plain assoc path
         instead of collecting *)
      let conj_set xs v =
        if List.exists (fun x -> x = v) xs then xs else xs @ [ v ]
      in
      let m' =
        if List.mem d.a Db_schema.card_many_attributes then
          let cur =
            match mget d.a m with
            | Some (Set xs) -> xs
            | Some _ ->
                (* cljs (conj non-collection v) — unreachable: card-many attrs
                   are only ever built through this branch *)
                failwith "conjoin on non-collection"
            | None -> []
          in
          List.remove_assoc d.a m @ [ (d.a, Set (conj_set cur v)) ]
        else
          match mget d.a m with
          | Some (Set xs) ->
              List.remove_assoc d.a m @ [ (d.a, Set (conj_set xs v)) ]
          | Some existing -> (
              (* cljs (if-let ...) is falsy on nil/false *)
              match existing with
              | Nil | Bool false ->
                  List.remove_assoc d.a m @ [ (d.a, v) ]
              | _ ->
                  (* cljs #{existing-val v} — set literal dedups *)
                  List.remove_assoc d.a m
                  @ [ (d.a, Set (conj_set [ existing ] v)) ])
          | None -> m @ [ (d.a, v) ]
      in
      Hashtbl.replace tbl d.e m')
    datoms;
  let entity_fn' =
    match entity_fn with
    | Some f -> f
    | None ->
        (* cljs (into {} (map (juxt :db/ident identity) (vals ent-maps))) —
           ident -> ent-map index built once, then O(1) lookups *)
        let ident_tbl : (attr, ent_map) Hashtbl.t =
          Hashtbl.create (Hashtbl.length tbl)
        in
        Hashtbl.iter
          (fun _eid (m : ent_map) ->
            match mget "db/ident" m with
            | Some (Keyword ident) -> Hashtbl.replace ident_tbl ident m
            | _ -> ())
          tbl;
        fun (k : attr) -> Hashtbl.find_opt ident_tbl k
  in
  (* post-pass: :many properties with a single value get wrapped in a set *)
  List.rev_map
    (fun eid ->
      let m = Hashtbl.find tbl eid in
      let m' =
        List.map
          (fun (k, v) ->
            if Db_property.property k then
              match entity_fn' k with
              | Some property
                when List.exists
                       (fun (a, cv) ->
                         a = "db/cardinality"
                         && cv = Keyword "db.cardinality/many")
                       property
                     && (match v with Set _ -> false | _ -> true) ->
                  (k, Set [ v ])
              | _ -> (k, v)
            else (k, v))
          m
      in
      (eid, m'))
    !order

(* malli-schema/datoms->entities *)
let datoms_to_entities ?entity_fn (datoms : datom list) : ent_map list =
  List.map
    (fun (eid, m) -> m @ [ ("db/id", Int64 (Int64.of_int eid)) ])
    (datoms_to_entity_maps ?entity_fn datoms)

(* ---- :db/ident schemas ---- *)

let db_attribute_ident : schema =
  Enum (List.map kw Db_schema.db_attribute_properties)

let logseq_property_ident : schema =
  And
    [ Prim PKeyword
    ; Fn
        ( "should be a valid logseq property namespace"
        , fun _ctx v ->
            match v with
            | Keyword k -> Db_property.logseq_property k
            | _ -> false ) ]

let block_order : schema =
  And
    [ Prim PString
    ; Fn
        ( "should be a valid fractional index"
        , fun _ctx v ->
            match v with
            | String key ->
                (try
                   Db_order.validate_order_key key Db_order.base62_digits;
                   true
                 with _ -> false)
            | _ -> false ) ]

let internal_property_ident : schema =
  Or [ logseq_property_ident; db_attribute_ident ]

let user_property_ident : schema =
  And
    [ Prim PQualKeyword
    ; Fn
        ( "should be a valid user property namespace"
        , fun _ctx v ->
            match v with
            | Keyword k ->
                (match Db_property.namespace_of k with
                 | Some ns -> Db_property.user_property_namespace ns
                 | None -> false)
            | _ -> false ) ]

let plugin_property_ident : schema =
  And
    [ Prim PQualKeyword
    ; Fn
        ( "should be a valid plugin property namespace"
        , fun _ctx v ->
            match v with Keyword k -> Db_property.plugin_property k | _ -> false )
    ]

let logseq_ident : schema =
  And
    [ Prim PKeyword
    ; Fn
        ( "should be a valid :db/ident namespace"
        , fun _ctx v ->
            match v with
            | Keyword k ->
                (match Db_property.namespace_of k with
                 | Some ns -> List.mem ns Db_schema.logseq_ident_namespaces
                 | None -> false)
            | _ -> false ) ]

let class_ident : schema =
  And
    [ Prim PQualKeyword
    ; Fn
        ( "should be a valid class namespace"
        , fun _ctx v ->
            match v with
            | Keyword k ->
                (match Db_property.namespace_of k with
                 | Some ns -> Ns_util.str_contains ns ".class"
                 | None -> false)
            | _ -> false ) ]

(* ---- main schemas ---- *)

let property_tuple : schema =
  Multi
    ( (fun _ctx tuple ->
        match coll_items tuple with
        | property :: _ ->
            (match vget "logseq.property/type" property with
             | Some (Keyword t) -> t
             | _ -> "")
        | _ -> ""),
      List.map
        (fun (t : string) ->
          let msg =
            match validate_fn_of_type t with
            | Some (_, m) -> m
            | None -> ""
          in
          ( t
          , Fn
              ( msg
              , fun (ctx : vctx) (tuple : value) ->
                  let opts =
                    { new_closed_value = false
                    ; skip_strict_url = !skip_strict_url_validate
                    ; closed_values_validate = !closed_values_validate }
                  in
                  validate_property_value ctx opts tuple ) ))
        (internal_built_in_property_types @ user_built_in_property_types) )

let block_properties : schema = SeqOf property_tuple

let block_tags : schema =
  And
    [ property_tuple
    ; Fn
        ( "should only have one tag for a built-in entity"
        , fun _ctx tuple ->
            match coll_items tuple with
            | [ _k; v; opts ] ->
                (match vget "logseq.property/built-in?" opts with
                 | Some (Bool true) ->
                     (match v with
                      | Set xs | List xs | Vector xs -> List.length xs = 1
                      | _ -> true)
                 | _ -> true)
            | _ -> true )
    ; Fn
        ( "should not have other built-in page tags when tagged with #Page"
        , fun _ctx tuple ->
            match coll_items tuple with
            | [ _k; v; opts ] ->
                (match
                   ( vget "page-class-id" opts
                   , vget "all-page-class-ids" opts )
                 with
                 | Some pcid_v, Some (Set all) -> (
                     let pcid =
                       match pcid_v with
                       | Ref id -> Some id
                       | Int64 id -> Datascript.Util.int64_to_int id
                       | _ -> None
                     in
                     match pcid with
                     | Some pcid ->
                     let tags =
                       List.filter_map
                         (function
                           | Ref id -> Some id
                           | Int64 id -> Datascript.Util.int64_to_int id
                           | _ -> None)
                         (coll_items v)
                     in
                     if List.mem pcid tags then
                       not
                         (List.exists
                            (fun t ->
                              t <> pcid
                              && List.exists
                                   (function
                                     | Ref i -> i = t
                                     | Int64 i -> (
                                         match Datascript.Util.int64_to_int i with
                                         | Some i -> i = t
                                         | None -> false)
                                     | _ -> false)
                                   all)
                            tags)
                     else true
                     | None -> true)
                 | _ -> true)
            | _ -> true ) ]

let page_or_block_entries =
  [ entry "block/uuid" (Prim PUuid)
  ; entry "block/created-at" (Prim PInt)
  ; entry "block/updated-at" (Prim PInt)
  ; entry ~optional:true "logseq.property/deleted-at" (Prim PInt)
  ; entry ~optional:true "block/properties" block_properties
  ; entry ~optional:true "block/tags" block_tags
  ; entry ~optional:true "block/refs" (SetOf (Prim PInt))
  ; entry ~optional:true "block/tx-id" (Prim PInt)
  ; entry ~optional:true "block/collapsed?" (Prim PBoolean)
  ; entry ~optional:true "block/warning" (Prim PKeyword)
  ; entry ~optional:true "logseq.property/created-by-ref" (Prim PInt) ]

let page_entries =
  [ entry "block/name" (Prim PString); entry "block/title" (Prim PString) ]

let property_entries =
  [ entry ~optional:true "db/index" (Prim PBoolean)
  ; entry ~optional:true "db/valueType" (Enum [ kw "db.type/ref" ])
  ; entry ~optional:true "db/cardinality"
      (Enum [ kw "db.cardinality/many"; kw "db.cardinality/one" ])
  ; entry ~optional:true "block/order" block_order
  ; entry ~optional:true "logseq.property/classes" (SetOf (Prim PInt)) ]

let normal_page : schema =
  mmap ~error_path:"normal-page"
    ([ entry ~optional:true "block/journal-day" (Prim PInt)
     ; entry ~optional:true "block/parent" (Prim PInt)
     ; entry ~optional:true "block/order" block_order ]
     @ page_entries @ page_or_block_entries)

let class_page : schema =
  Or
    [ mmap ~error_path:"class-page"
        ([ entry "db/ident" class_ident
         ; entry "logseq.property.class/extends" (SetOf (Prim PInt)) ]
         @ page_entries @ page_or_block_entries)
    ; mmap ~error_path:"class-page"
        ([ entry "db/ident" (Eq (kw "logseq.class/Root")) ]
         @ page_entries @ page_or_block_entries) ]

let property_common_schema_entries =
  [ entry ~optional:true "logseq.property/hide?" (Prim PBoolean)
  ; entry ~optional:true "logseq.property/public?" (Prim PBoolean)
  ; entry ~optional:true "logseq.property/ui-position"
      (Enum
         [ kw "properties"; kw "block-left"; kw "block-right"
         ; kw "block-below" ]) ]

let internal_property : schema =
  mmap ~error_path:"internal-property"
    ([ entry "db/ident" internal_property_ident
     ; entry "logseq.property/type"
         (Enum
            (List.map kw
               (internal_built_in_property_types @ user_built_in_property_types)))
     ; entry ~optional:true "logseq.property/view-context"
         (Enum
            [ kw "page"; kw "block"; kw "class"; kw "property"; kw "never" ]) ]
     @ property_common_schema_entries @ property_entries @ page_entries
     @ page_or_block_entries)

let user_property : schema =
  mmap ~error_path:"user-property"
    ([ entry "db/ident" user_property_ident
     ; entry "logseq.property/type"
         (Enum
            (List.map kw
               (user_allowed_internal_property_types
                @ user_built_in_property_types))) ]
     @ property_common_schema_entries @ property_entries @ page_entries
     @ page_or_block_entries)

let plugin_property : schema =
  mmap ~error_path:"plugin-property"
    ([ entry "db/ident" plugin_property_ident
     ; entry "logseq.property/type"
         (Enum
            (List.map kw
               (user_built_in_property_types @ [ "json"; "string"; "page" ]))) ]
     @ property_common_schema_entries @ property_entries @ page_entries
     @ page_or_block_entries)

let property_page : schema =
  Multi
    ( (fun _ctx m ->
        match vget "db/ident" m with
        | Some (Keyword ident) ->
            if
              Db_property.logseq_property ident
              || List.mem ident Db_schema.db_attribute_properties
            then "internal"
            else if Db_property.plugin_property ident then "plugin"
            else "user"
        | _ -> "user"),
      [ "internal", internal_property
      ; "plugin", plugin_property
      ; "malli.core/default", user_property ] )

let hidden_page : schema =
  mmap ~error_path:"hidden-page"
    ([ entry ~optional:true "block/order" block_order
     ; entry "logseq.property/hide?" (Enum [ Bool true ]) ]
     @ page_entries @ page_or_block_entries)

let block_entries =
  [ entry "block/title" (Prim PString)
  ; entry "block/parent" (Prim PInt)
  ; entry "block/order" block_order
  ; entry "block/page" (Prim PInt)
  ; entry ~optional:true "block/link" (Prim PInt)
  ; entry ~optional:true "logseq.property/created-from-property" (Prim PInt) ]

let whiteboard_block : schema =
  mmap ~error_path:"whiteboard-block"
    ([ entry "block/title" (Prim PString)
     ; entry "block/parent" (Prim PInt)
     ; entry "block/page" (Prim PInt) ]
     @ page_or_block_entries)

let property_value_block : schema =
  mmap ~error_path:"property-value-block"
    ([ entry "logseq.property/value"
         (Or [ Prim PString; Prim PDouble; Prim PBoolean ])
     ; entry "logseq.property/created-from-property" (Prim PInt) ]
     @ List.filter
         (fun (k, _, _, _) -> not (List.mem k [ "block/title"; "logseq.property/created-from-property" ]))
         block_entries
     @ page_or_block_entries)

let reaction_entity : schema =
  mmap ~error_path:"reaction-entity"
    [ entry "block/uuid" (Prim PUuid)
    ; entry "logseq.property.reaction/emoji-id" (Prim PString)
    ; entry "logseq.property.reaction/target" (Prim PInt)
    ; entry "block/created-at" (Prim PInt)
    ; entry ~optional:true "block/tx-id" (Prim PInt)
    ; entry ~optional:true "block/properties" block_properties
    ; entry ~optional:true "block/refs" (SetOf (Prim PInt)) ]

let property_history_block : schema =
  And
    [ mmap ~error_path:"property-history-block"
        [ entry "block/uuid" (Prim PUuid)
        ; entry "block/created-at" (Prim PInt)
        ; entry ~optional:true "block/updated-at" (Prim PInt)
        ; entry "logseq.property.history/block" (Prim PInt)
        ; entry "logseq.property.history/property" (Prim PInt)
        ; entry ~optional:true "logseq.property.history/ref-value" (Prim PInt)
        ; entry ~optional:true "logseq.property.history/scalar-value" (Prim PAny)
        ; entry ~optional:true "block/properties" block_properties
        ; entry ~optional:true "block/tx-id" (Prim PInt) ]
    ; Fn
        ( ":logseq.property.history/ref-value or :logseq.property.history/scalar-value required"
        , fun _ctx m ->
            is_some_val
              (match vget "logseq.property.history/ref-value" m with
               | Some v -> v | None -> Nil)
            || Option.is_some (vget "logseq.property.history/scalar-value" m) )
    ]

let closed_value_block : schema =
  And
    [ mmap
        ([ entry ~optional:true "db/ident" logseq_property_ident
         ; entry ~optional:true "block/title" (Prim PString)
         ; entry ~optional:true "logseq.property/value"
             (Or [ Prim PString; Prim PDouble ])
         ; entry "logseq.property/created-from-property" (Prim PInt)
         ; entry ~optional:true "block/closed-value-property"
             (SetOf (Prim PInt)) ]
         @ List.filter
             (fun (k, _, _, _) ->
               not
                 (List.mem k
                    [ "block/title"; "logseq.property/created-from-property" ]))
             block_entries
         @ page_or_block_entries)
    ; Fn
        ( ":block/title or :logseq.property/value required"
        , fun _ctx m ->
            is_some_val
              (match vget "block/title" m with Some v -> v | None -> Nil)
            || is_some_val
                 (match vget "logseq.property/value" m with
                  | Some v -> v | None -> Nil) ) ]

let normal_block : schema =
  mmap ~error_path:"normal-block" (block_entries @ page_or_block_entries)

let block : schema = Or [ normal_block; whiteboard_block ]

let asset_block : schema =
  mmap ~error_path:"asset-block"
    ([ entry "logseq.property.asset/type" (Prim PString)
     ; entry "logseq.property.asset/checksum" (Prim PString)
     ; entry "logseq.property.asset/size" (Prim PInt)
     ; entry ~optional:true "logseq.property.asset/width" (Prim PInt)
     ; entry ~optional:true "logseq.property.asset/height" (Prim PInt)
     ; entry ~optional:true "logseq.property.asset/align" (Prim PKeyword) ]
     @ block_entries @ page_or_block_entries)

let file_block : schema =
  mmap ~error_path:"file-block"
    [ entry "block/uuid" (Prim PUuid)
    ; entry ~optional:true "block/tx-id" (Prim PInt)
    ; entry ~optional:true "block/created-at" (Prim PInt)
    ; entry ~optional:true "block/updated-at" (Prim PInt)
    ; entry "file/content" (Prim PString)
    ; entry "file/path" (Prim PString)
    ; entry ~optional:true "file/size" (Prim PInt)
    ; entry "file/created-at" (Prim PInst)
    ; entry "file/last-modified-at" (Prim PInst) ]

let db_ident_key_val : schema =
  mmap ~error_path:"db-ident-key-val"
    [ entry "db/ident" logseq_ident
    ; entry "kv/value" (Prim PAny)
    ; entry ~optional:true "block/tx-id" (Prim PInt) ]

let property_value_placeholder : schema =
  mmap ~error_path:"property-value-placeholder"
    [ entry "db/ident" (Eq (kw "logseq.property/empty-placeholder"))
    ; entry "block/uuid" (Prim PUuid)
    ; entry ~optional:true "block/tx-id" (Prim PInt)
    ; entry ~optional:true "block/created-at" (Prim PInt)
    ; entry ~optional:true "block/updated-at" (Prim PInt) ]

(* entity-util/whiteboard? *)
let whiteboard_tags (tags : value list) (db : db) : bool =
  List.exists
    (fun t ->
      match t with
      | Keyword k -> k = "logseq.class/Whiteboard"
      | Ref id ->
          (match Ldb.ent_of_id db id with
           | Some e -> Ldb.ident_of e = Some "logseq.class/Whiteboard"
           | None -> false)
      | Int64 id ->
          (match Option.bind (Datascript.Util.int64_to_int id) (Ldb.ent_of_id db) with
           | Some e -> Ldb.ident_of e = Some "logseq.class/Whiteboard"
           | None -> false)
      | _ -> false)
    tags

(* malli-schema/entity-dispatch-key — operates on an ent-map
   (attr*value list); resolves the real entity via :block/uuid when
   present *)
let entity_dispatch_key (db : db) (m : (attr * value) list) : string =
  let d : [`Ent of entity | `Map of (attr * value) list] option =
    match mget "block/uuid" m with
    | Some (Uuid u) ->
        (match Ldb.ent_of_ref db (Lookup_ref ("block/uuid", Uuid u)) with
         | Some e -> Some (`Ent e)
         | None -> None)
    | Some _ -> None
    | None -> Some (`Map m)
  in
  let get_attr a =
    match d with
    | Some (`Ent e) -> Ldb.value e a
    | Some (`Map m) -> mget a m
    | None -> None
  in
  let has a = match get_attr a with Some (Nil) | None -> false | Some _ -> true in
  let has_tag tags ident =
    match d with
    | Some (`Ent e) -> Ldb.has_tag e ident
    | Some (`Map _) ->
        List.exists
          (fun t ->
            match t with
            | Keyword k -> k = ident
            | Ref id ->
                (match Ldb.ent_of_id db id with
                 | Some e -> Ldb.ident_of e = Some ident
                 | None -> false)
            | Int64 id ->
                (match Option.bind (Datascript.Util.int64_to_int id) (Ldb.ent_of_id db) with
                 | Some e -> Ldb.ident_of e = Some ident
                 | None -> false)
            | _ -> false)
          tags
    | None -> false
  in
  let tags =
    match get_attr "block/tags" with
    | Some v -> coll_items v
    | None -> []
  in
  let is_tagged ident = has_tag tags ident in
  let is_property = is_tagged "logseq.class/Property" in
  let is_class = is_tagged "logseq.class/Tag" in
  let is_journal = is_tagged "logseq.class/Journal" in
  let internal_page = is_tagged "logseq.class/Page" in
  let is_page = internal_page || is_journal || is_class || is_property in
  let hide_true =
    match get_attr "logseq.property/hide?" with
    | Some (Bool true) -> true
    | _ -> false
  in
  if has "logseq.property.reaction/target" then "reaction-entity"
  else if is_property then "property"
  else if is_class then "class"
  else if is_page && hide_true then "hidden"
  else if whiteboard_tags tags db then "normal-page"
  else if is_page then "normal-page"
  else if
    (match d with
     | Some (`Ent e) -> Option.is_some (Ldb.value e "logseq.property.asset/type")
     | Some (`Map _) -> has "logseq.property.asset/type"
     | None -> false)
  then "asset-block"
  else if has "file/path" then "file-block"
  else if has "logseq.property.history/block" then "property-history-block"
  else if has "block/closed-value-property" then "closed-value-block"
  else if
    has "logseq.property/created-from-property"
    && has "logseq.property/value"
  then "property-value-block"
  else
    (match get_attr "db/ident" with
     | Some (Keyword "logseq.property/empty-placeholder") ->
         "property-value-placeholder"
     | _ ->
         if has "block/uuid" then "block"
         else if Option.is_some (get_attr "db/ident") then "db-ident-key-value"
         else "")

let data_schema : schema =
  Multi
    ( (fun ctx m ->
        match m with
        | Map kvs ->
            entity_dispatch_key ctx.db
              (List.filter_map
                 (fun (k, v) -> match k with Keyword s -> Some (s, v) | _ -> None)
                 kvs)
        | _ -> ""),
      [ "property", property_page
      ; "class", class_page
      ; "hidden", hidden_page
      ; "normal-page", normal_page
      ; "reaction-entity", reaction_entity
      ; "property-history-block", property_history_block
      ; "closed-value-block", closed_value_block
      ; "property-value-block", property_value_block
      ; "block", block
      ; "asset-block", asset_block
      ; "file-block", file_block
      ; "db-ident-key-value", db_ident_key_val
      ; "property-value-placeholder", property_value_placeholder ] )

let db_schema : schema = SeqOf data_schema
