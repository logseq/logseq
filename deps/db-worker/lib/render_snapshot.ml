(* handler/block.cljs canonical snapshot layer — canonical-blocks,
   canonical-block and the render-resource pieces they need. *)

open Datascript

let kw s = Wire.Keyword s

let fail_render_read message data =
  raise (Dispatcher.Exn_info (message, data))

let eavt_scalar (db : db) (eid : entity_id) (a : attr) : value option =
  match Seq.uncons (datoms db Eavt ~e:eid ~a ()) with
  | Some (d, _) -> Some d.v
  | None -> None

(* cljs valid-revision? — non-negative integer *)
let valid_revision = function
  | Int64 n -> Int64.compare n 0L >= 0
  | _ -> false

let render_basis_rev (db : db) : int =
  if db.max_tx >= 0 then db.max_tx
  else
    fail_render_read "Invalid renderer basis revision"
      [ (kw "basis-rev", Wire.Int db.max_tx) ]

(* per-batch memo tables — every lookup below depends only on
   (db, attr/eid), and one render-snapshots call re-reads the same
   property/schema/tag entities for every row *)
type batch_cache =
  { ref_cache : Block_breadcrumb.cache
  ; attr_schema : (attr, value_type option * cardinality option) Hashtbl.t
  ; ident_entity : (attr, entity option) Hashtbl.t
  ; tag_ident_value : (entity_id, value option) Hashtbl.t
  ; positioned_meta :
      (attr, (entity * string * bool * bool * bool * bool) option) Hashtbl.t
  ; classes_props :
      (entity_id list, Outliner_property.block_classes_properties)
      Hashtbl.t
  ; display_property_maps : (entity_id, Wire.t) Hashtbl.t
  ; tag_class_page : (entity_id list, bool) Hashtbl.t
  ; entity_ident : (entity_id, string option) Hashtbl.t
  ; sort_keys : (entity_id, value option * string) Hashtbl.t
  ; mutable hidden_eid_pred : (entity_id option -> bool) option
  }

let new_batch_cache () : batch_cache =
  { ref_cache = Hashtbl.create 64
  ; attr_schema = Hashtbl.create 63
  ; ident_entity = Hashtbl.create 63
  ; tag_ident_value = Hashtbl.create 63
  ; positioned_meta = Hashtbl.create 31
  ; classes_props = Hashtbl.create 31
  ; display_property_maps = Hashtbl.create 31
  ; tag_class_page = Hashtbl.create 31
  ; entity_ident = Hashtbl.create 63
  ; sort_keys = Hashtbl.create 63
  ; hidden_eid_pred = None }

let entity_ident_of ~(cache : batch_cache) (e : entity) : string option =
  match Hashtbl.find_opt cache.entity_ident e.id with
  | Some i -> i
  | None ->
      let i = Ldb.ident_of e in
      Hashtbl.replace cache.entity_ident e.id i;
      i

(* Export_file.sort_properties with (block/order, block/uuid) memoized
   per entity — the comparator otherwise issues two eavt seeks per
   comparison for every positioned group of every block in the batch *)
let sort_properties_of ~(cache : batch_cache) (props : entity list)
    : entity list =
  let key_of e =
    match Hashtbl.find_opt cache.sort_keys e.id with
    | Some k -> k
    | None ->
        let k =
          ( Ldb.value e "block/order"
          , match Ldb.value e "block/uuid" with
            | Some (Uuid u) -> u
            | _ -> "" )
        in
        Hashtbl.replace cache.sort_keys e.id k;
        k
  in
  List.stable_sort
    (fun a b ->
      let a_order, a_uuid = key_of a in
      let b_order, b_uuid = key_of b in
      match a_order, b_order with
      | None, None -> compare a_uuid b_uuid
      | None, Some _ -> 1
      | Some _, None -> -1
      | Some x, Some y ->
          (match compare x y with 0 -> compare a_uuid b_uuid | c -> c))
    props

let hidden_eid_pred ~(cache : batch_cache) (db : db)
    : entity_id option -> bool =
  match cache.hidden_eid_pred with
  | Some p -> p
  | None ->
      let p = Db_view.hidden_eid_pred db in
      cache.hidden_eid_pred <- Some p;
      p

