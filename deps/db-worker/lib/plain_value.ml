(* Faithful port of frontend.worker.plain-value: entities become
   plain maps whose ref values are reduced to {db/id, block/uuid,
   block/title, db/ident, ...} summaries, plus the explicit *-id/-uuid
   fields. Output is Wire.t, ready for transit encoding. *)

open Datascript

let kw s = Wire.Keyword s
let field k v = (kw k, v)

let map_get (k : string) (pairs : (Wire.t * Wire.t) list) : Wire.t option =
  List.assoc_opt (kw k) pairs

let has_key k pairs = Option.is_some (map_get k pairs)

let assoc k v pairs = (kw k, v) :: List.remove_assoc (kw k) pairs

(* ref-value->summary *)
let ref_value_summary db (eid : entity_id) : Wire.t =
  match Ldb.ent_of_id db eid with
  | None -> Wire.Map [ field "db/id" (Wire.Int eid) ]
  | Some e ->
      let raw_title = Ldb.raw_title db e in
      let property_value =
        match
          Seq.uncons
            (datoms db Eavt ~e:e.id ~a:"logseq.property/value" ())
        with
        | Some (d, _) -> Some d.v
        | None -> None
      in
      let tag_idents =
        List.filter_map
          (fun id ->
            match Ldb.ent_of_id db id with
            | Some t -> (match Ldb.ident_of t with Some i -> Some (kw i) | None -> None)
            | None -> None)
          (Ldb.ref_ids e "block/tags")
      in
      let m = [ field "db/id" (Wire.Int e.id) ] in
      let m =
        match tag_idents with
        | [] -> m
        | ts -> field "block/tags" (Wire.Array ts) :: m
      in
      let m =
        match Ldb.value e "block/uuid" with
        | Some v -> field "block/uuid" (Ds_wire.transit_of_value v) :: m
        | None -> m
      in
      let m =
        match raw_title with
        | Some v ->
            field "block/title" (Ds_wire.transit_of_value v)
            :: field "block/raw-title" (Ds_wire.transit_of_value v)
            :: m
        | None -> m
      in
      let m =
        match Ldb.value e "block/name" with
        | Some v -> field "block/name" (Ds_wire.transit_of_value v) :: m
        | None -> m
      in
      let m =
        match Ldb.value e "block/journal-day" with
        | Some v -> field "block/journal-day" (Ds_wire.transit_of_value v) :: m
        | None -> m
      in
      let m =
        match Ldb.value e "logseq.property/icon" with
        | Some v -> field "logseq.property/icon" (Ds_wire.transit_of_value v) :: m
        | None -> m
      in
      let m =
        match Ldb.value e "logseq.property/choice-checkbox-state" with
        | Some v ->
            field "logseq.property/choice-checkbox-state"
              (Ds_wire.transit_of_value v)
            :: m
        | None -> m
      in
      let m =
        match property_value with
        | Some v -> field "logseq.property/value" (Ds_wire.transit_of_value v) :: m
        | None -> m
      in
      let m =
        match Ldb.value e "logseq.property.asset/type" with
        | Some v -> field "logseq.property.asset/type" (Ds_wire.transit_of_value v) :: m
        | None -> m
      in
      let m =
        match Ldb.value e "logseq.property.asset/width" with
        | Some v -> field "logseq.property.asset/width" (Ds_wire.transit_of_value v) :: m
        | None -> m
      in
      let m =
        match Ldb.value e "logseq.property.asset/height" with
        | Some v -> field "logseq.property.asset/height" (Ds_wire.transit_of_value v) :: m
        | None -> m
      in
      let m =
        match Ldb.value e "logseq.property.asset/resize-metadata" with
        | Some v ->
            field "logseq.property.asset/resize-metadata"
              (Ds_wire.transit_of_value v)
            :: m
        | None -> m
      in
      let m =
        match Ldb.value e "logseq.property.asset/external-url" with
        | Some v ->
            field "logseq.property.asset/external-url"
              (Ds_wire.transit_of_value v)
            :: m
        | None -> m
      in
      let m =
        match Ldb.value e "db/ident" with
        | Some v -> field "db/ident" (Ds_wire.transit_of_value v) :: m
        | None -> m
      in
      Wire.Map (List.rev m)

