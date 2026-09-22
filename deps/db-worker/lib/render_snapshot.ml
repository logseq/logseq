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
  | Int n -> n >= 0
  | _ -> false

let render_basis_rev (db : db) : int =
  if db.max_tx >= 0 then db.max_tx
  else
    fail_render_read "Invalid renderer basis revision"
      [ (kw "basis-rev", Wire.Int db.max_tx) ]

(* cljs block-revision — missing tx-id reads as 0; non-integer values
   pass through so valid-revision? rejects them downstream *)
let block_revision (db : db) (eid : entity_id) : value =
  match eavt_scalar db eid "block/tx-id" with
  | Some v -> v
  | None -> Int 0

let tagged_with_ident (db : db) (eid : entity_id) (tag_ident : string) : bool =
  datoms db Eavt ~e:eid ~a:"block/tags" ()
  |> Seq.exists (fun (d : datom) ->
       match d.v with
       | Ref id -> eavt_scalar db id "db/ident" = Some (Keyword tag_ident)
       | _ -> false)

let property_entity (db : db) (eid : entity_id) : bool =
  tagged_with_ident db eid "logseq.class/Property"

let class_entity (db : db) (eid : entity_id) : bool =
  tagged_with_ident db eid "logseq.class/Tag"

let block_has_children (db : db) (block_id : entity_id) : bool =
  match Seq.uncons (datoms db Avet ~a:"block/parent" ~v:(Ref block_id) ()) with
  | Some _ -> true
  | None -> false

let block_order_list_type (db : db) (eid : entity_id) : string option =
  match eavt_scalar db eid "logseq.property/order-list-type" with
  | None -> None
  | Some v ->
      let label =
        match v with
        | Int n | Ref n -> (
            match eavt_scalar db n "block/title" with
            | Some (String s) -> s
            | _ -> "")
        | String s -> s
        | Keyword s -> s
        | _ -> ""
      in
      if label = "" then None
      else Some (String.lowercase_ascii label)

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
let render_attr_schema (db : db) (a : attr)
    : value_type option * cardinality option =
  match List.assoc_opt a (Datascript.schema db) with
  | Some sa -> (sa.value_type, Some sa.cardinality)
  | None -> (
      match entity db (Ident a) with
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

(* renderer titles — only resolve through the entity when the stored
   title contains the "[[" id-ref marker *)
let renderer_display_title (db : db) (eid : entity_id) : string option =
  match eavt_scalar db eid "block/title" with
  | Some (String s) ->
      if
        (try String.index s '[' |> fun i -> s.[i + 1] = '['
         with _ -> false)
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
let renderer_raw_title (db : db) (eid : entity_id) : string option =
  match eavt_scalar db eid "block/title" with
  | Some (String s) ->
      if
        (try String.index s '[' |> fun i -> s.[i + 1] = '['
         with _ -> false)
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

(* render-tag-class-page? — entity tagged :logseq.class/Tag or instance *)
let render_tag_class_page (db : db) (block : entity) : bool =
  Ldb.ident_of block = Some "logseq.class/Tag"
  ||
  (match entity db (Ident "logseq.class/Tag") with
   | Some tag ->
       Entity_view.class_instance (Entity_view.of_entity tag)
         (Entity_view.of_entity block)
   | None -> false)

(* cljs direct-block-property-ids — db-property/property? *)
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

let positioned_property_meta (db : db) (property_id : string)
    : (entity * string * bool * bool * bool * bool) option =
  match entity db (Ident property_id) with
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

let render_positioned_property db (block_id : entity_id)
    (property_id : string) (position : string)
    (allow_empty_block_below : bool) : bool =
  match positioned_property_meta db property_id with
  | None -> false
  | Some (_, property_position, public_, hide, hide_empty, default_) ->
      let property_value =
        Property_maps.entity_direct_value db block_id property_id
      in
      let empty_value = property_value = None && not default_ in
      public_
      && property_position = position
      && not (hide_empty && empty_value)
      && not hide
      && not
           (property_position = "block-below"
            && property_value = None
            && (not allow_empty_block_below)
            && (match Ldb.ent_of_id db block_id with
                | Some b -> not (render_tag_class_page db b)
                | None -> true))

let block_positioned_property_idents_by_position (db : db)
    (block_id : entity_id) : (string * string list) list =
  let block = Ldb.ent_of_id db block_id in
  let class_page =
    match block with Some b -> render_tag_class_page db b | None -> false
  in
  let own_property_ids = direct_block_property_ids db block_id in
  let classes_properties =
    if class_page then []
    else
      (Outliner_property.get_block_classes_properties db block_id)
        .classes_properties
  in
  let classes_property_ids_set =
    List.filter_map Ldb.ident_of classes_properties
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
        List.find_opt
          (fun position ->
            render_positioned_property db block_id property_id position
              (List.mem property_id classes_property_ids_set))
          render_property_positions
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
              (fun id -> entity db (Ident id))
              idents
            |> Export_file.sort_properties
          in
          Some
            ( position
            , List.filter_map Ldb.ident_of ents ))
    render_property_positions