let display_property_map_of ~(cache : batch_cache) (db : db) (p : entity)
    : Wire.t =
  match Hashtbl.find_opt cache.display_property_maps p.id with
  | Some m -> m
  | None ->
      let m = Property_maps.display_property_map db p in
      Hashtbl.replace cache.display_property_maps p.id m;
      m

let ident_entity ~cache (db : db) (a : attr) : entity option =
  match Hashtbl.find_opt cache.ident_entity a with
  | Some e -> e
  | None ->
      let e = entity db (Ident a) in
      Hashtbl.replace cache.ident_entity a e;
      e

(* cljs block-revision — missing tx-id reads as 0; non-integer values
   pass through so valid-revision? rejects them downstream *)
let block_revision (db : db) (eid : entity_id) : value =
  match eavt_scalar db eid "block/tx-id" with
  | Some v -> v
  | None -> Int64 0L

(* tag ref ids of an entity — callers that already walked the eavt
   slice pass the collected ids instead of re-seeking *)
let tag_ids_of (db : db) (eid : entity_id) : entity_id list =
  datoms db Eavt ~e:eid ~a:"block/tags" ()
  |> Seq.filter_map (fun (d : datom) ->
       match d.v with Ref id -> Some id | _ -> None)
  |> List.of_seq

let tag_ident_value ~(cache : batch_cache) (db : db) (id : entity_id)
    : value option =
  match Hashtbl.find_opt cache.tag_ident_value id with
  | Some v -> v
  | None ->
      let v = eavt_scalar db id "db/ident" in
      Hashtbl.replace cache.tag_ident_value id v;
      v

let tagged_with_ident ~(cache : batch_cache) (db : db)
    (tag_ids : entity_id list) (tag_ident : string) : bool =
  List.exists
    (fun id -> tag_ident_value ~cache db id = Some (Keyword tag_ident))
    tag_ids

let property_entity ~(cache : batch_cache) (db : db)
    (tag_ids : entity_id list) : bool =
  tagged_with_ident ~cache db tag_ids "logseq.class/Property"

let class_entity ~(cache : batch_cache) (db : db)
    (tag_ids : entity_id list) : bool =
  tagged_with_ident ~cache db tag_ids "logseq.class/Tag"

(* memoized get-block-classes-properties keyed by the tag set — the
   result depends only on the tags (eid just locates them), and a whole
   window of pages typically shares one class hierarchy. No tags means
   no classes, so the entity walks can be skipped entirely *)
let classes_properties_of ~(cache : batch_cache) (db : db)
    (tag_ids : entity_id list) (eid : entity_id)
    : Outliner_property.block_classes_properties =
  match Hashtbl.find_opt cache.classes_props tag_ids with
  | Some cp -> cp
  | None ->
      let cp =
        if tag_ids = [] then
          { Outliner_property.classes = []
          ; all_classes = []
          ; classes_properties = [] }
        else Outliner_property.get_block_classes_properties db eid
      in
      Hashtbl.replace cache.classes_props tag_ids cp;
      cp

let block_has_children (db : db) (block_id : entity_id) : bool =
  match Seq.uncons (datoms db Avet ~a:"block/parent" ~v:(Ref block_id) ()) with
  | Some _ -> true
  | None -> false

let order_list_type_of_value (db : db) (v : value) : string option =
  let label =
    match v with
    | Ref n -> (
        match eavt_scalar db n "block/title" with
        | Some (String s) -> s
        | _ -> "")
    | Int64 n -> (
        match Option.bind (Datascript.Util.int64_to_int n)
                (fun n -> eavt_scalar db n "block/title") with
        | Some (String s) -> s
        | _ -> "")
    | String s -> s
    | Keyword s -> s
    | _ -> ""
  in
  if label = "" then None
  else Some (Unicode.lowercase label)

let canonical_block_excluded_attrs =
  [ "block/children"; "block/properties"; "block/properties-text-values"
  ; "block/path-refs" ]

let canonical_attr (a : attr) : bool =
  (not (List.mem a canonical_block_excluded_attrs))
  &&
  (match String.index_opt a '/' with
   | Some i -> String.sub a 0 i <> "block.temp"
   | None -> true)

(* render-attr-schema — (d/schema db) entry or the attr entity's
   :db/valueType / :db/cardinality *)