(* node-property-target-id *)
let node_property_target_id db (value_id : entity_id) : entity_id =
  match Ldb.ent_of_id db value_id with
  | Some pv when Option.is_some (Ldb.value pv "logseq.property/created-from-property") ->
      (match Ldb.string_value pv "block/title" with
       | Some title when Ldb.is_uuid_string title ->
           (match
              entity db (Lookup_ref ("block/uuid", Uuid title))
            with
            | Some target -> target.id
            | None -> invalid_arg ("Missing node property target: " ^ title))
       | _ -> value_id)
  | _ -> value_id

(* attribute-value->plain *)
let attribute_value_to_plain db (a : attr) (v : value) : Wire.t =
  if Ldb.ref_attr db a then
    match v with
    | Ref id ->
        let property = entity db (Ident a) in
        let ref_id =
          match property with
          | Some p
            when Ldb.value p "logseq.property/type" = Some (Keyword "node") ->
              node_property_target_id db id
          | _ -> id
        in
        ref_value_summary db ref_id
    | _ -> Ds_wire.transit_of_value v
  else
    Ds_wire.transit_of_value v

(* number->letters / number->roman *)
let number_to_letters n =
  if n <= 0 then None
  else
    let rec loop n acc =
      if n <= 0 then acc
      else
        let offset = (n - 1) mod 26 in
        let ch = Char.chr (65 + offset) in
        loop ((n - offset) / 26) (String.make 1 ch ^ acc)
    in
    Some (loop n "")

let number_to_roman n =
  if n <= 0 then None
  else
    let pairs =
      [ (1000, "M"); (900, "CM"); (500, "D"); (400, "CD"); (100, "C");
        (90, "XC"); (50, "L"); (40, "XL"); (10, "X"); (9, "IX");
        (5, "V"); (4, "IV"); (1, "I") ]
    in
    let rec loop n pairs acc =
      match n, pairs with
      | 0, _ -> acc
      | _, [] -> acc
      | n, (value, numeral) :: more ->
          if n >= value then loop (n - value) pairs (acc ^ numeral)
          else loop n more acc
    in
    Some (loop n pairs "")

(* order-list-type-label *)
let order_list_type_label (v : value) : string option =
  match v with
  | String s -> Some s
  | Keyword s -> Some s
  | _ -> None

(* order-list-type *)
let order_list_type (block : entity) : string option =
  match Ldb.value block "logseq.property/order-list-type" with
  | Some ((String _ | Keyword _) as v) ->
      (match order_list_type_label v with
       | Some s -> Some (String.lowercase_ascii s)
       | None -> None)
  | Some (Ref id) ->
      (match Ldb.ent_of_id block.db id with
       | Some e ->
           (match
              Ldb.string_value e "block/title",
              Ldb.string_value e "block/name",
              Ldb.ident_of e
            with
            | Some t, _, _ -> Some (String.lowercase_ascii t)
            | None, Some n, _ -> Some (String.lowercase_ascii n)
            | None, None, Some i ->
                Some
                  (String.lowercase_ascii
                     (match String.rindex_opt i '/' with
                      | Some idx -> String.sub i (idx + 1) (String.length i - idx - 1)
                      | None -> i))
            | None, None, None -> None)
       | None -> None)
  | _ -> None

