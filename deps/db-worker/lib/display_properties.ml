(* frontend.worker.handler.property — the display-properties machinery
   shared by :thread-api/get-blocks and the :block-display-properties /
   page-display render resources.

   Rows are Wire.t maps throughout: property values are produced by
   Plain_value.attribute_value_to_plain, so ref values are the
   `{:db/id :block/uuid ...}` summary maps the cljs
   worker-plain/attribute-value->plain produces. *)

open Datascript

let kw s = Wire.Keyword s
let field k v = (kw k, v)

(* entity-tagged-with? — match cljs by-ident lookup, not deep
   class-instance resolution *)
let entity_tagged_with (e : entity) (tag_ident : string) : bool =
  match entity e.db (Ident tag_ident) with
  | Some tag -> List.exists (fun t -> t.id = tag.id) (Ldb.ref_ents e "block/tags")
  | None -> false

(* display-property-value — worker-plain/attribute-value->plain *)
let display_property_value = Plain_value.attribute_value_to_plain

(* display-properties-for-block — {ident -> value}; cardinality many
   collects into a set. The enable-bidirectional? patch applies only to
   Tag-tagged non-built-in blocks. *)
let display_properties_for_block db (block : entity) : (Wire.t * Wire.t) list =
  let props =
    List.of_seq (datoms db Eavt ~e:block.id ())
    |> List.fold_left
         (fun acc (d : datom) ->
           if Plain_value.db_property_pred d.a then
             let v = display_property_value db d.a d.v in
             if Ldb.many_attr db d.a then
               match Plain_value.map_get d.a acc with
               | Some (Wire.Set vs) -> Plain_value.assoc d.a (Wire.Set (vs @ [ v ])) acc
               | _ -> Plain_value.assoc d.a (Wire.Set [ v ]) acc
             else Plain_value.assoc d.a v acc
           else acc)
         []
  in
  if
    entity_tagged_with block "logseq.class/Tag" && not (Ldb.built_in block)
  then
    match Plain_value.map_get "logseq.property.class/enable-bidirectional?" props with
    | None ->
        Plain_value.assoc "logseq.property.class/enable-bidirectional?"
          (Wire.Bool false) props
    | Some _ -> props
  else props

(* ---- recycled-entity-value helpers ---- *)

(* entity-ref-value? — a wire map carrying :db/id or :block/uuid *)
let entity_ref_value (v : Wire.t) : bool =
  match v with
  | Wire.Map kvs ->
      List.exists
        (fun (k, _) -> k = kw "db/id" || k = kw "block/uuid")
        kvs
  | _ -> false

let entity_of_ref_wire db (v : Wire.t) : entity option =
  match v with
  | Wire.Map kvs -> (
      let get k = List.assoc_opt (kw k) kvs in
      match get "db/id" with
      | Some (Wire.Int id) -> Ldb.ent_of_id db id
      | _ -> (
          match get "block/uuid" with
          | Some (Wire.Uuid u) -> entity db (Lookup_ref ("block/uuid", Uuid u))
          | _ -> None))
  | _ -> None

(* contains-recycled-entity-value? *)
let rec contains_recycled_entity_value db (v : Wire.t) : bool =
  if entity_ref_value v then
    match entity_of_ref_wire db v with
    | Some e -> Ldb.recycled e
    | None -> false
  else
    match v with
    | Wire.Set xs | Wire.Array xs | Wire.List xs ->
        List.exists
          (fun item ->
            entity_ref_value item && contains_recycled_entity_value db item)
          xs
    | _ -> false

(* filter-recycled-entity-values — nil when the value itself is recycled;
   coll members that resolve to recycled entities are dropped *)
let filter_recycled_entity_values db (v : Wire.t) : Wire.t option =
  let active item =
    (not (entity_ref_value item))
    ||
    match entity_of_ref_wire db item with
    | Some e -> not (Ldb.recycled e)
    | _ -> true
  in
  match v with
  | _ when entity_ref_value v -> (
      match entity_of_ref_wire db v with
      | Some e when Ldb.recycled e -> None
      | _ -> Some v)
  | Wire.Set xs -> (
      let kept = List.filter active xs in
      match kept with [] -> None | _ -> Some (Wire.Set kept))
  | Wire.Array xs -> (
      let kept = List.filter active xs in
      match kept with [] -> None | _ -> Some (Wire.Array kept))
  | Wire.List xs -> (
      let kept = List.filter active xs in
      match kept with [] -> None | _ -> Some (Wire.List kept))
  | _ -> Some v