let render_attr_schema ~(cache : batch_cache) (db : db) (a : attr)
    : value_type option * cardinality option =
  match Hashtbl.find_opt cache.attr_schema a with
  | Some entry -> entry
  | None ->
      let entry =
        match List.assoc_opt a (Datascript.schema db) with
        | Some sa -> (sa.value_type, Some sa.cardinality)
        | None -> (
            match ident_entity ~cache db a with
            | Some e ->
                let vt =
                  match Ldb.value e "db/valueType" with
                  | Some (Keyword "db.type/ref") -> Some RefType
                  | Some (Keyword _) -> None
                  | _ -> None
                and card =
                  match Ldb.value e "db/cardinality" with
                  | Some (Keyword "db.cardinality/many") -> Some Many
                  | Some _ -> Some One
                  | _ -> None
                in
                (vt, card)
            | None -> (None, None))
      in
      Hashtbl.replace cache.attr_schema a entry;
      entry

(* renderer titles — only resolve through the entity when the stored
   title contains the "[[" id-ref marker *)
let renderer_display_title (db : db) (title_v : value option)
    (eid : entity_id) : string option =
  match title_v with
  | Some (String s) ->
      if Common_util.str_index_of s "[[" <> None
      then
        (match Ldb.ent_of_id db eid with
         | Some e ->
             (* cljs entity-plus :block/title → get-block-title:
                journals get the formatted title, others get the stored
                title with id refs replaced by title refs *)
             if Ldb.is_journal e then
               (match Ldb.raw_title db e with
                | Some (String t) -> Some t
                | _ -> None)
             else
               Some
                 (Db_content.id_ref_to_title_ref s
                    (Ldb.ref_ents e "block/refs"))
         | None -> None)
      else Some s
  | _ -> None

(* cljs renderer-raw-title — entity-plus :block/raw-title only when the
   stored title contains "[["; otherwise the stored title as-is *)
let renderer_raw_title (db : db) (title_v : value option)
    (eid : entity_id) : string option =
  match title_v with
  | Some (String s) ->
      if Common_util.str_index_of s "[[" <> None
      then
        (match Ldb.ent_of_id db eid with
         | Some e -> (
             match Ldb.raw_title db e with
             | Some (String t) -> Some t
             | _ -> None)
         | None -> None)
      else Some s
  | _ -> None

(* ---- positioned-property machinery (handler/property.cljs) ---- *)

let render_property_positions = [ "block-left"; "block-right"; "block-below" ]

let render_schema_or_tag_related_property (property_id : string) : bool =
  property_id = "block/tags"
  ||
  (match String.index_opt property_id '/' with
   | Some i ->
       String.sub property_id 0 i = "logseq.property.class"
       || List.mem property_id Db_schema.schema_properties
   | None -> List.mem property_id Db_schema.schema_properties)

(* render-tag-class-page? — entity tagged :logseq.class/Tag or instance.
   A block with no tags can only be the Tag class page itself (idents
   are unique) — skips the class-instance walk entirely *)
(* memoized per tag set — Entity_view.class_instance reads only
   block/tags plus the classes' parent chains, so a whole window of
   same-class pages shares one result. The logseq.class/Tag self-check
   stays per-block. *)
let render_tag_class_page ~(cache : batch_cache) (db : db)
    ~(tag_ids : entity_id list) (block : entity) : bool =
  match ident_entity ~cache db "logseq.class/Tag" with
  | Some tag when tag.id = block.id -> true
  | Some tag ->
      if tag_ids = [] then false
      else
        let key = List.sort_uniq compare tag_ids in
        (match Hashtbl.find_opt cache.tag_class_page key with
         | Some b -> b
         | None ->
             let r =
               Entity_view.class_instance (Entity_view.of_entity tag)
                 (Entity_view.of_entity block)
             in
             Hashtbl.replace cache.tag_class_page key r;
             r)
  | None -> false

(* cljs direct-block-property-ids — db-property/property?; callers in
   an eavt walk pass their own collected ids, standalone callers use
   this bounded walk *)
let direct_block_property_ids (db : db) (block_id : entity_id) : string list =
  datoms db Eavt ~e:block_id ()
  |> Seq.filter_map (fun (d : datom) ->
       if Db_property.property d.a then Some d.a else None)
  |> List.of_seq
  |> List.sort_uniq String.compare