(* order-list-index *)
let order_list_index (block : entity) (target_type : string) : Wire.t option =
  let order_block (b : entity) =
    match order_list_type b with
    | Some t -> t = target_type
    | None -> false
  in
  let prev = Ldb.get_left_sibling block in
  (* cljs order-sibling-list/order-parent-list: consecutive order-block
     chain starting at block, walking left siblings / parents. *)
  let rec order_sibling_list b =
    if order_block b then
      match Ldb.get_left_sibling b with
      | Some p -> b :: order_sibling_list p
      | None -> [ b ]
    else
      []
  in
  let rec order_parent_list b =
    if order_block b then
      match Ldb.ref_ent b "block/parent" with
      | Some p -> b :: order_parent_list p
      | None -> [ b ]
    else
      []
  in
  let idx =
    match prev with
    | Some _ -> List.length (order_sibling_list block)
    | None -> 1
  in
  let order_parents_count = List.length (order_parent_list block) - 1 in
  let delta = if order_parents_count < 0 then 0 else order_parents_count mod 3 in
  match delta with
  | 0 -> Some (Wire.Int idx)
  | 1 ->
      (match number_to_letters idx with
       | Some s -> Some (Wire.String (String.lowercase_ascii s))
       | None -> None)
  | _ -> (match number_to_roman idx with Some s -> Some (Wire.String s) | None -> None)

let unsafe_plain_attrs =
  [ "block/properties"; "block/properties-text-values" ]

(* db-property/property? — user-visible property ident. *)
let logseq_property_namespaces =
  [ "logseq.property"; "logseq.property.tldraw"; "logseq.property.pdf";
    "logseq.property.fsrs"; "logseq.property.linked-references";
    "logseq.property.asset"; "logseq.property.table"; "logseq.property.node";
    "logseq.property.code"; "logseq.property.repeat";
    "logseq.property.journal"; "logseq.property.class";
    "logseq.property.view"; "logseq.property.user"; "logseq.property.history";
    "logseq.property.reaction"; "logseq.property.sync"; "logseq.property.publish";
    "logseq.property.recycle"; "logseq.property.comments"; "logseq.property.agent" ]

(* db-attribute properties visible to user: the built-in-properties
   entries whose :schema :public? is true. *)
let public_db_attribute_properties = [ "block/alias"; "block/tags" ]

let ns_of a =
  match String.rindex_opt a '/' with
  | Some i -> Some (String.sub a 0 i)
  | None -> None

let includes s sub =
  let n = String.length s and m = String.length sub in
  let rec loop i =
    i + m <= n && (String.sub s i m = sub || loop (i + 1))
  in
  m = 0 || loop 0

let db_property_pred (a : attr) : bool =
  match ns_of a with
  | Some ns ->
      List.mem ns logseq_property_namespaces
      || includes ns ".property"
      || List.mem a public_db_attribute_properties
  | None -> List.mem a public_db_attribute_properties

