(* deps/db common/normalize — normalize && denormalize eids for sync.
   Operates on tx items as wire vectors:
     [e a v tx added]        — datom-like (5)
     [:db/retractEntity e]   — retract entity (2)
   e' results are lookup refs ([block/uuid uuid] | ident keyword),
   tempid strings, or raw values. *)

open Datascript

let kw s = Wire.Keyword s

let item_len = function
  | Wire.Array l | Wire.List l -> List.length l
  | _ -> 0

let nth_wire item i =
  match item with
  | Wire.Array l | Wire.List l -> (
      match List.nth_opt l i with
      | Some x -> x
      | None -> Wire.Nil)
  | _ -> Wire.Nil

let take_wire item n =
  match item with
  | Wire.Array l | Wire.List l when List.length l >= n ->
      Wire.Array (List.filteri (fun i _ -> i < n) l)
  | _ -> item

let wire_key (w : Wire.t) : string = Transit_codec.to_string w

(* d/entity on a wire entity-ref *)
let entity_of_wire (db : db) (w : Wire.t) : entity option =
  try
    match w with
    | Wire.Nil -> None
    | _ -> Datascript.entity db (Ds_wire.entity_ref_of_transit w)
  with _ -> None

let entity_block_uuid (e : entity) : Wire.t option =
  match Datascript.entity_attr e "block/uuid" with
  | Some (One_value (Uuid s)) -> Some (Wire.Uuid s)
  | Some (One_value (String s)) -> Some (Wire.Uuid s)
  | _ -> None

let entity_ident (e : entity) : Wire.t option =
  match Datascript.entity_attr e "db/ident" with
  | Some (One_value (Keyword s)) -> Some (kw s)
  | Some (One_value (String s)) -> Some (kw s)
  | _ -> None

let entity_value_type_ref (db : db) (attr : attr) : bool =
  match entity_of_wire db (kw attr) with
  | Some e -> (
      match Datascript.entity_attr e "db/valueType" with
      | Some (One_value (Keyword "db.type/ref")) -> true
      | _ -> false)
  | None -> false

(* [:block/uuid id] lookup ref from entity, else ident keyword *)
let eid_lookup (db : db) (e : Wire.t) : Wire.t option =
  match entity_of_wire db e with
  | None -> None
  | Some entity -> (
      match entity_block_uuid entity with
      | Some u -> Some (Wire.Array [ kw "block/uuid"; u ])
      | None -> entity_ident entity)

let eid_tempid (db : db) (e : Wire.t) : Wire.t option =
  match entity_of_wire db e with
  | None -> None
  | Some entity -> (
      match entity_block_uuid entity with
      | Some (Wire.Uuid s) -> Some (Wire.String s)
      | _ -> (
          match entity_ident entity with
          | Some (Wire.Keyword s) -> Some (Wire.String s)
          | _ -> None))

(* remove-retract-entity-ref — drop datoms referencing retracted entities
   that no longer exist in db *)
let remove_retract_entity_ref (db : db) (tx_data : Wire.t list) : Wire.t list =
  let retracted =
    List.filter_map
      (fun item ->
         match item with
         | Wire.Array [ op; value ] | Wire.List [ op; value ]
           when op = kw "db/retractEntity"
                && entity_of_wire db value = None ->
             Some value
         | _ -> None)
      tx_data
  in
  match retracted with
  | [] -> tx_data
  | _ ->
      let retracted_keys = List.map wire_key retracted in
      let retract_uuid_strs =
        List.filter_map
          (fun v ->
             match v with
             | Wire.Array [ _; u ] -> (
                 match u with
                 | Wire.Uuid s -> Some s
                 | Wire.String s -> Some s
                 | _ -> None)
             | _ -> None)
          retracted
      in
      let retracted_ids =
        retracted_keys @ List.map (fun s -> wire_key (Wire.String s)) retract_uuid_strs
      in
      List.filter
        (fun item ->
           not
             (item_len item = 5
              && (List.mem (wire_key (nth_wire item 1)) retracted_keys
                  || List.mem (wire_key (nth_wire item 1)) retracted_ids
                  || List.mem (wire_key (nth_wire item 3)) retracted_keys
                  || List.mem (wire_key (nth_wire item 3)) retracted_ids)))
        tx_data

