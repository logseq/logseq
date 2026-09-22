(* deps/outliner block maps — cljs { :block/uuid u :block/parent <ref> ... }
   entities threaded through the outliner write ops. Ported as immutable
   assoc lists of attr -> value (Jane-Street style: closed value type,
   no dynamic maps). *)

open Datascript

type t = (attr * value) list

let empty : t = []

let attr_value (m : t) (a : attr) : value option =
  match List.find_opt (fun (k, _) -> k = a) m with
  | Some (_, v) -> Some v
  | None -> None

let mem (m : t) (a : attr) : bool =
  List.exists (fun (k, _) -> k = a) m

let put (m : t) (a : attr) (v : value) : t =
  (a, v) :: List.remove_assoc a m

let remove_attr (m : t) (a : attr) : t =
  List.remove_assoc a m

let merge (base : t) (over : t) : t =
  List.fold_left (fun acc (k, v) -> put acc k v) base over

(* cljs (dissoc m k1 k2 ...) *)
let dissoc (m : t) (attrs : attr list) : t =
  List.filter (fun (k, _) -> not (List.mem k attrs)) m

let keys (m : t) : attr list = List.map fst m

(* ---- typed getters (cljs keyword get semantics) ---- *)

let string_attr (m : t) (a : attr) : string option =
  match attr_value m a with Some (String s) -> Some s | _ -> None

let int_attr (m : t) (a : attr) : int option =
  match attr_value m a with Some (Int n) -> Some n | _ -> None

let bool_attr (m : t) (a : attr) : bool option =
  match attr_value m a with Some (Bool b) -> Some b | _ -> None

let uuid_attr (m : t) (a : attr) : string option =
  match attr_value m a with Some (Uuid s) -> Some s | _ -> None

let blank_title (m : t) : bool =
  match string_attr m "block/title" with
  | Some s -> String.trim s = ""
  | None -> false

(* Values that act as entity refs: Ref, Ref_to, Int, Map{db/id},
   lookup vectors [ :block/uuid u ], and idents (Keyword). *)
(* Negative ids are cljs datascript tempids; the engine takes them as
   Temp_id, never Entity_id *)
let id_ref_of (n : entity_id) : entity_ref =
  if n < 0 then Temp_id (string_of_int n) else Entity_id n