(* sanitize-property-values-for-display — (filtered props, idents whose
   values were recycled-only) *)
let sanitize_property_values_for_display db
    (properties : (Wire.t * Wire.t) list) : (Wire.t * Wire.t) list * string list =
  List.fold_left
    (fun (props, recycled_only) (k, property_value) ->
      let ident = match k with Wire.Keyword s -> s | _ -> "" in
      match filter_recycled_entity_values db property_value with
      | Some v -> (Plain_value.assoc ident v props, recycled_only)
      | None ->
          if contains_recycled_entity_value db property_value then
            (Plain_value.assoc ident Wire.Nil props, recycled_only @ [ ident ])
          else (props, recycled_only))
    ([], []) properties

(* display-property-map* — no cljs volatile cache *)
let display_property_map db (property_id : string) : Wire.t option =
  match entity db (Ident property_id) with
  | Some p -> Some (Property_maps.display_property_map db p)
  | None -> None

(* display-property-row — {:property-id :property :value}; nil when the
   property entity is missing *)
let display_property_row db (property_id : string) (value : Wire.t) :
    Wire.t option =
  match display_property_map db property_id with
  | Some property ->
      Some
        (Wire.Map
           [ field "property-id" (kw property_id)
           ; field "property" property
           ; field "value" value ])
  | None -> None

(* sort-display-property-pairs — [ident value] pairs sorted by
   db-property/sort-properties on their entities *)
let sort_display_property_pairs db (pairs : (string * Wire.t) list) :
    Wire.t list =
  List.filter_map (fun (id, _) -> entity db (Ident id)) pairs
  |> Export_file.sort_properties
  |> List.filter_map (fun (p : entity) ->
         match Ldb.ident_of p with
         | Some ident -> (
             match List.assoc_opt ident pairs with
             | Some v -> display_property_row db ident v
             | None -> None)
         | None -> None)

(* block-class-properties — delegates to
   outliner-property/get-block-classes-properties like cljs *)
let block_class_properties db (block : entity) :
    Outliner_property.block_classes_properties =
  Outliner_property.get_block_classes_properties db block.id

(* block-property-keys — own direct property idents ++ class property
   idents, in encounter order *)
let block_property_keys db (block : entity) : attr list =
  let own_keys =
    List.of_seq (datoms db Eavt ~e:block.id ())
    |> List.filter_map (fun (d : datom) ->
           if Plain_value.db_property_pred d.a then Some d.a else None)
    |> List.sort_uniq String.compare
  in
  let class_keys =
    (block_class_properties db block).classes_properties
    |> List.filter_map Ldb.ident_of
  in
  let seen = Hashtbl.create 15 in
  List.filter
    (fun a ->
      if Hashtbl.mem seen a then false
      else begin
        Hashtbl.replace seen a ();
        true
      end)
    (own_keys @ class_keys)

(* outliner-property/property-with-other-position? — block arg unused
   like cljs bottom-position-property? *)
let property_with_other_position (_block : entity) (property : entity) :
    bool =
  Render_snapshot.render_property_position property <> "properties"

(* display-properties — {:full-properties :hidden-properties
   :description-property :class-properties-property} *)