(* replace-attr-retract-with-retract-entity-v2 *)
let replace_attr_retract_with_retract_entity_v2 (db : db)
    (normalized_tx_data : Wire.t list) : Wire.t list =
  normalized_tx_data
  |> List.map (fun item ->
         let op = nth_wire item 0 in
         let eid = nth_wire item 1 in
         let a = nth_wire item 2 in
         let v = nth_wire item 3 in
         if op = kw "db/retract" && a = kw "block/uuid" then
           Wire.Array [ kw "db/retractEntity"; eid ]
         else if a <> Wire.Nil && v <> Wire.Nil then
           Wire.Array [ op; eid; a; v; nth_wire item 4 ]
         else Wire.Array [ op; eid ])
  |> remove_retract_entity_ref db

(* replace-attr-retract-with-retract-entity (v1) — on datom-like items *)
let replace_attr_retract_with_retract_entity (db_after : db)
    (tx_data : Wire.t list) : Wire.t list =
  let retract_eids_by_entity =
    List.filter_map
      (fun d ->
         let a = nth_wire d 1 in
         let added = nth_wire d 4 in
         if a = kw "block/uuid" && added = Wire.Bool false then
           let v = nth_wire d 2 in
           let entity =
             entity_of_wire db_after (Wire.Array [ kw "block/uuid"; v ])
           in
           let e = nth_wire d 0 in
           let entity_id =
             match entity with
             | Some e' -> Some (Wire.Int e'.id)
             | None -> None
           in
           (match entity_id with
            | Some id when id = e -> None (* eid unchanged *)
            | _ ->
                Some
                  ( wire_key e
                  , (match entity with
                     | Some _ -> e
                     | None -> Wire.Array [ kw "block/uuid"; v ]) ))
         else None)
      tx_data
  in
  let rec loop result seen remaining =
    match remaining with
    | [] -> List.rev result
    | d :: more -> (
        let e = nth_wire d 0 in
        match List.assoc_opt (wire_key e) retract_eids_by_entity with
        | Some eid ->
            if List.mem (wire_key e) seen then loop result seen more
            else
              loop
                (Wire.Array [ kw "db/retractEntity"; eid ] :: result)
                (wire_key e :: seen) more
        | None -> loop (d :: result) seen more)
  in
  loop [] [] tx_data

(* sort-datoms — properties first (stable) *)
let sort_datoms (datoms : Wire.t list) : Wire.t list =
  let rank item =
    match nth_wire item 1 with
    | Wire.Keyword "db/ident" -> 0
    | Wire.Keyword "db/valueType" -> 1
    | Wire.Keyword "db/cardinality" -> 2
    | _ -> 3
  in
  List.stable_sort (fun a b -> compare (rank a) (rank b)) datoms

(* remove-conflict-datoms — group by eavt (first 4), keep last, sort by tx *)
let remove_conflict_datoms (datoms : Wire.t list) : Wire.t list =
  let tbl : (string, Wire.t list) Hashtbl.t = Hashtbl.create 64 in
  let order : string list ref = ref [] in
  List.iter
    (fun d ->
       let k = wire_key (take_wire d 4) in
       match Hashtbl.find_opt tbl k with
       | Some group -> Hashtbl.replace tbl k (group @ [ d ])
       | None ->
           Hashtbl.add tbl k [ d ];
           order := !order @ [ k ])
    datoms;
  let kept =
    List.filter_map
      (fun k ->
         match Hashtbl.find_opt tbl k with
         | Some group -> List.nth_opt group (List.length group - 1)
         | None -> None)
      !order
  in
  List.stable_sort
    (fun a b -> compare (nth_wire a 3) (nth_wire b 3))
    kept

let retract_entity_op item =
  item_len item = 2 && nth_wire item 0 = kw "db/retractEntity"

let retract_entity_match_keys (e : Wire.t) : Wire.t list =
  match e with
  | Wire.Array [ a; block_uuid ] when a = kw "block/uuid" -> (
      match block_uuid with
      | Wire.Uuid s | Wire.String s ->
          [ e; block_uuid; Wire.String s ]
      | _ -> [ e; block_uuid ])
  | _ -> [ e ]

(* reorder-retract-entity — recreated-block retracts first, datoms of the
   retracted eids next, then everything else, then remaining retracts *)
