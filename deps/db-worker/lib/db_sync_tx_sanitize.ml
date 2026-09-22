(* logseq.db-sync.tx-sanitize — sanitize raw tx items (entity-op vectors and
   entity maps, as datascript `value`s) before applying remote txs. *)

open Datascript

let retract_entity_ops = [ "db/retractEntity"; "db.fn/retractEntity" ]
let entity_op_kinds = [ "db/add"; "db/retract"; "db/cas"; "db.fn/cas" ]
let encrypted_attrs = [ "block/title"; "block/name" ]

let migration_deleted_attrs =
  [ "block/path-refs"; "block/pre-block?"
  ; "logseq.property.embedding/hnsw-label"
  ; "logseq.property.embedding/hnsw-label-updated-at" ]

let vec_items = function
  | Vector xs | List xs -> Some xs
  | _ -> None

let item_op = function
  | Vector (Keyword op :: _) | List (Keyword op :: _) -> Some op
  | _ -> None

let retract_entity_op item =
  match vec_items item with
  | Some [ op; _e ] ->
      (match op with Keyword k -> List.mem k retract_entity_ops | _ -> false)
  | _ -> false

let entity_op item =
  match vec_items item with
  | Some ((Keyword op :: _) as xs) ->
      List.length xs >= 4 && List.mem op entity_op_kinds
  | _ -> false

let nth_opt xs i = List.nth_opt xs i

let map_get (k : string) = function
  | Map kvs ->
      List.assoc_opt k
        (List.filter_map
           (fun (k, v) -> match k with Keyword s -> Some (s, v) | _ -> None)
           kvs)
  | _ -> None

let entity_ref_of_value = function
  | Int n -> Some (Entity_id n)
  | Keyword s -> Some (Ident s)
  | Vector [ Keyword a; v ] | List [ Keyword a; v ] -> Some (Lookup_ref (a, v))
  | _ -> None

let entity_ref_to_eid (db : db) (r : value) : entity_id option =
  match r with
  | Int n when n < 0 -> None
  | v ->
      (match entity_ref_of_value v with
       | Some r ->
           (match (try entity db r with _ -> None) with
            | Some e -> Some e.id
            | None -> None)
       | None -> None)

module Value_set = Set.Make (struct
  type t = value
  let compare = compare
end)

module Int_set = Set.Make (Int)

let ignored_kv_entities : Value_set.t =
  Value_set.of_list
    (List.map (fun s -> Keyword s)
       Sync_const.ignore_entities_when_init_upload)

let is_ignored_ident v = Value_set.mem v ignored_kv_entities

let tx_ignored_kv_entity_refs (tx_data : value list) : Value_set.t =
  List.fold_left
    (fun acc item ->
       match item with
       | Map _ ->
           (match map_get "db/ident" item with
            | Some ident when is_ignored_ident ident ->
                (match map_get "db/id" item with
                 | Some id -> Value_set.add id acc
                 | None -> acc)
            | _ -> acc)
       | _ ->
           if entity_op item then
             match vec_items item with
             | Some (_op :: e :: Keyword "db/ident" :: v :: _)
               when is_ignored_ident v -> Value_set.add e acc
             | _ -> acc
           else acc)
    ignored_kv_entities tx_data

let entity_ident db eid =
  match entity db (Entity_id eid) with
  | Some ent ->
      (match Ldb.value ent "db/ident" with Some (Keyword s) -> Some s | _ -> None)
  | None -> None

let ignored_kv_entity_ref db ignored_refs (r : value) : bool =
  Value_set.mem r ignored_refs
  || (match entity_ref_to_eid db r with
      | Some eid ->
          (match entity_ident db eid with
           | Some ident -> is_ignored_ident (Keyword ident)
           | None -> false)
      | None -> false)

let ignored_kv_entity_op db ignored_refs item : bool =
  match item with
  | Map _ ->
      (match map_get "db/id" item with
       | Some id -> ignored_kv_entity_ref db ignored_refs id
       | None -> false)
  | _ ->
      if retract_entity_op item then
        match vec_items item with
        | Some [ _; e ] -> ignored_kv_entity_ref db ignored_refs e
        | _ -> false
      else if entity_op item then
        match vec_items item with
        | Some (_ :: e :: _) -> ignored_kv_entity_ref db ignored_refs e
        | _ -> false
      else false

let strip_ignored_kv_entity_ops db tx_data =
  let ignored = tx_ignored_kv_entity_refs tx_data in
  List.filter (fun item -> not (ignored_kv_entity_op db ignored item)) tx_data