let entity_ref_of_value (v : value) : entity_ref option =
  match v with
  | Ref n -> Some (id_ref_of n)
  | Int n -> Some (id_ref_of n)
  | Ref_to r -> Some r
  | Keyword s -> Some (Ident s)
  | String s -> Some (Temp_id s)
  | Vector [ Keyword a; v' ] | List [ Keyword a; v' ] ->
    Some (Lookup_ref (a, v'))
  | Map kvs ->
    (match List.find_opt (fun (k, _) -> k = Keyword "db/id") kvs with
     | Some (_, Int n) -> Some (id_ref_of n)
     | Some (_, Ref n) -> Some (id_ref_of n)
     | _ ->
       (match List.find_opt (fun (k, _) -> k = Keyword "block/uuid") kvs with
        | Some (_, Uuid u) -> Some (Lookup_ref ("block/uuid", Uuid u))
        | Some (_, String u) -> Some (Lookup_ref ("block/uuid", Uuid u))
        | _ -> None))
  | _ -> None

let ref_attr (m : t) (a : attr) : entity_ref option =
  match attr_value m a with
  | Some v -> entity_ref_of_value v
  | None -> None

let id_attr (m : t) (a : attr) : entity_id option =
  match ref_attr m a with
  | Some (Entity_id n) -> Some n
  | _ -> None

(* Many-valued ref position (:block/parent lists, :block/refs). *)
let ref_list_attr (m : t) (a : attr) : entity_ref list =
  match attr_value m a with
  | Some (List vs) | Some (Vector vs) | Some (Set vs) ->
    List.filter_map entity_ref_of_value vs
  | _ -> []

(* ---- conversions ---- *)

(* Normalize a decoded transit value into a block-map value: entity
   shapes ({:db/id n}, lookup vectors) collapse to Ref/Ref_to so getters
   see refs. Plain Maps stay Maps (nested tx entities). *)
let rec normalize_value (v : value) : value =
  match v with
  | Map kvs ->
    let is_kw_key name (k, _) = k = Keyword name in
    let has_only_db_id =
      List.length kvs = 1 && List.exists (is_kw_key "db/id") kvs
    in
    if has_only_db_id then
      (match entity_ref_of_value (Map kvs) with
       | Some (Entity_id n) -> Ref n
       | Some r -> Ref_to r
       | None -> Map kvs)
    else Map (List.map (fun (k, x) -> (k, normalize_value x)) kvs)
  | Vector [ Keyword a; x ] | List [ Keyword a; x ] ->
    (match x with
     | Uuid _ | String _ | Int _ | Keyword _ ->
       (* lookup-ref like [:block/uuid u] *)
       Ref_to (Lookup_ref (a, x))
     | _ -> Vector [ Keyword a; normalize_value x ])
  | Vector vs -> Vector (List.map normalize_value vs)
  | List vs -> List (List.map normalize_value vs)
  | Set vs -> Set (List.map normalize_value vs)
  | _ -> v

let of_transit (t : Wire.t) : t =
  match t with
  | Wire.Map kvs ->
    List.filter_map
      (fun (k, v) ->
        match k with
        | Wire.Keyword a -> Some (a, normalize_value (Ds_wire.value_of_transit v))
        | Wire.String a -> Some (a, normalize_value (Ds_wire.value_of_transit v))
        | _ -> None)
      kvs
  | _ -> invalid_arg "block-map expects a transit map"

(* entity -> block map (cljs (into {} e) + {:db/id ...} callers add
   db/id separately where needed) *)
let of_entity (e : entity) : t =
  let attrs =
    List.filter_map
      (fun (a, tv) ->
        match tv with
        | One_value v -> Some (a, v)
        | Many_values vs -> Some (a, List vs)
        | One_entity te ->
          (match te.db_id with
           | Some r -> Some (a, Ref_to r)
           | None -> None)
        | Many_entities tes ->
          Some (a, List (List.filter_map (fun te ->
              match te.db_id with Some r -> Some (Ref_to r) | None -> None) tes)))
      (entity_attrs e)
  in
  ("db/id", Ref e.id) :: attrs

(* block map value -> tx_value, resolving refs by attr schema *)
let rec value_to_tx_value (db : db) (a : attr) (v : value) : tx_value option =
  let tx_entity_of_ref (r : entity_ref) : tx_entity =
    { db_id = Some r; attrs = [] }
  and tx_entity_of_map (kvs : (value * value) list) : tx_entity option =
    (* nested map -> tx_entity with keyword keys *)
    let attrs, db_id =
      List.fold_left
        (fun (attrs, db_id) (k, v) ->
          match k with
          | Keyword "db/id" | String "db/id" ->
            (attrs, entity_ref_of_value (Map [ (k, v) ]) )
          | Keyword a | String a ->
            (match value_to_tx_value db a (normalize_value v) with
             | Some tv -> ((a, tv) :: attrs, db_id)
             | None -> (attrs, db_id))
          | _ -> (attrs, db_id))
        ([], None) kvs
    in
    if attrs = [] && db_id = None then None
    else Some { db_id; attrs = List.rev attrs }
  in
  let ref_ok = Ldb.ref_attr db a in
  match v with
  | Nil -> None
  | Ref n -> Some (One_entity (tx_entity_of_ref (id_ref_of n)))
  | Ref_to r -> Some (One_entity (tx_entity_of_ref r))
  | Keyword s when ref_ok -> Some (One_entity (tx_entity_of_ref (Ident s)))
  | Int n when ref_ok -> Some (One_entity (tx_entity_of_ref (id_ref_of n)))
  | Map kvs ->
    (match tx_entity_of_map kvs with
     | Some te -> Some (One_entity te)
     | None -> None)
  | List vs | Vector vs | Set vs ->
    let items = List.map (normalize_value) vs in
    let all_refs =
      List.for_all
        (fun x -> Option.is_some (entity_ref_of_value x))
        items
    in
    if all_refs && items <> [] then
      Some (Many_entities
              (List.map (fun x -> tx_entity_of_ref (Option.get (entity_ref_of_value x))) items))
    else
      Some (Many_values items)
  | _ -> Some (One_value v)

let to_tx_entity (db : db) (m : t) : tx_entity =
  let db_id = ref_attr m "db/id" in
  let attrs =
    List.filter_map
      (fun (a, v) ->
        if a = "db/id" then None
        else
          match value_to_tx_value db a v with
          | Some tv -> Some (a, tv)
          | None -> None)
      m
  in
  { db_id; attrs }

let to_tx_op (db : db) (m : t) : tx_op = Entity (to_tx_entity db m)