let reorder_retract_entity (tx_data : Wire.t list) : Wire.t list =
  let retract_ops = List.filter retract_entity_op tx_data in
  let recreated_block_uuids =
    List.filter_map
      (fun item ->
         if item_len item >= 4
            && nth_wire item 0 = kw "db/add"
            && nth_wire item 2 = kw "block/uuid" then
           Some (nth_wire item 3)
         else None)
      tx_data
  in
  let recreated_keys = List.map wire_key recreated_block_uuids in
  let is_recreated item =
    match nth_wire item 1 with
    | Wire.Array [ a; u ] as e when a = kw "block/uuid" ->
        ignore e;
        List.mem (wire_key u) recreated_keys
    | _ -> false
  in
  let recreated_block_retract_ops, end_retract_ops =
    List.partition is_recreated retract_ops
  in
  let retract_keys =
    List.concat_map
      (fun item -> retract_entity_match_keys (nth_wire item 1))
      retract_ops
    |> List.map wire_key
  in
  let datom_for_retracted_eid item =
    item_len item >= 4 && List.mem (wire_key (nth_wire item 1)) retract_keys
  in
  let datoms_for_retracted_eids = List.filter datom_for_retracted_eid tx_data in
  let others =
    List.filter
      (fun item ->
         not (retract_entity_op item || datom_for_retracted_eid item))
      tx_data
  in
  recreated_block_retract_ops @ datoms_for_retracted_eids @ others
  @ end_retract_ops

let resolve_eid (db_before : db) (db_after : db) ~(retract : bool)
    (e : Wire.t) : Wire.t option =
  if retract then eid_lookup db_before e
  else
    match eid_lookup db_before e with
    | Some _ as r -> r
    | None -> eid_tempid db_after e

let ref_value_type (db_after : db) (db_before : db) (attr : attr) : bool =
  entity_value_type_ref db_after attr || entity_value_type_ref db_before attr

let normalize_datom (db_after : db) (db_before : db) (item : Wire.t)
    : Wire.t option =
  let e = nth_wire item 0 in
  let a = nth_wire item 1 in
  let v = nth_wire item 2 in
  let t = nth_wire item 3 in
  let added =
    match nth_wire item 4 with
    | Wire.Bool b -> b
    | _ -> false
  in
  let a_str =
    match a with
    | Wire.Keyword s -> s
    | _ -> ""
  in
  let retract = not added in
  let e' = resolve_eid db_before db_after ~retract e in
  let v' =
    match v with
    | Wire.Int n when n > 0 && ref_value_type db_after db_before a_str ->
        resolve_eid db_before db_after ~retract v
    | _ -> Some v
  in
  match (e', v') with
  | Some e'', Some v'' ->
      Some
        (Wire.Array
           [ (if added then kw "db/add" else kw "db/retract")
           ; e''; a; v''; t ])
  | _ -> None

let normalize_retract_entity_item (db_before : db) (d : Wire.t)
    : Wire.t option =
  match d with
  | Wire.Array [ op; e ] | Wire.List [ op; e ]
    when op = kw "db/retractEntity" -> (
      match eid_lookup db_before e with
      | Some e' -> Some (Wire.Array [ op; e' ])
      | None -> None)
  | _ -> None

let normalize_tx_item (db_after : db) (db_before : db) (d : Wire.t)
    : Wire.t option =
  match item_len d with
  | 5 -> normalize_datom db_after db_before d
  | 2 -> normalize_retract_entity_item db_before d
  | _ -> None

let distinct_wire (items : Wire.t list) : Wire.t list =
  let seen = Hashtbl.create (List.length items) in
  List.filter
    (fun i ->
       let k = wire_key i in
       if Hashtbl.mem seen k then false
       else begin
         Hashtbl.add seen k ();
         true
       end)
    items

let normalize_tx_data (db_after : db) (db_before : db) (tx_data : Wire.t list)
    : Wire.t list =
  tx_data
  |> remove_conflict_datoms
  |> replace_attr_retract_with_retract_entity db_after
  |> sort_datoms
  |> List.filter_map (normalize_tx_item db_after db_before)
  |> remove_retract_entity_ref db_after
  |> reorder_retract_entity
  |> distinct_wire

(* datom <-> wire helpers for callers working with tx-report datoms *)
let wire_of_datom (d : datom) : Wire.t =
  Wire.Array
    [ Wire.Int d.e; kw d.a; Ds_wire.transit_of_value d.v; Wire.Int d.tx
    ; Wire.Bool d.added ]

let wire_of_datoms (ds : datom list) : Wire.t list = List.map wire_of_datom ds