(* entity-forward-map *)
let entity_forward_map ?(properties : attr list option)
    ?(exclude_attrs : attr list option) ?(include_derived : bool option)
    db (e : entity) : Wire.t =
  let include_derived = Option.value include_derived ~default:true in
  let exclude_attrs = Option.value exclude_attrs ~default:[] in
  let excluded a =
    List.mem a unsafe_plain_attrs || List.mem a exclude_attrs
  in
  let keep a =
    (not (excluded a))
    && (match properties with
        | Some ps -> List.mem a ps
        | None -> true)
  in
  let raw_title =
    match Ldb.raw_title db e with
    | Some t -> Some t
    | None -> Ldb.value e "block/name"
  in
  let list_type = order_list_type e in
  let all_datoms = List.of_seq (datoms db Eavt ~e:e.id ()) in
  let datoms = List.filter (fun (d : datom) -> keep d.a) all_datoms in
  let m =
    List.fold_left
      (fun acc (d : datom) ->
        let v' = attribute_value_to_plain db d.a d.v in
        if Ldb.many_attr db d.a then
          match map_get d.a acc with
          | Some (Wire.Array xs) -> assoc d.a (Wire.Array (xs @ [ v' ])) acc
          | _ -> assoc d.a (Wire.Array [ v' ]) acc
        else
          assoc d.a v' acc)
      [ field "db/id" (Wire.Int e.id) ]
      datoms
  in
  let m =
    if include_derived then
      (* cljs computes own-property-keys over all of the entity's datoms,
         not the properties/exclude-attrs filtered `datoms` binding. *)
      let own_property_keys =
        all_datoms
        |> List.map (fun (d : datom) -> d.a)
        |> List.sort_uniq compare
        |> List.filter db_property_pred
        |> List.map kw
      in
      field "block.temp/property-keys" (Wire.Array own_property_keys) :: m
    else
      m
  in
  let m =
    match raw_title with
    | Some v ->
        field "block/title" (Ds_wire.transit_of_value v)
        :: field "block/raw-title" (Ds_wire.transit_of_value v)
        :: m
    | None -> m
  in
  let m =
    match include_derived, list_type with
    | true, Some lt ->
        let idx =
          match order_list_index e lt with
          | Some idx -> idx
          | None -> Wire.Nil
        in
        field "block.temp/order-list-index" idx :: m
    | _ -> m
  in
  Wire.Map m

(* ---- with-explicit-ref-fields (Wire.Map level) ---- *)

let ref_db_id (v : Wire.t) : Wire.t option =
  match v with
  | Wire.Map _ -> map_get "db/id" (Wire.as_map v)
  | Wire.Int _ -> Some v
  | _ -> None

let ref_uuid (v : Wire.t) : Wire.t option =
  match v with Wire.Map _ -> map_get "block/uuid" (Wire.as_map v) | _ -> None

let ref_ident (v : Wire.t) : Wire.t option =
  match v with Wire.Map _ -> map_get "db/ident" (Wire.as_map v) | _ -> None

let ref_title (v : Wire.t) : Wire.t option =
  match v with Wire.Map _ -> map_get "block/title" (Wire.as_map v) | _ -> None

let opt_fields pairs f = List.filter_map f pairs

let with_explicit_ref_fields (pairs : (Wire.t * Wire.t) list)
    : (Wire.t * Wire.t) list =
  let m = ref pairs in
  let add k v = m := (kw k, v) :: !m in
  (* cljs assoc's these keys unconditionally — nil values are emitted *)
  let add_opt k v = add k (Option.value ~default:Wire.Nil v) in
  let alias_source =
    match map_get "block/_alias" pairs with
    | Some (Wire.Array (v :: _)) -> Some v
    | Some (Wire.List (v :: _)) -> Some v
    | Some (Wire.Set (v :: _)) -> Some v
    | _ -> None
  in
  if has_key "block/parent" pairs then begin
    let p = Option.value (map_get "block/parent" pairs) ~default:Wire.Nil in
    add_opt "block/parent-id" (ref_db_id p);
    add_opt "block/parent-uuid" (ref_uuid p)
  end;
  if has_key "block/page" pairs then begin
    let p = Option.value (map_get "block/page" pairs) ~default:Wire.Nil in
    add_opt "block/page-id" (ref_db_id p);
    add_opt "block/page-uuid" (ref_uuid p);
    add_opt "block/page-name" (map_get "block/name" (match p with Wire.Map ps -> ps | _ -> []))
  end;
  if has_key "block/link" pairs then
    add_opt "block/link-id"
      (ref_db_id (Option.value (map_get "block/link" pairs) ~default:Wire.Nil));
  if has_key "logseq.property/query" pairs then
    add_opt "logseq.property/query-id"
      (ref_db_id
         (Option.value (map_get "logseq.property/query" pairs) ~default:Wire.Nil));
  if has_key "logseq.property/view-for" pairs then
    add_opt "logseq.property/view-for-id"
      (ref_db_id
         (Option.value (map_get "logseq.property/view-for" pairs) ~default:Wire.Nil));
  if has_key "logseq.property.view/type" pairs then begin
    let v = Option.value (map_get "logseq.property.view/type" pairs) ~default:Wire.Nil in
    add_opt "logseq.property.view/type-id" (ref_db_id v);
    add_opt "logseq.property.view/type-ident" (ref_ident v)
  end;
  if has_key "logseq.property.view/gallery-asset-property" pairs then
    add_opt "logseq.property.view/gallery-asset-property-ident"
      (ref_ident
         (Option.value
            (map_get "logseq.property.view/gallery-asset-property" pairs)
            ~default:Wire.Nil));
  if has_key "logseq.property/_view-for" pairs then
    add "logseq.property/views"
      (Option.value (map_get "logseq.property/_view-for" pairs) ~default:Wire.Nil);
  if has_key "block/_alias" pairs then begin
    add_opt "block/alias-source-page-id"
      (Option.bind alias_source ref_db_id);
    add_opt "block/alias-source-page-uuid"
      (Option.bind alias_source ref_uuid);
    let classp =
      match alias_source with
      | Some (Wire.Map sm) ->
          (match map_get "block/tags" sm with
           | Some (Wire.Array ts) -> List.mem (kw "logseq.class/Tag") ts
           | Some (Wire.List ts) -> List.mem (kw "logseq.class/Tag") ts
           | _ -> false)
      | _ -> false
    in
    add "block/alias-source-page-class?" (Wire.Bool classp)
  end;
  if has_key "logseq.property/_query" pairs then begin
    (* cljs assoc's (seq v) — the seq itself, or nil when empty. *)
    let v = Option.value (map_get "logseq.property/_query" pairs) ~default:Wire.Nil in
    let v' =
      match v with
      | Wire.Array (_ :: _) | Wire.List (_ :: _) | Wire.Set (_ :: _) -> v
      | _ -> Wire.Nil
    in
    add "logseq.property/query-block?" v'
  end;
  if has_key "logseq.property.comments/_blocks" pairs then
    add "block/comment-threads"
      (Option.value
         (map_get "logseq.property.comments/_blocks" pairs)
         ~default:Wire.Nil);
  if has_key "logseq.property/description" pairs then
    add_opt "logseq.property/description-title"
      (ref_title
         (Option.value
            (map_get "logseq.property/description" pairs)
            ~default:Wire.Nil));
  if has_key "logseq.property.recycle/original-page" pairs then
    add_opt "logseq.property.recycle/original-page-title"
      (ref_title
         (Option.value
            (map_get "logseq.property.recycle/original-page" pairs)
            ~default:Wire.Nil));
  pairs @ !m

let rec with_explicit_ref_fields_recursive (t : Wire.t) : Wire.t =
  let t =
    match t with
    | Wire.Array xs -> Wire.Array (List.map with_explicit_ref_fields_recursive xs)
    | Wire.List xs -> Wire.List (List.map with_explicit_ref_fields_recursive xs)
    | Wire.Set xs -> Wire.Set (List.map with_explicit_ref_fields_recursive xs)
    | Wire.Map pairs ->
        Wire.Map
          (List.map
             (fun (k, v) -> (k, with_explicit_ref_fields_recursive v))
             pairs)
    | Wire.Tagged (tag, rep) ->
        Wire.Tagged (tag, with_explicit_ref_fields_recursive rep)
    | _ -> t
  in
  match t with
  | Wire.Map pairs -> Wire.Map (with_explicit_ref_fields pairs)
  | _ -> t

(* entity -> plain map + explicit ref fields (worker-plain-map for
   entities). *)
let worker_plain_entity ?properties ?exclude_attrs ?include_derived db e =
  Wire.Map
    (with_explicit_ref_fields
       (match entity_forward_map ?properties ?exclude_attrs ?include_derived db e with
        | Wire.Map pairs -> pairs
        | t -> [ (kw "value", t) ]))