let drop_ops_on_retracted_entities db tx_data =
  let retract_eids =
    List.fold_left
      (fun acc item ->
         match vec_items item with
         | Some [ op; e ] when
             (match op with
              | Keyword k -> List.mem k retract_entity_ops
              | _ -> false) ->
             (match entity_ref_to_eid db e with
              | Some eid -> Int_set.add eid acc
              | None -> acc)
         | _ -> acc)
      Int_set.empty tx_data
  in
  if Int_set.is_empty retract_eids then tx_data
  else
    List.filter
      (fun item ->
         not
           (entity_op item
            && (match vec_items item with
                | Some (_ :: e :: _) ->
                    (match entity_ref_to_eid db e with
                     | Some eid -> Int_set.mem eid retract_eids
                     | None -> false)
                | _ -> false)))
      tx_data

let strip_migration_deleted_attrs tx_data =
  List.filter
    (fun item ->
       not
         (entity_op item
          && (match vec_items item with
              | Some (_ :: _ :: Keyword a :: _) ->
                  List.mem a migration_deleted_attrs
              | _ -> false)))
    tx_data

let drop_conflicted_encrypted_retracts tx_data =
  let groups = Hashtbl.create 31 in
  List.iter
    (fun item ->
       match vec_items item with
       | Some [ Keyword op; e; Keyword a; v ]
         when List.mem op entity_op_kinds && List.mem a encrypted_attrs ->
           let key = (e, a, v) in
           let entry =
             match Hashtbl.find_opt groups key with
             | Some (s, l) -> (s, l)
             | None -> ([], [])
           in
           Hashtbl.replace groups key (op :: fst entry, item :: snd entry)
       | _ -> ())
    tx_data;
  let conflicted =
    Hashtbl.fold
      (fun k (ops, _) acc ->
         if List.mem "db/add" ops && List.mem "db/retract" ops then
           k :: acc
         else acc)
      groups []
  in
  match conflicted with
  | [] -> tx_data
  | _ ->
      List.filter
        (fun item ->
           match vec_items item with
           | Some [ Keyword "db/retract"; e; Keyword a; v ] ->
               not (List.mem (e, a, v) conflicted)
           | _ -> true)
        tx_data

let touched_entity_eid db item : entity_id option =
  match item with
  | Map _ ->
      (match map_get "db/id" item with
       | Some id -> entity_ref_to_eid db id
       | None ->
           (match map_get "block/uuid" item with
            | Some u -> entity_ref_to_eid db (Vector [ Keyword "block/uuid"; u ])
            | None -> None))
  | _ ->
      if entity_op item then
        match vec_items item with
        | Some (_ :: e :: _) -> entity_ref_to_eid db e
        | _ -> None
      else None

let entity_has_uuid db eid =
  match entity db (Entity_id eid) with
  | Some ent ->
      (match Ldb.value ent "block/uuid" with Some (Uuid _) -> true | _ -> false)
  | None -> false

let sanitize_tx ?(drop_missing_retract_ops = false)
    ?(drop_ops_targeting_retracted_entities = false)
    ?(retract_touched_descendants = false) (db : db) (tx_data : value list)
    : value list =
  let tx_data = strip_migration_deleted_attrs tx_data in
  let tx_data =
    if not (Value_set.is_empty ignored_kv_entities) then
      strip_ignored_kv_entity_ops db tx_data
    else tx_data
  in
  let tx_data =
    if drop_missing_retract_ops then
      List.filter
        (fun item ->
           not
             (retract_entity_op item
              && (match vec_items item with
                  | Some [ _; e ] -> entity_ref_to_eid db e = None
                  | _ -> false)))
        tx_data
    else tx_data
  in
  let tx_data =
    if drop_ops_targeting_retracted_entities then
      drop_ops_on_retracted_entities db tx_data
    else tx_data
  in
  let tx_data = drop_conflicted_encrypted_retracts tx_data in
  let retract_eids =
    List.fold_left
      (fun acc item ->
         if retract_entity_op item then
           match vec_items item with
           | Some [ _; e ] ->
               (match entity_ref_to_eid db e with
                | Some eid -> Int_set.add eid acc
                | None -> acc)
           | _ -> acc
         else acc)
      Int_set.empty tx_data
  in
  let touched_eids =
    List.fold_left
      (fun acc item ->
         if retract_entity_op item then acc
         else
           match touched_entity_eid db item with
           | Some eid -> Int_set.add eid acc
           | None -> acc)
      Int_set.empty tx_data
  in
  let descendant_retract_eids =
    Int_set.fold
      (fun eid acc ->
         if entity_has_uuid db eid then
           List.fold_left (fun s id -> Int_set.add id s) acc
             (Ldb.get_block_full_children_ids db eid)
         else acc)
      retract_eids Int_set.empty
  in
  let preserved_eids =
    if retract_touched_descendants then retract_eids
    else Int_set.union retract_eids touched_eids
  in
  let missing_retract_eids =
    Int_set.diff descendant_retract_eids preserved_eids
    |> Int_set.elements |> List.sort compare
  in
  tx_data
  @ List.map
      (fun eid -> Vector [ Keyword "db/retractEntity"; Ref eid ])
      missing_retract_eids