let property_has_closed_values (property : entity) : bool =
  Ldb.ref_ents property "block/_closed-value-property"
  |> List.exists (fun e -> not (Ldb.recycled e))

let render_bottom_position_property (property : entity) : bool =
  let property_type =
    match Ldb.value property "logseq.property/type" with
    | Some (Keyword k) | Some (String k) -> k
    | _ -> ""
  in
  let node_many =
    property_type = "node"
    && (match Ldb.value property "db/cardinality" with
        | Some (Keyword "db.cardinality/many") -> true
        | _ -> false)
  in
  let ident =
    match Ldb.ident_of property with Some i -> i | None -> ""
  in
  property_type <> "url" && property_type <> "asset"
  && (node_many || property_type <> "default"
      || property_has_closed_values property)
  && not (render_schema_or_tag_related_property ident)

let render_property_position (property : entity) : string =
  match
    Ldb.value property "logseq.property/ui-position"
  with
  | Some (Keyword k | String k)
    when List.mem k ("properties" :: render_property_positions) -> k
  | _ ->
      if render_bottom_position_property property then "block-below"
      else "properties"

let positioned_property_meta ~(cache : batch_cache) (db : db)
    (property_id : string)
    : (entity * string * bool * bool * bool * bool) option =
  match Hashtbl.find_opt cache.positioned_meta property_id with
  | Some meta -> meta
  | None ->
      let meta =
        match ident_entity ~cache db property_id with
        | None -> None
        | Some property ->
            Some
              ( property
              , render_property_position property
              , Ldb.value property "logseq.property/public?" <> Some (Bool false)
              , Ldb.value property "logseq.property/hide?" = Some (Bool true)
              , Ldb.value property "logseq.property/hide-empty-value"
                = Some (Bool true)
              , Option.is_some (Ldb.value property "logseq.property/default-value")
                || Option.is_some
                     (Ldb.value property "logseq.property/scalar-default-value") )
      in
      Hashtbl.replace cache.positioned_meta property_id meta;
      meta

(* the property's ui-position comes straight from its meta, so a
   property positions at exactly one slot — one direct-value lookup
   instead of a seek per candidate position *)
let render_positioned_property ~(cache : batch_cache) db
    ~(tag_ids : entity_id list) ~(direct_value : attr -> value option)
    (block_id : entity_id) (property_id : string)
    (allow_empty_block_below : bool) : string option =
  match positioned_property_meta ~cache db property_id with
  | None -> None
  | Some (_, property_position, public_, hide, hide_empty, default_) ->
      if not (List.mem property_position render_property_positions)
      then None
      else
        let property_value = direct_value property_id in
        let empty_value = property_value = None && not default_ in
        if
          public_
          && not (hide_empty && empty_value)
          && not hide
          && not
               (property_position = "block-below"
                && property_value = None
                && (not allow_empty_block_below)
                && (match Ldb.ent_of_id db block_id with
                    | Some b -> not (render_tag_class_page ~cache ~tag_ids db b)
                    | None -> true))
        then Some property_position
        else None

let block_positioned_property_idents_by_position ~(cache : batch_cache)
    (db : db) ~(tag_ids : entity_id list) ~(own_property_ids : string list)
    ~(direct_value : attr -> value option)
    (block_id : entity_id) : (string * string list) list =
  let block = Ldb.ent_of_id db block_id in
  let class_page =
    match block with
    | Some b -> render_tag_class_page ~cache ~tag_ids db b
    | None -> false
  in
  let classes_properties =
    if class_page then []
    else
      (classes_properties_of ~cache db tag_ids block_id)
        .classes_properties
  in
  let classes_property_ids_set =
    List.filter_map (entity_ident_of ~cache) classes_properties
  in
  let property_ids =
    if class_page then own_property_ids
    else
      List.sort_uniq String.compare
        (own_property_ids @ classes_property_ids_set)
  in
  let grouped =
    List.filter_map
      (fun property_id ->
        render_positioned_property ~cache ~tag_ids ~direct_value db
          block_id property_id
          (List.mem property_id classes_property_ids_set)
        |> Option.map (fun pos -> (pos, property_id)))
      property_ids
  in
  (* group-by position, sort entities by db-property/sort-properties *)
  List.filter_map
      (fun position ->
        let idents =
          List.filter_map (fun (p, id) -> if p = position then Some id else None)
            grouped
        in
        match idents with
        | [] -> None
        | _ ->
            let ents =
              List.filter_map
                (fun id -> ident_entity ~cache db id)
                idents
              |> sort_properties_of ~cache
            in
            Some
              ( position
              , List.filter_map (entity_ident_of ~cache) ents ))
      render_property_positions