(* common-initial-data/get-block-refs-count with the cljs limit —
   None once the count would exceed the bound *)
let block_refs_count_bounded (db : db) (id : entity_id) (limit : int)
    : int option =
  let with_alias =
    List.sort_uniq compare (id :: Db_view.get_block_alias_ids db id)
  in
  let hidden_ref = Db_view.hidden_ref_id_pred db id in
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

let block_refs_count (db : db) (block_id : entity_id) : int option =
  if property_entity db block_id then Some 0
  else if class_entity db block_id then Some 0
  else if
    Seq.is_empty (datoms db Avet ~a:"block/refs" ~v:(Ref block_id) ())
    && Seq.is_empty (datoms db Eavt ~e:block_id ~a:"block/alias" ())
    && Seq.is_empty (datoms db Avet ~a:"block/alias" ~v:(Ref block_id) ())
  then Some 0
  else block_refs_count_bounded db block_id block_refs_count_scan_limit

(* inline-ref-attr? — :block/refs only when titles need id-ref
   replacement *)
let inline_ref_attr (a : attr) (replace_id_refs : bool) : bool =
  a <> "block/refs" || replace_id_refs

(* canonical-block — the whole eavt slice as a row map *)
let canonical_block ~(ref_cache : Block_breadcrumb.cache) (db : db)
    (block : entity) : Wire.t =
  let entity_id = block.id in
  let block_uuid =
    match Ldb.value block "block/uuid" with
    | Some (Uuid u) -> Some u
    | _ -> (
        match eavt_scalar db entity_id "block/uuid" with
        | Some (Uuid u) -> Some u
        | _ -> None)
  in
  let block_tx_id = block_revision db entity_id in
  let stored_title = eavt_scalar db entity_id "block/title" in
  let replace_id_refs =
    match stored_title with
    | Some (String s) -> (
        try String.index s '[' |> fun i -> s.[i + 1] = '['
        with _ -> false)
    | _ -> false
  in
  let raw_title = renderer_raw_title db entity_id in
  let display_title = renderer_display_title db entity_id in
  let order_list_type = block_order_list_type db entity_id in
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
    match block_tx_id with Int n -> n | _ -> assert false
  in
  (* eavt fold *)
  let attrs =
    datoms db Eavt ~e:entity_id ()
    |> Seq.fold_left
         (fun result (d : datom) ->
           if
             canonical_attr d.a
             && inline_ref_attr d.a replace_id_refs
           then
             let vt, card = render_attr_schema db d.a in
             let value =
               match vt with
               | Some RefType -> (
                   (* shallow-ref-identity -> wire map *)
                   let node =
                     match d.v with
                     | Ref id | Int id -> Some id
                     | _ -> None
                   in
                   match node with
                   | Some ref_id ->
                       let pairs =
                         Block_breadcrumb.shallow_ref_identity ~cache:ref_cache
                           db (Entity_view.of_pulled (Entity_view.pulled_stub ref_id))
                       in
                       Wire.Map
                         (List.map
                            (fun (a, v) -> (kw a, Ds_wire.transit_of_value v))
                            pairs)
                   | None -> Ds_wire.transit_of_value d.v)
               | _ -> Ds_wire.transit_of_value d.v
             in
             match card with
             | Some Many ->
                 (* conj onto the coll value *)
                 let key = kw d.a in
                 let rest, cur =
                   List.partition (fun (k, _) -> k <> key) result
                 in
                 let cur_vals =
                   match cur with
                   | [ (_, Wire.Array xs) ] -> xs
                   | [ (_, Wire.Set xs) ] -> xs
                   | _ -> []
                 in
                 (key, Wire.Array (cur_vals @ [ value ])) :: rest
             | _ -> (kw d.a, value) :: List.remove_assoc (kw d.a) result
           else result)
         [ (kw "db/id", Wire.Int entity_id) ]
  in
  let block' = attrs in
  let block' =
    (kw "block/tx-id", Wire.Int block_tx_id)
    :: ( kw "block.temp/refs-count"
       , (match block_refs_count db entity_id with
          | Some n -> Wire.Int n
          | None -> Wire.Nil) )
    :: (kw "block.temp/has-children?",
        Wire.Bool (block_has_children db entity_id))
    :: ( kw "block.temp/positioned-properties"
       , Wire.Map
           (List.map
              (fun (position, idents) ->
                ( kw position
                , Wire.Array
                    (List.filter_map
                       (fun ident ->
                         match entity db (Ident ident) with
                         | Some p ->
                             Some (Property_maps.display_property_map db p)
                         | None -> None)
                       idents) ))
              (block_positioned_property_idents_by_position db entity_id)) )
    :: block'
  in
  (* view-for + no sort-groups-desc? -> default true *)
  let block' =
    if
      List.mem_assoc (kw "logseq.property/view-for") block'
      && not (List.mem_assoc (kw "logseq.property.view/sort-groups-desc?") block')
    then (kw "logseq.property.view/sort-groups-desc?", Wire.Bool true) :: block'
    else block'
  in
  let block' =
    if property_entity db entity_id then
      ( kw "property/closed-values"
      , (match
           List.find_opt
             (fun (k, _) -> k = kw "property/closed-values")
             (match Property_maps.display_property_map db block with
              | Wire.Map kvs -> kvs
              | _ -> [])
         with
         | Some (_, v) -> v
         | None -> Wire.Array []) )
      :: block'
    else block'
  in
  let block' =
    match raw_title with
    | Some t -> (kw "block/raw-title", Wire.String t) :: block'
    | None -> block'
  in
  let block' =
    match display_title with
    | Some t -> (kw "block/title", Wire.String t) :: block'
    | None -> block'
  in
  let block' =
    match order_list_type with
    | Some lt ->
        ( kw "block.temp/order-list-index"
        , (match Plain_value.order_list_index block lt with
           | Some w -> w
           | None -> Wire.Nil) )
        :: block'
    | None -> block'
  in
  Wire.Map block'

(* canonical-blocks — {:basis-rev :groups :blocks} *)
let canonical_blocks (db : db) (block_uuids : Wire.t list) : Wire.t =
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
  let ref_cache : Block_breadcrumb.cache = Hashtbl.create 64 in
  let groups =
    List.map
      (fun (u, _) ->
        (Wire.Uuid u, Wire.Set [ Wire.Uuid u ]))
      requested
  in
  let blocks =
    List.map
      (fun (u, e) -> (Wire.Uuid u, canonical_block ~ref_cache db e))
      requested
  in
  Wire.Map
    [ (kw "basis-rev", Wire.Int (render_basis_rev db))
    ; (kw "groups", Wire.Map groups)
    ; (kw "blocks", Wire.Map blocks) ]

let () = Sync_deps.canonical_blocks_fn := Some canonical_blocks