let display_properties db (block : entity) ~(gallery_view : bool)
    ~(page_title : bool) ~(sidebar_properties : bool) ~(tag_dialog : bool)
    ~(publishing : bool) ~(state_hide_empty_properties : bool)
    ~(show_empty_and_hidden_properties : bool) : Wire.t =
  let page_properties_area =
    (page_title || sidebar_properties || tag_dialog)
    && (entity_tagged_with block "logseq.class/Page"
        || entity_tagged_with block "logseq.class/Tag"
        || entity_tagged_with block "logseq.class/Property"
        || entity_tagged_with block "logseq.class/Journal")
  in
  let properties_kvs = display_properties_for_block db block in
  let properties, recycled_only_property_ids =
    sanitize_property_values_for_display db properties_kvs
  in
  let get_prop ident =
    match Plain_value.map_get ident properties with
    | Some v -> v
    | None -> Wire.Nil
  in
  let remove_built_in_or_other_position_properties
      (property_pairs : (string * Wire.t) list) show_in_hidden_properties =
    List.filter
      (fun (id, _v) ->
        not
          (id = "block/tags"
           ||
           match entity db (Ident id) with
           | Some ent ->
               ((not (Ldb.public_built_in_property ent)) && Ldb.built_in ent)
               || ((not page_properties_area)
                   && (not show_empty_and_hidden_properties)
                   && (not show_in_hidden_properties)
                   && property_with_other_position block ent)
               || (gallery_view
                   && Ldb.ident_of ent
                      = Some "logseq.property.class/properties")
           | None -> false))
      property_pairs
  in
  let { Outliner_property.all_classes; classes_properties; _ } =
    block_class_properties db block
  in
  let classes_properties_set =
    List.filter_map Ldb.ident_of classes_properties
  in
  let prop_ident_of_key = function Wire.Keyword s -> s | _ -> "" in
  let block_own_properties =
    List.filter
      (fun (k, _) ->
        let id = prop_ident_of_key k in
        (not (List.mem id recycled_only_property_ids))
        && not (List.mem id classes_properties_set))
      properties
  in
  (* common-view/empty-value? + db-property/property-value-content —
     a value is empty when it is missing, or when its resolved entity
     has blank content ((or :block/title :logseq.property/value)).
     cljs nil? checks on `properties` only cover the missing case;
     a ref to a blank-title value block is empty by upstream content
     semantics. A ref that does not resolve is left non-empty, matching
     the non-nil `{:db/id _}` summary upstream keeps visible. *)
  let empty_property_value (v : Wire.t) : bool =
    match v with
    | Wire.Nil -> true
    | Wire.Keyword "logseq.property/empty-placeholder" -> true
    | Wire.String s -> String.trim s = ""
    | Wire.Set [] | Wire.Array [] | Wire.List [] -> true
    | _ when entity_ref_value v -> (
        match entity_of_ref_wire db v with
        | Some e -> (
            match Ldb.property_value_content e with
            | Some s -> String.trim s = ""
            | None -> true)
        | None -> false)
    | _ -> false
  in
  let hide_with_property_id property_id =
    match entity db (Ident property_id) with
    | None -> false
    | Some property ->
        if show_empty_and_hidden_properties then false
        else if state_hide_empty_properties then
          empty_property_value (get_prop property_id)
        else if Ldb.truthy (Ldb.value property "logseq.property/hide-empty-value")
        then empty_property_value (get_prop property_id)
        else Ldb.truthy (Ldb.value property "logseq.property/hide?")
  in
  let property_hide_f ((property_id, property_value) : string * Wire.t) =
    if publishing then
      match property_value with
      | Wire.Nil -> true
      | _ -> hide_with_property_id property_id
    else if state_hide_empty_properties then (
      match entity db (Ident property_id) with
      | Some p when Ldb.truthy (Ldb.value p "logseq.property/hide?") ->
          hide_with_property_id property_id
      | _ -> empty_property_value property_value)
    else hide_with_property_id property_id
  in
  let block_hidden_properties, block_own_properties' =
    List.partition property_hide_f
      (List.map (fun (k, v) -> (prop_ident_of_key k, v)) block_own_properties)
  in
  let existing0 = List.map fst block_own_properties' in
  let class_properties, _ =
    List.fold_left
      (fun (result, existing) (class_ : entity) ->
        let cur =
          Ldb.ref_ents class_ "logseq.property.class/properties"
          |> Export_file.sort_properties
          |> List.filter_map Ldb.ident_of
          |> List.filter (fun id -> not (List.mem id existing))
        in
        ((if cur = [] then result else result @ cur), existing @ cur))
      ([], existing0) all_classes
  in
  let class_property_pairs =
    List.map (fun id -> (id, get_prop id)) class_properties
    |> List.filter (fun (id, _) ->
           not (List.mem id recycled_only_property_ids))
  in
  let full_properties =
    remove_built_in_or_other_position_properties
      (block_own_properties'
       @ List.filter
           (fun pair -> not (property_hide_f pair))
           class_property_pairs)
      false
  in
  let hidden_properties =
    remove_built_in_or_other_position_properties
      (block_hidden_properties
       @ List.filter property_hide_f class_property_pairs)
      true
    |> List.filter (fun (id, _) -> id <> "logseq.property/query")
  in
  Wire.Map
    [ field "full-properties"
        (Wire.Array (sort_display_property_pairs db full_properties))
    ; field "hidden-properties"
        (Wire.Array (sort_display_property_pairs db hidden_properties))
    ; field "description-property"
        (match display_property_map db "logseq.property/description" with
         | Some m -> m
         | None -> Wire.Nil)
    ; field "class-properties-property"
        (match display_property_map db "logseq.property.class/properties" with
         | Some m -> m
         | None -> Wire.Nil) ]