(* common-initial-data/get-block-refs-count with the cljs limit —
   None once the count would exceed the bound *)
let block_refs_count_bounded ~(cache : batch_cache) (db : db)
    ~(is_class : bool) ~(entity_ident : attr option)
    ~(forward_aliases : entity_id list)
    (id : entity_id) (limit : int) : int option =
  let backward_aliases =
    List.map (fun (d : datom) -> d.e)
      (List.of_seq (datoms db Avet ~a:"block/alias" ~v:(Ref id) ()))
  in
  let with_alias =
    List.sort_uniq compare (id :: forward_aliases @ backward_aliases)
  in
  let hidden_ref =
    Db_view.hidden_ref_id_pred_with db id
      ~hidden_eid:(hidden_eid_pred ~cache db) ~is_class ~entity_ident ()
  in
  let exception Over_limit in
  try
    let total =
      List.fold_left
        (fun total alias_id ->
          List.fold_left
            (fun n (d : datom) ->
              if n > limit then raise Over_limit
              else if hidden_ref (Some d.e) then n
              else n + 1)
            total
            (List.of_seq (datoms db Avet ~a:"block/refs" ~v:(Ref alias_id) ())))
        0 with_alias
    in
    if total > limit then None else Some total
  with Over_limit -> None

let block_refs_count_scan_limit = 500

let block_refs_count ~(cache : batch_cache) (db : db)
    ~(tag_ids : entity_id list) ~(ident_v : value option)
    ~(alias_ids : entity_id list)
    (block_id : entity_id) : int option =
  let entity_ident =
    match ident_v with Some (Keyword a) -> Some a | _ -> None
  in
  if property_entity ~cache db tag_ids then Some 0
  else if class_entity ~cache db tag_ids then Some 0
  else if
    Seq.is_empty (datoms db Avet ~a:"block/refs" ~v:(Ref block_id) ())
    && alias_ids = []
    && Seq.is_empty (datoms db Avet ~a:"block/alias" ~v:(Ref block_id) ())
  then Some 0
  else
    (* is_class=false: class entities already returned Some 0 above *)
    block_refs_count_bounded ~cache db ~is_class:false ~entity_ident
      ~forward_aliases:alias_ids block_id
      block_refs_count_scan_limit

(* inline-ref-attr? — :block/refs only when titles need id-ref
   replacement *)
let inline_ref_attr (a : attr) (replace_id_refs : bool) : bool =
  a <> "block/refs" || replace_id_refs

