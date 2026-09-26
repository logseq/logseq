(* frontend.worker.render-affected-keys — derive explicit renderer
   resource invalidations from one transaction report. 1:1 port of
   render_affected_keys.cljs; every key shape and predicate is preserved.

   Keys are wire vectors (cljs vectors inside a set); dedupe uses cljs
   set semantics via structural uniqueness — first-occurrence order. *)

open Datascript

let kw s = Wire.Keyword s

(* ---------- attribute sets (cljs #{}) ---------- *)

let property_metadata_attrs =
  [ "db/cardinality"; "logseq.property/type"; "logseq.property/public?"
  ; "logseq.property/built-in?"; "logseq.property/hide?"
  ; "logseq.property/hide-empty-value"; "logseq.property/ui-position"
  ; "logseq.property/view-context"
  ; "logseq.property/scalar-default-value"
  ; "logseq.property/default-value"; "logseq.property/classes"
  ; "logseq.property.class/extends"
  ; "logseq.property.class/properties" ]

let page_identity_attrs = [ "block/name"; "block/uuid" ]

let visibility_attrs =
  [ "block/closed-value-property"; "logseq.property/built-in?"
  ; "logseq.property/deleted-at"; "logseq.property/hide?" ]

let page_membership_attrs =
  page_identity_attrs @ visibility_attrs @ [ "block/tags" ]

let comments_attrs =
  [ "block/order"; "block/tags"; "logseq.property.comments/blocks"
  ; "logseq.property/deleted-at" ]

let children_membership_attrs =
  [ "block/closed-value-property"; "block/order"; "block/parent"
  ; "logseq.property/created-from-property"
  ; "logseq.property/deleted-at" ]

let route_candidate_attrs =
  [ "block/page"; "block/refs"; "block/tags"; "block/title"
  ; "logseq.property/heading" ]

let bidirectional_property_config_attrs =
  [ "db/ident"; "db/valueType"; "logseq.property/classes"
  ; "logseq.property/deleted-at" ]

let bidirectional_class_config_attrs =
  [ "block/created-at"; "block/tags"; "block/title"
  ; "logseq.property.class/bidirectional-property-title"
  ; "logseq.property.class/enable-bidirectional?"
  ; "logseq.property/built-in?"; "logseq.property/deleted-at" ]

let in_attrs a attrs = List.mem a attrs

(* ---------- entity access ---------- *)

let entity_at (db : db) (entity_id : entity_id) : entity option =
  entity db (Entity_id entity_id)

(* cljs (d/entity db v) over a raw datom value *)
let entity_at_value (db : db) (v : value) : entity option =
  match v with
  | Ref id -> entity db (Entity_id id)
  | Int64 id -> entity db (Entity_id (Datascript.Util.int64_to_int_exn "entity id" id))
  | Keyword s -> entity db (Ident s)
  | _ -> None

let value_id (v : value) : entity_id option =
  match v with Ref id -> Some id | Int64 id -> Datascript.Util.int64_to_int id | _ -> None

let entity_uuid_at (db : db) (entity_id : entity_id) : string option =
  match entity_at db entity_id with
  | Some e -> (
      match Ldb.value e "block/uuid" with
      | Some (Uuid u) -> Some u
      | _ -> None)
  | None -> None

let ref_uuid_at = entity_uuid_at

(* cljs values — ref/coll values unwrapped to a list *)
let entity_ref_ids (e : entity) (a : attr) : entity_id list =
  Ldb.values e a |> List.filter_map value_id

(* cljs (some #(= ident (:db/ident %)) (values (:block/tags entity))) —
   tag values resolve to entities; non-entity values never match *)
let tagged_with_ident (e : entity) (ident : string) : bool =
  List.exists
    (fun id ->
      match entity e.db (Entity_id id) with
      | Some t -> Ldb.ident_of t = Some ident
      | None -> false)
    (entity_ref_ids e "block/tags")

let page_e (e : entity) : bool =
  match Ldb.value e "block/name" with Some (String _) -> true | _ -> false

let journal_e (e : entity) : bool =
  Ldb.value e "block/journal-day" <> None
  || tagged_with_ident e "logseq.class/Journal"

let kw_namespace (a : attr) : string option =
  match String.rindex_opt a '/' with
  | Some i when i > 0 -> Some (String.sub a 0 i)
  | _ -> None

let qualified_kw (a : attr) : bool = kw_namespace a <> None

let kw_ns_includes (a : attr) (sub : string) : bool =
  match kw_namespace a with
  | Some ns -> (
      let ln = String.length ns and ls = String.length sub in
      let rec go i =
        if i + ls > ln then false
        else if String.sub ns i ls = sub then true
        else go (i + 1)
      in
      go 0)
  | None -> false

let class_entity (e : entity) : bool =
  entity_ref_ids e "logseq.property.class/extends" <> []
  || (match Ldb.ident_of e with
      | Some ident -> kw_namespace ident = Some "logseq.class"
      | None -> false)
  || tagged_with_ident e "logseq.class/Tag"

let property_entity (e : entity) : bool =
  tagged_with_ident e "logseq.class/Property"
  || (match Ldb.ident_of e with
      | Some ident -> qualified_kw ident && kw_ns_includes ident ".property"
      | None -> false)

let parent_uuid_at (db : db) (entity_id : entity_id) : string option =
  match entity_at db entity_id with
  | Some e -> (
      match Ldb.ref_ent e "block/parent" with
      | Some p -> (
          match Ldb.value p "block/uuid" with
          | Some (Uuid u) -> Some u
          | _ -> None)
      | None -> None)
  | None -> None

let entity_before_or_after pred db_before db_after entity_id =
  (match entity_at db_before entity_id with
   | Some e -> pred e
   | None -> false)
  || (match entity_at db_after entity_id with
      | Some e -> pred e
      | None -> false)

(* ---------- datom filters ---------- *)

let semantic_datoms (tx_data : datom list) : datom list =
  List.filter (fun (d : datom) -> d.a <> "block/tx-id") tx_data

let datom_entity_ids (datoms : datom list) : int list =
  Sync_state.distinct_by Fun.id (List.map (fun (d : datom) -> d.e) datoms)

let entity_datoms (datoms : datom list) : datom list =
  List.filter (fun (d : datom) -> d.a <> "block/updated-at") datoms

(* ---------- key constructors (cljs [:tag ...] vectors) ---------- *)

let k tag = Wire.Array [ kw tag ]
let kv tag v = Wire.Array [ kw tag; v ]

(* ---------- per-family keys ---------- *)

let children_keys db_before db_after datoms : Wire.t list =
  let entity_ids =
    datoms
    |> List.filter_map (fun (d : datom) ->
           if in_attrs d.a children_membership_attrs then Some d.e
           else None)
    |> Sync_state.distinct_by Fun.id
  in
  List.concat_map
    (fun entity_id ->
       [ parent_uuid_at db_before entity_id
       ; parent_uuid_at db_after entity_id ])
    entity_ids
  |> List.filter_map (fun u -> Option.map (fun u -> kv "children" (Wire.Uuid u)) u)

let route_candidate (e : entity) : bool =
  Ldb.value e "logseq.property/heading" <> None
  && (match Ldb.value e "block/title" with
      | Some (String _) -> true
      | _ -> false)

let block_page_uuid (db : db) (entity_id : entity_id) : string option =
  match entity_at db entity_id with
  | Some e -> (
      match Ldb.ref_ent e "block/page" with
      | Some p -> (
          match Ldb.value p "block/uuid" with
          | Some (Uuid u) -> Some u
          | _ -> None)
      | None -> None)
  | None -> None

let route_page_keys db_before db_after datoms : Wire.t list =
  let entity_ids =
    datoms
    |> List.filter_map (fun (d : datom) ->
           if
             in_attrs d.a route_candidate_attrs
             && entity_before_or_after route_candidate db_before db_after d.e
           then Some d.e
           else None)
    |> Sync_state.distinct_by Fun.id
  in
  entity_ids
  |> List.concat_map
       (fun entity_id ->
          [ block_page_uuid db_before entity_id
          ; block_page_uuid db_after entity_id ])
  |> List.filter_map
       (Option.map (fun u -> kv "route-page" (Wire.Uuid u)))

let entity_keys db_before db_after entity_ids : Wire.t list =
  entity_ids
  |> List.concat_map
       (fun entity_id ->
          [ entity_uuid_at db_before entity_id
          ; entity_uuid_at db_after entity_id ])
  |> List.filter_map (Option.map (fun u -> kv "entity" (Wire.Uuid u)))

let attribute_keys datoms : Wire.t list =
  List.concat_map
    (fun (d : datom) -> [ kv "attr" (kw d.a); kv "property-membership" (kw d.a) ])
    datoms

let page_lookup_keys datoms : Wire.t list =
  List.filter_map
    (fun (d : datom) ->
       if in_attrs d.a page_identity_attrs then
         match d.v with
         | Uuid u -> Some (kv "page-lookup" (Wire.Uuid u))
         | String s -> Some (kv "page-lookup" (Wire.String s))
         | _ -> None
       else None)
    datoms

let page_membership_key db_before db_after datoms : Wire.t list =
  let hit =
    List.exists
      (fun (d : datom) ->
         in_attrs d.a page_membership_attrs
         && (in_attrs d.a page_identity_attrs
             || entity_before_or_after page_e db_before db_after d.e))
      datoms
  in
  if hit then [ k "page-membership" ] else []

let journal_key db_before db_after datoms : Wire.t list =
  let hit =
    List.exists
      (fun (d : datom) ->
         d.a = "block/journal-day"
         || (in_attrs d.a
               (visibility_attrs @ [ "block/tags"; "block/uuid" ])
             && entity_before_or_after journal_e db_before db_after d.e))
      datoms
  in
  if hit then [ k "journals" ] else []

let recycle_key datoms : Wire.t list =
  if
    List.exists
      (fun (d : datom) -> d.a = "logseq.property/deleted-at")
      datoms
  then [ k "recycle-roots" ]
  else []

let ref_target_uuid (db : db) (entity_id : entity_id) (a : attr)
    : string option =
  match entity_at db entity_id with
  | Some e -> (
      match Ldb.ref_ent e a with
      | Some t -> (
          match Ldb.value t "block/uuid" with
          | Some (Uuid u) -> Some u
          | _ -> None)
      | None -> None)
  | None -> None

let reaction_keys db_before db_after entity_ids : Wire.t list =
  entity_ids
  |> List.concat_map
       (fun entity_id ->
          [ ref_target_uuid db_before entity_id
              "logseq.property.reaction/target"
          ; ref_target_uuid db_after entity_id
              "logseq.property.reaction/target" ])
  |> List.filter_map
       (function
         | Some u ->
             (match entity db_after
                      (Lookup_ref ("block/uuid", Uuid u)) with
              | Some _ -> Some (kv "reactions" (Wire.Uuid u))
              | None -> None)
         | None -> None)

let comments_keys db_before db_after datoms : Wire.t list =
  datoms
  |> List.filter_map (fun (d : datom) ->
         if in_attrs d.a comments_attrs then Some d.e else None)
  |> List.concat_map
       (fun entity_id ->
          List.concat_map
            (fun db ->
               match entity_at db entity_id with
               | Some comments_area
                 when tagged_with_ident comments_area
                        "logseq.class/Comments" ->
                   List.filter_map
                     (fun id ->
                        match entity_at db id with
                        | Some target -> (
                            match Ldb.value target "block/uuid" with
                            | Some (Uuid u) -> Some (kv "comments" (Wire.Uuid u))
                            | _ -> None)
                        | None -> None)
                     (entity_ref_ids comments_area
                        "logseq.property.comments/blocks")
               | _ -> [])
            [ db_before; db_after ])

let task_time_keys db_before db_after entity_ids : Wire.t list =
  entity_ids
  |> List.concat_map
       (fun entity_id ->
          [ ref_target_uuid db_before entity_id
              "logseq.property.history/block"
          ; ref_target_uuid db_after entity_id
              "logseq.property.history/block" ])
  |> List.filter_map (Option.map (fun u -> kv "task-time" (Wire.Uuid u)))

let status_property (db : db) (entity_id : entity_id) : bool =
  match entity_at db entity_id with
  | Some e -> Ldb.ident_of e = Some "logseq.property/status"
  | None -> false

let status_indexed (db : db) : bool =
  match
    Schema.schema_attr_by_name (Datascript.schema db)
      "logseq.property/status"
  with
  | Some sa -> sa.indexed
  | None -> false

let status_value (db : db) (entity_id : entity_id) : bool =
  (if status_indexed db then
     not
       (Seq.is_empty
          (Datascript.datoms db Datascript.Avet ~a:"logseq.property/status"
             ~v:(Ref entity_id) ()))
   else
     match
       Datascript.q_string db
         "[:find ?owner . :in $ ?status :where \
          [?owner :logseq.property/status ?status]]"
         ~inputs:[ Arg_scalar (Result_entity entity_id) ]
     with
     | [ [ Result_entity _ ] ] -> true
     | _ -> false)
  || (match entity db (Ident "logseq.property/status") with
      | Some status_e -> (
          match Ldb.ref_ent status_e "logseq.property/default-value" with
          | Some dv -> dv.id = entity_id
          | None -> false)
      | None -> false)

let class_has_status_property (db : db) (class_id : entity_id) : bool =
  let status_property_id =
    match entity db (Ident "logseq.property/status") with
    | Some e -> Some e.id
    | None -> None
  in
  let rec loop classes seen =
    match classes with
    | [] -> false
    | class_ :: rest ->
        if List.mem class_.id seen then loop rest seen
        else
          let props =
            List.exists
              (fun id -> Some id = status_property_id)
              (entity_ref_ids class_ "logseq.property.class/properties")
          in
          if props then true
          else
            loop
              (rest
               @ List.filter_map
                   (fun id -> entity_at db id)
                   (entity_ref_ids class_
                      "logseq.property.class/extends"))
              (class_.id :: seen)
  in
  (match entity_at db class_id with
   | Some class_ -> loop [ class_ ] []
   | None -> false)

let task_query_changed db_before db_after datoms : bool =
  let class_has_status db v =
    match entity_at_value db v with
    | Some e -> class_has_status_property db e.id
    | None -> false
  in
  let status_prop_v db v =
    match entity_at_value db v with
    | Some e -> Ldb.ident_of e = Some "logseq.property/status"
    | None -> false
  in
  List.exists
    (fun (d : datom) ->
       d.a = "logseq.property/status"
       || (d.a = "block/tags"
           && (class_has_status db_before d.v
               || class_has_status db_after d.v))
       || (d.a = "logseq.property.class/extends"
           && (class_has_status db_before (Ref d.e)
               || class_has_status db_after (Ref d.e)
               || class_has_status db_before d.v
               || class_has_status db_after d.v))
       || (d.a = "logseq.property.class/properties"
           && (status_prop_v db_before d.v || status_prop_v db_after d.v))
       || (in_attrs d.a
             [ "db/ident"; "logseq.property/default-value"
             ; "logseq.property/public?" ]
           && (status_property db_before d.e
               || status_property db_after d.e
               || status_prop_v db_before d.v
               || status_prop_v db_after d.v))
       || (in_attrs d.a [ "block/title"; "logseq.property/value" ]
           && (status_value db_before d.e || status_value db_after d.e)))
    datoms

let task_entity (db : db) (entity_id : entity_id) : bool =
  not
    (Seq.is_empty
       (Datascript.datoms db Datascript.Eavt ~e:entity_id
          ~a:"logseq.property/status" ()))
  || (match entity_at db entity_id with
      | Some e ->
          List.exists
            (fun tag_id -> class_has_status_property db tag_id)
            (entity_ref_ids e "block/tags")
      | None -> false)

let task_attribute_keys db_before db_after datoms : Wire.t list =
  let grouped =
    List.fold_left
      (fun acc (d : datom) ->
         match List.assoc_opt d.e acc with
         | Some ds -> (d.e, d :: ds) :: List.remove_assoc d.e acc
         | None -> (d.e, [ d ]) :: acc)
      [] datoms
  in
  grouped
  |> List.concat_map
       (fun (entity_id, ds) ->
          if
            task_entity db_before entity_id
            || task_entity db_after entity_id
          then List.map (fun (d : datom) -> kv "task-attr" (kw d.a)) ds
          else [])

let display_property_keys db_before db_after datoms : Wire.t list =
  List.filter_map
    (fun (d : datom) ->
       if
         in_attrs d.a [ "block/tags"; "block/closed-value-property" ]
         || (match entity db_before (Ident d.a) with
             | Some e -> property_entity e
             | None -> false)
         || (match entity db_after (Ident d.a) with
             | Some e -> property_entity e
             | None -> false)
       then
         match
           ( entity_uuid_at db_after d.e
           , entity_uuid_at db_before d.e )
         with
         | Some u, _ | None, Some u ->
             Some (kv "display-properties" (Wire.Uuid u))
         | _ -> None
       else None)
    datoms

let property_config_changed db_before db_after datoms : bool =
  List.exists
    (fun (d : datom) ->
       in_attrs d.a property_metadata_attrs
       && entity_before_or_after property_entity db_before db_after d.e)
    datoms

let enabled_bidirectional_class_ids (db : db) (source : entity)
    : entity_id list =
  entity_ref_ids source "block/tags"
  |> List.filter_map
       (fun id ->
          match entity_at db id with
          | Some class_
            when tagged_with_ident class_ "logseq.class/Tag"
                 && Ldb.value class_
                      "logseq.property.class/enable-bidirectional?"
                    = Some (Bool true)
                 && not (Ldb.built_in class_)
                 && not (Ldb.recycled class_) ->
              Some class_.id
          | _ -> None)

let bidirectional_property (db : db) (a : attr)
    (enabled_class_ids : entity_id list) : bool =
  qualified_kw a && kw_ns_includes a ".property"
  &&
  match entity db (Ident a) with
  | Some property ->
      let property_class_ids =
        entity_ref_ids property "logseq.property/classes"
      in
      Ldb.value property "db/valueType" = Some (Keyword "db.type/ref")
      && not (Ldb.recycled property)
      && List.exists
           (fun cid -> List.mem cid property_class_ids)
           enabled_class_ids
  | None -> false

let bidirectional_target_uuids (db : db) (source_id : entity_id)
    : string list =
  match entity_at db source_id with
  | None -> []
  | Some source ->
      let enabled_class_ids =
        enabled_bidirectional_class_ids db source
      in
      if
        enabled_class_ids = []
        || Ldb.recycled source
        || tagged_with_ident source "logseq.class/Tag"
        || tagged_with_ident source "logseq.class/Property"
      then []
      else
        Datascript.entity_attrs source
        |> List.concat_map
             (fun (a, _v) ->
                if bidirectional_property db a enabled_class_ids then
                  entity_ref_ids source a
                  |> List.filter_map
                       (fun id ->
                          if id = source_id then None
                          else
                            match entity_at db id with
                            | Some target
                              when Ldb.value target
                                     "logseq.property/created-from-property"
                                   = None -> (
                                match Ldb.value target "block/uuid" with
                                | Some (Uuid u) -> Some u
                                | _ -> None)
                            | _ -> None)
                else [])
        |> Sync_state.distinct_by Fun.id

let source_ids_for_property (db : db) (property_id : entity_id)
    : entity_id list =
  match entity_at db property_id with
  | Some property -> (
      match Ldb.ident_of property with
      | Some ident ->
          Datascript.datoms db Datascript.Aevt ~a:ident ()
          |> List.of_seq |> List.map (fun (d : datom) -> d.e)
          |> Sync_state.distinct_by Fun.id
      | None -> [])
  | None -> []

let source_ids_for_class (db : db) (class_id : entity_id) : entity_id list =
  Datascript.datoms db Datascript.Avet ~a:"block/tags" ~v:(Ref class_id) ()
  |> List.of_seq |> List.map (fun (d : datom) -> d.e)
  |> Sync_state.distinct_by Fun.id

let bidirectional_keys db_before db_after datoms touched_entity_ids
    : Wire.t list =
  let property_ids =
    datoms
    |> List.filter_map (fun (d : datom) ->
           if
             in_attrs d.a bidirectional_property_config_attrs
             && entity_before_or_after property_entity db_before db_after
                  d.e
           then Some d.e
           else None)
    |> Sync_state.distinct_by Fun.id
  in
  let class_ids =
    datoms
    |> List.filter_map (fun (d : datom) ->
           if
             in_attrs d.a bidirectional_class_config_attrs
             && entity_before_or_after class_entity db_before db_after d.e
           then Some d.e
           else None)
    |> Sync_state.distinct_by Fun.id
  in
  let source_ids =
    touched_entity_ids
    @ List.concat_map (source_ids_for_property db_before) property_ids
    @ List.concat_map (source_ids_for_property db_after) property_ids
    @ List.concat_map (source_ids_for_class db_before) class_ids
    @ List.concat_map (source_ids_for_class db_after) class_ids
    |> Sync_state.distinct_by Fun.id
  in
  source_ids
  |> List.concat_map
       (fun source_id ->
          bidirectional_target_uuids db_before source_id
          @ bidirectional_target_uuids db_after source_id)
  |> List.filter_map
       (fun u -> Some (kv "bidirectional" (Wire.Uuid u)))

let view_key_at (db : db) (entity_id : entity_id) : Wire.t option =
  match entity_at db entity_id with
  | Some view -> (
      match
        ( Ldb.ref_ent view "logseq.property/view-for"
        , Ldb.value view "logseq.property.view/feature-type" )
      with
      | Some owner, Some (Keyword feature_type) -> (
          match Ldb.value owner "block/uuid" with
          | Some (Uuid u) ->
              Some
                (Wire.Array
                   [ kw "views"; Wire.Uuid u; kw feature_type ])
          | _ -> None)
      | _ -> None)
  | None -> None

let view_keys db_before db_after entity_ids : Wire.t list =
  List.filter_map
    (fun entity_id -> view_key_at db_before entity_id)
    entity_ids
  @ List.filter_map
      (fun entity_id -> view_key_at db_after entity_id)
      entity_ids

let class_membership_keys db_before db_after datoms : Wire.t list =
  datoms
  |> List.concat_map (fun (d : datom) ->
         if d.a = "block/tags" then
           match value_id d.v with
           | Some ref_id ->
               List.filter_map Fun.id
                 [ ref_uuid_at db_before ref_id
                 ; ref_uuid_at db_after ref_id ]
           | None -> []
         else [])
  |> List.map (fun u -> kv "class-membership" (Wire.Uuid u))

let class_tree db_before db_after datoms : bool =
  List.exists
    (fun (d : datom) ->
       in_attrs d.a
         [ "logseq.property.class/extends"
         ; "logseq.property.class/properties" ]
       || (in_attrs d.a [ "block/tags"; "block/uuid"; "db/ident" ]
           && entity_before_or_after class_entity db_before db_after d.e))
    datoms

let ref_target_keys db_before db_after datoms : Wire.t list =
  let direct_target_uuids =
    List.concat_map
      (fun (d : datom) ->
         if d.a = "block/refs" then
           match value_id d.v with
           | Some ref_id ->
               List.filter_map Fun.id
                 [ ref_uuid_at db_before ref_id
                 ; ref_uuid_at db_after ref_id ]
           | None -> []
         else [])
      datoms
  in
  let ref_block_uuids =
    List.concat_map
      (fun (d : datom) ->
         List.concat_map
           (fun db ->
              match entity_at db d.e with
              | Some e ->
                  entity_ref_ids e "block/refs"
                  |> List.filter_map
                       (fun id ->
                          match entity_at db id with
                          | Some t -> (
                              match Ldb.value t "block/uuid" with
                              | Some (Uuid u) -> Some u
                              | _ -> None)
                          | None -> None)
              | None -> [])
           [ db_before; db_after ])
      datoms
  in
  direct_target_uuids @ ref_block_uuids
  |> List.map (fun u -> kv "refs" (Wire.Uuid u))

(* ---------- affected-keys ---------- *)

let affected_keys (tx_report : tx_report) : Wire.t list =
  let db_before = tx_report.db_before and db_after = tx_report.db_after in
  let datoms = semantic_datoms tx_report.tx_data in
  let touched_entity_ids = datom_entity_ids datoms in
  let changed_entity_ids = datom_entity_ids (entity_datoms datoms) in
  let class_tree_changed = class_tree db_before db_after datoms in
  let ref_scope_changed =
    class_tree_changed
    || List.exists (fun (d : datom) -> d.a = "block/alias") datoms
  in
  entity_keys db_before db_after changed_entity_ids
  @ attribute_keys datoms
  @ children_keys db_before db_after datoms
  @ route_page_keys db_before db_after datoms
  @ page_lookup_keys datoms
  @ page_membership_key db_before db_after datoms
  @ journal_key db_before db_after datoms
  @ recycle_key datoms
  @ reaction_keys db_before db_after touched_entity_ids
  @ comments_keys db_before db_after datoms
  @ task_time_keys db_before db_after touched_entity_ids
  @ (if task_query_changed db_before db_after datoms then [ k "tasks" ]
     else [])
  @ task_attribute_keys db_before db_after datoms
  @ display_property_keys db_before db_after datoms
  @ (if property_config_changed db_before db_after datoms then
       [ k "property-config" ]
     else [])
  @ bidirectional_keys db_before db_after datoms touched_entity_ids
  @ view_keys db_before db_after touched_entity_ids
  @ class_membership_keys db_before db_after datoms
  @ (if class_tree_changed then [ k "class-tree" ] else [])
  @ ref_target_keys db_before db_after datoms
  @ (if ref_scope_changed then [ k "ref-scope" ] else [])
  |> Sync_state.distinct_by Fun.id