(* canonical-block — the whole eavt slice as a row map *)
let canonical_block ~(cache : batch_cache) (db : db)
    (block : entity) : Wire.t =
  let entity_id = block.id in
  (* single eavt walk: collects the scalar datoms, tag ref ids and own
     property ids alongside the attr map — the cljs original issues ~10
     separate bounded seeks per block here (uuid/tx-id/title ×3 reads,
     order-list-type, tags ×3, a second full eavt pass for property
     ids); on storage-backed indexes each is a real read *)
  let tbl : (Wire.t, Wire.t) Hashtbl.t = Hashtbl.create 17 in
  let many_tbl : (Wire.t, Wire.t list ref) Hashtbl.t = Hashtbl.create 7 in
  let key_order = ref [ kw "db/id" ] in
  Hashtbl.replace tbl (kw "db/id") (Wire.Int entity_id);
  let uuid_v = ref None
  and tx_v = ref None
  and title_v = ref None
  and order_list_v = ref None
  and tag_ids = ref []
  and own_property_ids = ref []
  and pending_refs = ref []
  and ident_v = ref None
  and alias_ids = ref []
  and attr_first : (attr, value) Hashtbl.t = Hashtbl.create 17 in
  let emit_attr (d : datom) =
    let vt, card = render_attr_schema ~cache db d.a in
    let value =
      match vt with
      | Some RefType -> (
          (* shallow-ref-identity -> wire map *)
          let node =
            match d.v with
            | Ref id -> Some id
            | Int64 id -> Datascript.Util.int64_to_int id
            | _ -> None
          in
          match node with
          | Some ref_id ->
              let pairs =
                Block_breadcrumb.shallow_ref_identity
                  ~cache:cache.ref_cache
                  ~attr:d.a
                  db (Entity_view.of_pulled (Entity_view.pulled_stub ref_id))
              in
              Wire.Map
                (List.map
                   (fun (a, v) -> (kw a, Ds_wire.transit_of_value v))
                   pairs)
          | None -> Ds_wire.transit_of_value d.v)
      | _ -> Ds_wire.transit_of_value d.v
    in
    let key = kw d.a in
    match card with
    | Some Many -> (
        match Hashtbl.find_opt many_tbl key with
        | Some vals -> vals := value :: !vals
        | None ->
            key_order := key :: !key_order;
            Hashtbl.replace many_tbl key (ref [ value ]))
    | _ ->
        if not (Hashtbl.mem tbl key || Hashtbl.mem many_tbl key)
        then key_order := key :: !key_order;
        (match Hashtbl.find_opt many_tbl key with
         | Some vals -> vals := value :: !vals
         | None -> Hashtbl.replace tbl key value)
  in
  datoms db Eavt ~e:entity_id ()
  |> Seq.iter (fun (d : datom) ->
       (match d.a with
        | "block/uuid" -> uuid_v := Some d.v
        | "block/tx-id" -> tx_v := Some d.v
        | "block/title" -> title_v := Some d.v
        | "logseq.property/order-list-type" -> order_list_v := Some d.v
        | "db/ident" -> ident_v := Some d.v
        | "block/alias" -> (
            match d.v with
            | Ref id -> alias_ids := id :: !alias_ids
            | _ -> ())
        | "block/tags" -> (
            match d.v with
            | Ref id -> tag_ids := id :: !tag_ids
            | _ -> ())
        | _ -> ());
       if Db_property.property d.a then
         own_property_ids := d.a :: !own_property_ids;
       if not (Hashtbl.mem attr_first d.a) then
         Hashtbl.replace attr_first d.a d.v;
       if canonical_attr d.a then
         if d.a = "block/refs" then
           pending_refs := d :: !pending_refs
         else emit_attr d);
  let tag_ids = !tag_ids in
  let own_property_ids =
    List.sort_uniq String.compare !own_property_ids
  in
  let block_uuid =
    match !uuid_v with
    | Some (Uuid u) -> Some u
    | _ -> None
  in
  let block_tx_id =
    match !tx_v with Some v -> v | None -> Int64 0L
  in
  let stored_title = !title_v in
  let replace_id_refs =
    match stored_title with
    | Some (String s) -> Common_util.str_index_of s "[[" <> None
    | _ -> false
  in
  (* :block/refs is inlined only for titles containing id refs; the
     datoms were withheld during the fold because refs sort before
     title in eavt order *)
  if replace_id_refs then
    List.iter emit_attr (List.rev !pending_refs);
  let raw_title = renderer_raw_title db stored_title entity_id in
  let display_title = renderer_display_title db stored_title entity_id in
  let order_list_type =
    match !order_list_v with
    | Some v -> order_list_type_of_value db v
    | None -> None
  in
  (match block_uuid with
   | Some _ -> ()
   | None ->
       fail_render_read "Invalid canonical block UUID"
         [ (kw "db-id", Wire.Int entity_id) ]);
  if not (valid_revision block_tx_id) then
    fail_render_read "Invalid canonical block transaction ID"
      [ (kw "db-id", Wire.Int entity_id)
      ; (kw "block-uuid", Wire.Uuid (Option.value block_uuid ~default:""))
      ; (kw "block-tx-id", Ds_wire.transit_of_value block_tx_id) ];
  let block_tx_id =
    match block_tx_id with Int64 n -> n | _ -> assert false
  in
  let attrs =
    List.rev_map
      (fun key ->
        match Hashtbl.find_opt many_tbl key with
        | Some vals -> (key, Wire.Array (List.rev !vals))
        | None -> (key, Hashtbl.find tbl key))
      !key_order
  in
  (* cljs assoc semantics: later keys replace earlier ones *)
  let assoc key value map = (key, value) :: List.remove_assoc key map in
  let refs_count =
    match block_refs_count ~cache ~tag_ids ~ident_v:!ident_v
            ~alias_ids:!alias_ids db entity_id with
    | Some n -> Wire.Int n
    | None -> Wire.Nil
  in
  let has_children = Wire.Bool (block_has_children db entity_id) in
  let class_idents =
    Wire.Set
      (List.map kw
         ((classes_properties_of ~cache db tag_ids entity_id)
            .classes_properties
          |> List.filter_map (entity_ident_of ~cache)
          |> List.sort_uniq String.compare))
  in
  let positioned =
    Wire.Map
      (List.map
         (fun (position, idents) ->
           ( kw position
           , Wire.Array
               (List.filter_map
                  (fun ident ->
                    match ident_entity ~cache db ident with
                    | Some p ->
                        Some (display_property_map_of ~cache db p)
                    | None -> None)
                  idents) ))
         (block_positioned_property_idents_by_position ~cache
            ~tag_ids ~own_property_ids
            ~direct_value:(Hashtbl.find_opt attr_first) db entity_id))
  in
  let block' =
    assoc (kw "block/tx-id") (Ds_wire.wire_int64 block_tx_id)
      (assoc
         (kw "block.temp/refs-count") refs_count
         (assoc
            (kw "block.temp/has-children?") has_children
            (assoc
               (kw "block.temp/class-property-idents") class_idents
               (assoc
                  (kw "block.temp/positioned-properties") positioned
                  attrs))))
  in
  (* view-for + no sort-groups-desc? -> default true *)
  let block' =
    if
      List.mem_assoc (kw "logseq.property/view-for") block'
      && not (List.mem_assoc (kw "logseq.property.view/sort-groups-desc?") block')
    then assoc (kw "logseq.property.view/sort-groups-desc?") (Wire.Bool true) block'
    else block'
  in
  let block' =
    if property_entity ~cache db tag_ids then
      let closed_values =
        match
          List.find_opt
            (fun (k, _) -> k = kw "property/closed-values")
            (match Property_maps.display_property_map db block with
             | Wire.Map kvs -> kvs
             | _ -> [])
        with
        | Some (_, v) -> v
        | None -> Wire.Array []
      in
      assoc (kw "property/closed-values") closed_values block'
    else block'
  in
  let block' =
    match raw_title with
    | Some t -> assoc (kw "block/raw-title") (Wire.String t) block'
    | None -> block'
  in
  let block' =
    match display_title with
    | Some t -> assoc (kw "block/title") (Wire.String t) block'
    | None -> block'
  in
  let block' =
    match order_list_type with
    | Some lt ->
        assoc
          (kw "block.temp/order-list-index")
          (match Plain_value.order_list_index block lt with
           | Some w -> w
           | None -> Wire.Nil)
          block'
    | None -> block'
  in
  Wire.Map block'

(* canonical-blocks — {:basis-rev :groups :blocks} *)
let canonical_blocks (db : db) ?cache (block_uuids : Wire.t list) : Wire.t =
  let requested =
    List.filter_map
      (fun w ->
        match w with
        | Wire.Uuid u -> (
            match entity db (Lookup_ref ("block/uuid", Uuid u)) with
            | Some e -> Some (u, e)
            | None -> None)
        | _ ->
            fail_render_read "Invalid canonical block UUID" [])
      block_uuids
  in
  let cache = match cache with Some c -> c | None -> new_batch_cache () in
  let groups =
    List.map
      (fun (u, _) ->
        (Wire.Uuid u, Wire.Set [ Wire.Uuid u ]))
      requested
  in
  let blocks =
    List.map
      (fun (u, e) -> (Wire.Uuid u, canonical_block ~cache db e))
      requested
  in
  Wire.Map
    [ (kw "basis-rev", Wire.Int (render_basis_rev db))
    ; (kw "groups", Wire.Map groups)
    ; (kw "blocks", Wire.Map blocks) ]

let () =
  Sync_deps.canonical_blocks_fn :=
    Some (fun db block_uuids -> canonical_blocks db block_uuids)
